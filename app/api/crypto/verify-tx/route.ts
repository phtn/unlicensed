import {NextRequest, NextResponse} from 'next/server'
import {createPublicClient, decodeFunctionData, http, parseAbi} from 'viem'
import {mainnet, polygon, sepolia} from 'viem/chains'
import {z} from 'zod'
import {Tx, TxData, TxReceipt} from '../types'

export const runtime = 'nodejs'

const ETHERSCAN_API_BASE = 'https://api.etherscan.io/v2/api'
const CHAIN_IDS = {ethereum: 1, polygon: 137, sepolia: 11155111} as const
type EvmNetwork = keyof typeof CHAIN_IDS
type EvmPaymentToken = 'ethereum' | 'usdc' | 'usdt'

const requestSchema = z.object({
  txnHash: z
    .string()
    .min(64, 'Transaction hash must be at least 64 characters'),
  network: z.enum(['ethereum', 'polygon', 'bitcoin', 'sepolia']),
  paymentToken: z.enum(['ethereum', 'usdc', 'usdt']).optional(),
  /** Optional: expected transfer recipient (for EVM) or source address (for BTC). */
  expectedRecipient: z.string().optional(),
  /** Optional: minimum payment amount in base units for the selected token. */
  expectedValueWei: z.string().optional(),
})

const EVM_CHAINS = {
  ethereum: mainnet,
  polygon,
  sepolia,
} as const

const MEMPOOL_API_BASE_URL =
  process.env.BITCOIN_RELAY_API_BASE_URL ?? 'https://mempool.space/api'
const ERC20_TRANSFER_ABI = parseAbi([
  'function transfer(address to, uint256 amount) returns (bool)',
])

const normalizeEvmHash = (h: string): `0x${string}` =>
  h.startsWith('0x') ? (h as `0x${string}`) : (`0x${h}` as `0x${string}`)

const normalizeBtcTxId = (h: string): string =>
  h.replace(/^0x/i, '').toLowerCase()

const normalizeAddress = (a: string): string => a.toLowerCase()

type ScanApiConfig = {
  base: string
  chainId: number
  apiKey: string
}

function getScanApiConfig(network: EvmNetwork): ScanApiConfig | null {
  const apiKey = process.env.ETHERSCAN_API_KEY
  if (!apiKey) return null
  return {
    base: ETHERSCAN_API_BASE,
    chainId: CHAIN_IDS[network],
    apiKey,
  }
}

async function fetchViaScanApi<T>(
  config: ScanApiConfig,
  action: string,
  txhash: string,
): Promise<T | null> {
  const url = new URL(config.base)
  url.searchParams.set('chainid', String(config.chainId))
  url.searchParams.set('module', 'proxy')
  url.searchParams.set('action', action)
  url.searchParams.set('txhash', txhash)
  url.searchParams.set('apikey', config.apiKey)

  const res = await fetch(url.toString(), {cache: 'no-store'})
  if (!res.ok) return null

  const json = (await res.json()) as {result?: T; error?: {message?: string}}
  if (json.error?.message) return null
  return json.result ?? null
}

function parseValueToBigInt(value: string | undefined): bigint {
  if (!value) return BigInt(0)
  return BigInt(value)
}

function verifyEvmTransfer(args: {
  txTo?: string | null
  txInput?: string
  txValue?: string
  paymentToken: EvmPaymentToken
  expectedRecipient?: string
  expectedValueWei?: string
}):
  | {
      success: true
      recipient: string | null
      value: string
      contractAddress: string | null
    }
  | {success: false; error: string} {
  const {
    txTo,
    txInput,
    txValue,
    paymentToken,
    expectedRecipient,
    expectedValueWei,
  } = args

  if (paymentToken === 'usdc' || paymentToken === 'usdt') {
    if (!txInput) {
      return {
        success: false,
        error: 'Transaction details unavailable for token transfer verification',
      }
    }

    try {
      const decoded = decodeFunctionData({
        abi: ERC20_TRANSFER_ABI,
        data: txInput as `0x${string}`,
      })
      const [transferTo, transferAmount] = decoded.args as [string, bigint]

      if (
        expectedRecipient &&
        normalizeAddress(transferTo) !== normalizeAddress(expectedRecipient)
      ) {
        return {
          success: false,
          error: 'Transaction recipient does not match expected wallet address',
        }
      }

      if (
        expectedValueWei &&
        transferAmount < parseValueToBigInt(expectedValueWei)
      ) {
        return {
          success: false,
          error:
            'Transaction value is less than the order total. Please ensure you sent the correct amount.',
        }
      }

      return {
        success: true,
        recipient: transferTo,
        value: transferAmount.toString(),
        contractAddress: txTo ?? null,
      }
    } catch {
      return {
        success: false,
        error: 'Unable to decode token transfer input data',
      }
    }
  }

  if (expectedRecipient && txTo) {
    if (normalizeAddress(txTo) !== normalizeAddress(expectedRecipient)) {
      return {
        success: false,
        error: 'Transaction recipient does not match expected wallet address',
      }
    }
  }

  if (expectedValueWei) {
    const minValue = parseValueToBigInt(expectedValueWei)
    const paymentValue = parseValueToBigInt(txValue)
    if (paymentValue < minValue) {
      return {
        success: false,
        error:
          'Transaction value is less than the order total. Please ensure you sent the correct amount.',
      }
    }
  }

  return {
    success: true,
    recipient: txTo ?? null,
    value: txValue ?? '0',
    contractAddress: null,
  }
}

async function verifyEvmViaScanApi(
  hash: string,
  network: EvmNetwork,
  paymentToken: EvmPaymentToken,
  expectedRecipient?: string,
  expectedValueWei?: string,
): Promise<
  | {
      success: true
      data: TxData
    }
  | {success: false; error: string}
  | null
> {
  const config = getScanApiConfig(network)
  if (!config) return null

  const [receipt, transaction] = await Promise.all([
    fetchViaScanApi<TxReceipt>(config, 'eth_getTransactionReceipt', hash),
    fetchViaScanApi<Tx>(config, 'eth_getTransactionByHash', hash),
  ])

  if (!receipt || !transaction) {
    return null
  }

  if (!receipt.status || receipt.status !== '0x1') {
    return {
      success: false,
      error: 'Transaction failed or was reverted',
    }
  }

  const txTo = transaction.to ?? receipt.to
  const verifiedTransfer = verifyEvmTransfer({
    txTo,
    txInput: transaction.input,
    txValue: transaction.value,
    paymentToken,
    expectedRecipient,
    expectedValueWei,
  })

  if (!verifiedTransfer.success) {
    return verifiedTransfer
  }

  return {
    success: true,
    data: {
      id: hash,
      to: verifiedTransfer.recipient ?? txTo,
      value: verifiedTransfer.value,
      gasUsed: receipt.gasUsed.toString(),
      gasPrice: transaction.gasPrice.toString(),
      status: receipt.status,
      from: receipt.from,
      blockNumber: receipt.blockNumber.toString(),
      contractAddress:
        verifiedTransfer.contractAddress ?? receipt.contractAddress,
    },
  }
}

async function verifyEvmViaViem(
  hash: `0x${string}`,
  network: EvmNetwork,
  paymentToken: EvmPaymentToken,
  expectedRecipient?: string,
  expectedValueWei?: string,
): Promise<
  | {
      success: true
      data: TxData
    }
  | {success: false; error: string}
> {
  const chain = EVM_CHAINS[network]
  const publicClient = createPublicClient({
    chain,
    transport: http(),
  })

  const [transaction, receipt] = await Promise.all([
    publicClient.getTransaction({hash}).catch(() => null),
    publicClient.getTransactionReceipt({hash}).catch(() => null),
  ])

  if (!receipt) {
    return {success: false, error: 'Transaction not found or not yet confirmed'}
  }

  if (receipt.status !== 'success') {
    return {success: false, error: 'Transaction failed or was reverted'}
  }

  const txTo = transaction?.to ?? receipt.to
  const verifiedTransfer = verifyEvmTransfer({
    txTo,
    txInput: transaction?.input,
    txValue:
      transaction?.value !== undefined ? String(transaction.value) : undefined,
    paymentToken,
    expectedRecipient,
    expectedValueWei,
  })

  if (!verifiedTransfer.success) {
    return verifiedTransfer
  }

  return {
    success: true,
    data: {
      id: hash,
      from: transaction?.from ?? receipt.from,
      to: verifiedTransfer.recipient ?? txTo ?? '',
      value: verifiedTransfer.value,
      gasUsed: receipt.gasUsed.toString(),
      gasPrice:
        transaction?.gasPrice !== undefined ? String(transaction.gasPrice) : '0',
      status: receipt.status,
      blockNumber: receipt.blockNumber.toString(),
      contractAddress: verifiedTransfer.contractAddress,
    },
  }
}

async function verifyEvmTransaction(
  txnHash: string,
  network: EvmNetwork,
  paymentToken: EvmPaymentToken,
  expectedRecipient?: string,
  expectedValueWei?: string,
): Promise<
  | {
      success: true
      data: TxData
    }
  | {success: false; error: string}
> {
  const hash = normalizeEvmHash(txnHash)

  if (hash.length !== 66) {
    return {success: false, error: 'Invalid EVM transaction hash format'}
  }

  const scanApiResult = await verifyEvmViaScanApi(
    hash,
    network,
    paymentToken,
    expectedRecipient,
    expectedValueWei,
  )

  if (scanApiResult !== null) {
    return scanApiResult
  }

  return verifyEvmViaViem(
    hash,
    network,
    paymentToken,
    expectedRecipient,
    expectedValueWei,
  )
}

async function verifyBitcoinTransaction(
  txid: string,
  expectedRecipient?: string,
): Promise<
  {success: true; data: {from?: string}} | {success: false; error: string}
> {
  const normalizedTxId = normalizeBtcTxId(txid)

  if (normalizedTxId.length !== 64) {
    return {success: false, error: 'Invalid Bitcoin transaction ID format'}
  }

  const response = await fetch(`${MEMPOOL_API_BASE_URL}/tx/${normalizedTxId}`, {
    cache: 'no-store',
  })

  if (!response.ok) {
    if (response.status === 404) {
      return {
        success: false,
        error: 'Transaction not found or not yet confirmed',
      }
    }
    return {
      success: false,
      error: 'Unable to verify Bitcoin transaction. Please try again later.',
    }
  }

  const tx = (await response.json()) as {status?: {confirmed?: boolean}}
  if (!tx.status?.confirmed) {
    return {
      success: false,
      error: 'Transaction not yet confirmed on the blockchain',
    }
  }

  return {success: true, data: {from: expectedRecipient}}
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = requestSchema.safeParse(body)

    if (!parsed.success) {
      const message = parsed.error?.message ?? 'Invalid request payload'
      return NextResponse.json({success: false, error: message}, {status: 400})
    }

    const {
      txnHash,
      network,
      paymentToken = 'ethereum',
      expectedRecipient,
      expectedValueWei,
    } = parsed.data

    const result =
      network === 'bitcoin'
        ? await verifyBitcoinTransaction(txnHash.trim(), expectedRecipient)
        : await verifyEvmTransaction(
            txnHash.trim(),
            network,
            paymentToken,
            expectedRecipient?.trim(),
            expectedValueWei,
          )

    if (!result.success) {
      return NextResponse.json(result, {status: 400})
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[verify-tx] Error:', error)
    return NextResponse.json(
      {success: false, error: 'Verification failed. Please try again.'},
      {status: 500},
    )
  }
}

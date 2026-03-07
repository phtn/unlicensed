import {NextRequest, NextResponse} from 'next/server'
import {createPublicClient, http} from 'viem'
import {mainnet, polygon, sepolia} from 'viem/chains'
import {z} from 'zod'
import {Tx, TxData, TxReceipt} from '../types'

export const runtime = 'nodejs'

const ETHERSCAN_API_BASE = 'https://api.etherscan.io/v2/api'
const CHAIN_IDS = {ethereum: 1, polygon: 137, sepolia: 11155111} as const
type EvmNetwork = keyof typeof CHAIN_IDS

const requestSchema = z.object({
  txnHash: z
    .string()
    .min(64, 'Transaction hash must be at least 64 characters'),
  network: z.enum(['ethereum', 'polygon', 'bitcoin', 'sepolia']),
  /** Optional: expected recipient address (for EVM) or source address (for BTC) */
  expectedRecipient: z.string().optional(),
  /** Optional: minimum tx value in wei (EVM only). Ensures payment meets order total. */
  expectedValueWei: z.string().optional(),
})

const EVM_CHAINS = {
  ethereum: mainnet,
  polygon,
  sepolia,
} as const

const MEMPOOL_API_BASE_URL =
  process.env.BITCOIN_RELAY_API_BASE_URL ?? 'https://mempool.space/api'

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

async function verifyEvmViaScanApi(
  hash: string,
  network: EvmNetwork,
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
  if (expectedRecipient && txTo) {
    if (normalizeAddress(txTo) !== normalizeAddress(expectedRecipient)) {
      return {
        success: false,
        error: 'Transaction recipient does not match expected wallet address',
      }
    }
  }

  if (expectedValueWei) {
    const txValue = parseValueToBigInt(transaction.value)
    const minValue = parseValueToBigInt(expectedValueWei)
    if (txValue < minValue) {
      return {
        success: false,
        error:
          'Transaction value is less than the order total. Please ensure you sent the correct amount.',
      }
    }
  }

  return {
    success: true,
    data: {
      id: hash,
      to: txTo,
      value: transaction.value,
      gasUsed: receipt.gasUsed.toString(),
      gasPrice: transaction.gasPrice.toString(),
      status: receipt.status,
      from: receipt.from,
      blockNumber: receipt.blockNumber.toString(),
      contractAddress: receipt.contractAddress,
    },
  }
}

async function verifyEvmViaViem(
  hash: `0x${string}`,
  network: EvmNetwork,
  expectedRecipient?: string,
  expectedValueWei?: string,
): Promise<{success: true} | {success: false; error: string}> {
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

  if (expectedRecipient && transaction?.to) {
    if (
      normalizeAddress(transaction.to) !== normalizeAddress(expectedRecipient)
    ) {
      return {
        success: false,
        error: 'Transaction recipient does not match expected wallet address',
      }
    }
  }

  if (expectedValueWei && transaction?.value !== undefined) {
    const txValue =
      typeof transaction.value === 'bigint'
        ? transaction.value
        : parseValueToBigInt(String(transaction.value))
    const minValue = parseValueToBigInt(expectedValueWei)
    if (txValue < minValue) {
      return {
        success: false,
        error:
          'Transaction value is less than the order total. Please ensure you sent the correct amount.',
      }
    }
  }

  return {success: true}
}

async function verifyEvmTransaction(
  txnHash: string,
  network: EvmNetwork,
  expectedRecipient?: string,
  expectedValueWei?: string,
): Promise<{success: true} | {success: false; error: string}> {
  const hash = normalizeEvmHash(txnHash)

  if (hash.length !== 66) {
    return {success: false, error: 'Invalid EVM transaction hash format'}
  }

  const scanApiResult = await verifyEvmViaScanApi(
    hash,
    network,
    expectedRecipient,
    expectedValueWei,
  )

  if (scanApiResult !== null) {
    return scanApiResult
  }

  return verifyEvmViaViem(hash, network, expectedRecipient, expectedValueWei)
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

    const {txnHash, network, expectedRecipient, expectedValueWei} = parsed.data

    const result =
      network === 'bitcoin'
        ? await verifyBitcoinTransaction(txnHash.trim(), expectedRecipient)
        : await verifyEvmTransaction(
            txnHash.trim(),
            network,
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

import {getUsdcAddress, isUsdcSupportedChain} from '@/lib/usdc'
import {getUsdtAddress, isUsdtSupportedChain} from '@/lib/usdt'
import {privateKeyToAccount} from 'viem/accounts'
import {
  createPublicClient,
  createWalletClient,
  decodeFunctionData,
  http,
  isAddress,
  parseAbi,
  type Address,
} from 'viem'
import {mainnet, polygon, polygonAmoy, sepolia} from 'viem/chains'
import {NextRequest, NextResponse} from 'next/server'
import {z} from 'zod'

export const runtime = 'nodejs'

const requestSchema = z.object({
  paymentHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  chainId: z.number().int(),
  token: z.enum(['ethereum', 'usdc', 'usdt']),
})

const RELAY_FEE_BPS = 650
const BPS_DENOMINATOR = 10_000
const RELAY_PAYOUT_BPS = BPS_DENOMINATOR - RELAY_FEE_BPS

const SUPPORTED_CHAINS = {
  [mainnet.id]: mainnet,
  [sepolia.id]: sepolia,
  [polygon.id]: polygon,
  [polygonAmoy.id]: polygonAmoy,
}

const TRANSFER_ABI = parseAbi([
  'function transfer(address to, uint256 amount) returns (bool)',
])

const relayedHashes = new Map<string, `0x${string}`>()

const normalizeAddress = (address: string): string => address.toLowerCase()

const computeRelayAmount = (receivedAmount: bigint): bigint =>
  (receivedAmount * BigInt(RELAY_PAYOUT_BPS)) / BigInt(BPS_DENOMINATOR)

const getRequiredAddress = (value: string | undefined, name: string): Address => {
  if (!value || !isAddress(value)) {
    throw new Error(`${name} is missing or invalid`)
  }
  return value as Address
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = requestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        {error: 'Invalid relay request payload'},
        {status: 400},
      )
    }

    const {paymentHash, chainId, token} = parsed.data

    const existingRelayHash = relayedHashes.get(paymentHash)
    if (existingRelayHash) {
      return NextResponse.json({
        success: true,
        relayHash: existingRelayHash,
        alreadyRelayed: true,
      })
    }

    const chain = SUPPORTED_CHAINS[chainId as keyof typeof SUPPORTED_CHAINS]
    if (!chain) {
      return NextResponse.json({error: 'Unsupported chain'}, {status: 400})
    }

    const relayPrivateKey = process.env.RELAY_PRIVATE_KEY
    if (!relayPrivateKey) {
      return NextResponse.json(
        {error: 'RELAY_PRIVATE_KEY is not configured'},
        {status: 500},
      )
    }

    const privateKey = relayPrivateKey.startsWith('0x')
      ? relayPrivateKey
      : (`0x${relayPrivateKey}` as const)
    const relayAccount = privateKeyToAccount(privateKey as `0x${string}`)

    const configuredRelaySource = process.env.RELAY_SOURCE_ADDRESS
      ? getRequiredAddress(process.env.RELAY_SOURCE_ADDRESS, 'RELAY_SOURCE_ADDRESS')
      : relayAccount.address
    if (
      normalizeAddress(configuredRelaySource) !==
      normalizeAddress(relayAccount.address)
    ) {
      return NextResponse.json(
        {
          error:
            'RELAY_SOURCE_ADDRESS must match RELAY_PRIVATE_KEY account address',
        },
        {status: 500},
      )
    }

    const relayDestination = getRequiredAddress(
      process.env.RELAY_FORWARD_ADDRESS,
      'RELAY_FORWARD_ADDRESS',
    )

    const publicClient = createPublicClient({
      chain,
      transport: http(),
    })
    const walletClient = createWalletClient({
      account: relayAccount,
      chain,
      transport: http(),
    })

    const [transaction, receipt] = await Promise.all([
      publicClient.getTransaction({hash: paymentHash as `0x${string}`}),
      publicClient.getTransactionReceipt({hash: paymentHash as `0x${string}`}),
    ])

    if (receipt.status !== 'success') {
      return NextResponse.json(
        {error: 'Payment transaction is not successful'},
        {status: 400},
      )
    }

    let receivedAmount = BigInt(0)
    if (token === 'ethereum') {
      if (
        !transaction.to ||
        normalizeAddress(transaction.to) !== normalizeAddress(configuredRelaySource)
      ) {
        return NextResponse.json(
          {error: 'Payment was not sent to relay source address'},
          {status: 400},
        )
      }

      receivedAmount = transaction.value
    } else {
      const tokenAddress =
        token === 'usdc'
          ? isUsdcSupportedChain(chainId)
            ? getUsdcAddress(chainId)
            : undefined
          : isUsdtSupportedChain(chainId)
            ? getUsdtAddress(chainId)
            : undefined

      if (!tokenAddress) {
        return NextResponse.json(
          {error: `Token ${token.toUpperCase()} is not supported on this chain`},
          {status: 400},
        )
      }

      if (
        !transaction.to ||
        normalizeAddress(transaction.to) !== normalizeAddress(tokenAddress)
      ) {
        return NextResponse.json(
          {error: 'Payment transaction target does not match token contract'},
          {status: 400},
        )
      }

      let decoded: ReturnType<typeof decodeFunctionData>
      try {
        decoded = decodeFunctionData({
          abi: TRANSFER_ABI,
          data: transaction.input,
        })
      } catch {
        return NextResponse.json(
          {error: 'Unable to decode token transfer input data'},
          {status: 400},
        )
      }
      const [transferTo, transferAmount] = decoded.args as [Address, bigint]

      if (
        normalizeAddress(transferTo) !== normalizeAddress(configuredRelaySource)
      ) {
        return NextResponse.json(
          {error: 'Token transfer recipient is not relay source address'},
          {status: 400},
        )
      }

      receivedAmount = transferAmount
    }

    if (receivedAmount <= BigInt(0)) {
      return NextResponse.json(
        {error: 'Received amount is zero; relay aborted'},
        {status: 400},
      )
    }

    const relayAmount = computeRelayAmount(receivedAmount)
    if (relayAmount <= BigInt(0)) {
      return NextResponse.json(
        {error: 'Relay amount after fee is zero; relay aborted'},
        {status: 400},
      )
    }

    let relayHash: `0x${string}`
    if (token === 'ethereum') {
      relayHash = await walletClient.sendTransaction({
        account: relayAccount,
        to: relayDestination,
        value: relayAmount,
        chain,
      })
    } else {
      const tokenAddress =
        token === 'usdc' ? getUsdcAddress(chainId) : getUsdtAddress(chainId)
      if (!tokenAddress) {
        return NextResponse.json(
          {error: 'Unable to resolve token address for relay'},
          {status: 400},
        )
      }

      relayHash = await walletClient.writeContract({
        account: relayAccount,
        chain,
        address: tokenAddress,
        abi: TRANSFER_ABI,
        functionName: 'transfer',
        args: [relayDestination, relayAmount],
      })
    }

    relayedHashes.set(paymentHash, relayHash)

    return NextResponse.json({
      success: true,
      paymentHash,
      relayHash,
      receivedAmount: receivedAmount.toString(),
      relayAmount: relayAmount.toString(),
      relayFeeBps: RELAY_FEE_BPS,
    })
  } catch (error) {
    console.error('Relay forwarding error:', error)
    return NextResponse.json(
      {
        error: 'Relay forwarding failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      {status: 500},
    )
  }
}

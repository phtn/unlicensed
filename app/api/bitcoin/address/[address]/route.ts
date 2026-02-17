import {NextResponse} from 'next/server'
import {formatUnits} from 'viem'

export const runtime = 'nodejs'

const BTC_ADDRESS_PATTERN =
  /^(bc1[ac-hj-np-z02-9]{11,71}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/

const SATOSHIS_PER_BTC_DECIMALS = 8

interface MempoolAddressResponse {
  chain_stats?: {
    funded_txo_sum?: number
    spent_txo_sum?: number
  }
  mempool_stats?: {
    funded_txo_sum?: number
    spent_txo_sum?: number
  }
}

const toBigInt = (value: number | undefined): bigint =>
  BigInt(value ?? 0)

export async function GET(
  _request: Request,
  context: {params: Promise<{address: string}>},
) {
  const {address} = await context.params

  if (!BTC_ADDRESS_PATTERN.test(address)) {
    return NextResponse.json({error: 'Invalid Bitcoin address'}, {status: 400})
  }

  try {
    const response = await fetch(
      `https://mempool.space/api/address/${encodeURIComponent(address)}`,
      {cache: 'no-store'},
    )

    if (!response.ok) {
      return NextResponse.json(
        {error: 'Unable to fetch Bitcoin address balance'},
        {status: 502},
      )
    }

    const payload = (await response.json()) as MempoolAddressResponse

    const confirmedSats =
      toBigInt(payload.chain_stats?.funded_txo_sum) -
      toBigInt(payload.chain_stats?.spent_txo_sum)
    const pendingSats =
      toBigInt(payload.mempool_stats?.funded_txo_sum) -
      toBigInt(payload.mempool_stats?.spent_txo_sum)
    const balanceSats = confirmedSats + pendingSats

    return NextResponse.json({
      address,
      symbol: 'BTC',
      balanceSats: balanceSats.toString(),
      confirmedSats: confirmedSats.toString(),
      pendingSats: pendingSats.toString(),
      balanceBtc: formatUnits(balanceSats, SATOSHIS_PER_BTC_DECIMALS),
    })
  } catch (error) {
    console.error('Bitcoin balance lookup failed:', error)
    return NextResponse.json(
      {error: 'Bitcoin balance lookup failed'},
      {status: 500},
    )
  }
}

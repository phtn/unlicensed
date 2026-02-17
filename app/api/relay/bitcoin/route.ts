import * as bitcoin from 'bitcoinjs-lib'
import ECPairFactory from 'ecpair'
import {NextRequest, NextResponse} from 'next/server'
import * as ecc from 'tiny-secp256k1'
import {z} from 'zod'

export const runtime = 'nodejs'

bitcoin.initEccLib(ecc)
const ECPair = ECPairFactory(ecc)

const requestSchema = z.object({
  paymentHash: z.string().regex(/^(0x)?[a-fA-F0-9]{64}$/),
})

const RELAY_FEE_BPS = +(String(process.env.MB) ?? 650)
const BPS_DENOMINATOR = 10_000
const RELAY_PAYOUT_BPS = BPS_DENOMINATOR - RELAY_FEE_BPS
const RELAY_PAYOUT_BPS_BIGINT = BigInt(RELAY_PAYOUT_BPS)
const BPS_DENOMINATOR_BIGINT = BigInt(BPS_DENOMINATOR)
const DUST_THRESHOLD_SATS = BigInt(546)
const DEFAULT_FEE_RATE_SAT_PER_VB = 10
const MAX_PAYMENT_LOOKUP_ATTEMPTS = 5
const PAYMENT_LOOKUP_RETRY_DELAY_MS = 1_000
const MEMPOOL_API_BASE_URL =
  process.env.BITCOIN_RELAY_API_BASE_URL ?? 'https://mempool.space/api'

const BITCOIN_ADDRESS_PATTERN =
  /^(bc1[ac-hj-np-z02-9]{11,71}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/i

const relayedHashes = new Map<string, `0x${string}`>()

interface MempoolTxOutput {
  scriptpubkey_address?: string
  value?: number
}

interface MempoolTx {
  txid: string
  vout: MempoolTxOutput[]
}

interface MempoolUtxo {
  txid: string
  vout: number
  value: number
}

interface MempoolFeesResponse {
  fastestFee?: number
  halfHourFee?: number
  hourFee?: number
}

interface RelayWalletConfig {
  keyPair: ReturnType<typeof ECPair.fromWIF>
  sourceAddress: string
  sourceScript: Uint8Array
  destinationAddress: string
}

interface RelaySelection {
  utxos: MempoolUtxo[]
  totalInputSats: bigint
  relayAmountSats: bigint
  changeSats: bigint
}

const normalizeTxId = (value: string): string =>
  value.replace(/^0x/i, '').toLowerCase()

const normalizeAddressForCompare = (address: string): string =>
  address.startsWith('bc1') ? address.toLowerCase() : address

const isValidBitcoinAddress = (value: string): boolean =>
  BITCOIN_ADDRESS_PATTERN.test(value)

const getRequiredConfig = (value: string | undefined, name: string): string => {
  if (!value) throw new Error(`${name} is missing`)
  return value
}

const fetchJson = async <T>(path: string): Promise<T> => {
  const response = await fetch(`${MEMPOOL_API_BASE_URL}${path}`, {
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(
      `Mempool request failed for ${path} with status ${response.status}`,
    )
  }

  return (await response.json()) as T
}

const fetchText = async (path: string, init?: RequestInit): Promise<string> => {
  const response = await fetch(`${MEMPOOL_API_BASE_URL}${path}`, {
    cache: 'no-store',
    ...init,
  })

  const text = await response.text()
  if (!response.ok) {
    throw new Error(
      `Mempool request failed for ${path} with status ${response.status}: ${text}`,
    )
  }

  return text
}

const sleep = async (ms: number): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

const getRelayWalletConfig = (): RelayWalletConfig => {
  const relayWif = getRequiredConfig(process.env.B, 'BTC_EP or BTC_RELAY_WIF')

  const destinationAddress = getRequiredConfig(
    process.env.BTC_DESTINATION_ADDRESS,
    'BTC_DESTINATION_ADDRESS',
  )
  if (!isValidBitcoinAddress(destinationAddress)) {
    throw new Error('BTC_DESTINATION_ADDRESS is invalid')
  }

  const keyPair = ECPair.fromWIF(relayWif, bitcoin.networks.bitcoin)
  const p2wpkh = bitcoin.payments.p2wpkh({
    pubkey: Buffer.from(keyPair.publicKey),
    network: bitcoin.networks.bitcoin,
  })

  if (!p2wpkh.address || !p2wpkh.output) {
    throw new Error('Unable to derive a relay source address from BTC key')
  }

  const configuredSourceAddress = process.env.SRC_B

  if (
    configuredSourceAddress &&
    normalizeAddressForCompare(configuredSourceAddress) !==
      normalizeAddressForCompare(p2wpkh.address)
  ) {
    throw new Error(
      'BTC_SRC must match the BTC relay private key derived SegWit address',
    )
  }

  return {
    keyPair,
    sourceAddress: p2wpkh.address,
    sourceScript: p2wpkh.output,
    destinationAddress,
  }
}

const computeRelayAmount = (receivedSats: bigint): bigint =>
  (receivedSats * RELAY_PAYOUT_BPS_BIGINT) / BPS_DENOMINATOR_BIGINT

const estimateFee = (
  inputCount: number,
  outputCount: number,
  feeRateSatPerVb: number,
): bigint => {
  const transactionOverheadVbytes = 10
  const p2wpkhInputVbytes = 68
  const conservativeOutputVbytes = 43
  const estimatedVbytes =
    transactionOverheadVbytes +
    inputCount * p2wpkhInputVbytes +
    outputCount * conservativeOutputVbytes

  return BigInt(Math.ceil(estimatedVbytes * feeRateSatPerVb))
}

const getRecommendedFeeRate = async (): Promise<number> => {
  try {
    const fees = await fetchJson<MempoolFeesResponse>('/v1/fees/recommended')
    const candidateFeeRate = Number(
      fees.fastestFee ?? fees.halfHourFee ?? fees.hourFee ?? 0,
    )
    if (!Number.isFinite(candidateFeeRate) || candidateFeeRate <= 0) {
      return DEFAULT_FEE_RATE_SAT_PER_VB
    }
    return Math.max(1, Math.min(500, Math.ceil(candidateFeeRate)))
  } catch {
    return DEFAULT_FEE_RATE_SAT_PER_VB
  }
}

const selectRelayUtxos = ({
  availableUtxos,
  relayAmountSats,
  feeRateSatPerVb,
}: {
  availableUtxos: MempoolUtxo[]
  relayAmountSats: bigint
  feeRateSatPerVb: number
}): RelaySelection => {
  if (relayAmountSats < DUST_THRESHOLD_SATS) {
    throw new Error('Relay amount is too small to forward on Bitcoin')
  }

  const selectedUtxos: MempoolUtxo[] = []
  let totalInputSats = BigInt(0)

  const sortedUtxos = [...availableUtxos].sort((a, b) => b.value - a.value)

  for (const utxo of sortedUtxos) {
    selectedUtxos.push(utxo)
    totalInputSats += BigInt(utxo.value)

    const feeWithChange = estimateFee(selectedUtxos.length, 2, feeRateSatPerVb)
    if (totalInputSats >= relayAmountSats + feeWithChange) {
      break
    }
  }

  if (selectedUtxos.length === 0) {
    throw new Error('No UTXOs available for BTC relay source address')
  }

  const feeWithChange = estimateFee(selectedUtxos.length, 2, feeRateSatPerVb)
  const changeWithChangeOutput =
    totalInputSats - relayAmountSats - feeWithChange

  if (changeWithChangeOutput >= DUST_THRESHOLD_SATS) {
    return {
      utxos: selectedUtxos,
      totalInputSats,
      relayAmountSats,
      changeSats: changeWithChangeOutput,
    }
  }

  const feeNoChange = estimateFee(selectedUtxos.length, 1, feeRateSatPerVb)
  const minimumRequired = relayAmountSats + feeNoChange
  if (totalInputSats < minimumRequired) {
    throw new Error('Insufficient BTC balance for relay payout and network fee')
  }

  return {
    utxos: selectedUtxos,
    totalInputSats,
    relayAmountSats,
    changeSats: BigInt(0),
  }
}

const findPaymentToSource = async ({
  txid,
  sourceAddress,
}: {
  txid: string
  sourceAddress: string
}): Promise<bigint> => {
  const sourceKey = normalizeAddressForCompare(sourceAddress)
  let tx: MempoolTx | null = null

  for (let attempt = 0; attempt < MAX_PAYMENT_LOOKUP_ATTEMPTS; attempt += 1) {
    try {
      tx = await fetchJson<MempoolTx>(`/tx/${txid}`)
      break
    } catch {
      if (attempt === MAX_PAYMENT_LOOKUP_ATTEMPTS - 1) {
        throw new Error('Unable to fetch incoming BTC payment transaction')
      }
      await sleep(PAYMENT_LOOKUP_RETRY_DELAY_MS)
    }
  }

  if (!tx) {
    throw new Error('Payment transaction was not found')
  }

  const receivedSats = tx.vout.reduce((total, output) => {
    if (!output.scriptpubkey_address || output.value == null) {
      return total
    }

    return normalizeAddressForCompare(output.scriptpubkey_address) === sourceKey
      ? total + BigInt(output.value)
      : total
  }, BigInt(0))

  if (receivedSats <= BigInt(0)) {
    throw new Error('BTC payment was not sent to relay source address')
  }

  return receivedSats
}

const buildAndBroadcastRelayTransaction = async ({
  relayWallet,
  selection,
}: {
  relayWallet: RelayWalletConfig
  selection: RelaySelection
}): Promise<string> => {
  const psbt = new bitcoin.Psbt({network: bitcoin.networks.bitcoin})

  for (const utxo of selection.utxos) {
    psbt.addInput({
      hash: utxo.txid,
      index: utxo.vout,
      witnessUtxo: {
        script: relayWallet.sourceScript,
        value: BigInt(utxo.value),
      },
    })
  }

  psbt.addOutput({
    address: relayWallet.destinationAddress,
    value: selection.relayAmountSats,
  })

  if (selection.changeSats >= DUST_THRESHOLD_SATS) {
    psbt.addOutput({
      address: relayWallet.sourceAddress,
      value: selection.changeSats,
    })
  }

  psbt.signAllInputs(relayWallet.keyPair)
  psbt.finalizeAllInputs()

  const rawHex = psbt.extractTransaction().toHex()
  const broadcastedTxId = await fetchText('/tx', {
    method: 'POST',
    headers: {'Content-Type': 'text/plain'},
    body: rawHex,
  })

  if (!/^[a-fA-F0-9]{64}$/.test(broadcastedTxId)) {
    throw new Error('Unexpected relay broadcast transaction id')
  }

  return broadcastedTxId.toLowerCase()
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = requestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        {error: 'Invalid Bitcoin relay request payload'},
        {status: 400},
      )
    }

    const paymentTxId = normalizeTxId(parsed.data.paymentHash)
    const paymentHash = `0x${paymentTxId}` as `0x${string}`

    const existingRelayHash = relayedHashes.get(paymentTxId)
    if (existingRelayHash) {
      return NextResponse.json({
        success: true,
        paymentHash,
        relayHash: existingRelayHash,
        alreadyRelayed: true,
      })
    }

    const relayWallet = getRelayWalletConfig()
    const receivedAmountSats = await findPaymentToSource({
      txid: paymentTxId,
      sourceAddress: relayWallet.sourceAddress,
    })

    const relayAmountSats = computeRelayAmount(receivedAmountSats)
    if (relayAmountSats <= BigInt(0)) {
      return NextResponse.json(
        {error: 'Relay amount after fee is zero; relay aborted'},
        {status: 400},
      )
    }

    const sourceUtxos = await fetchJson<MempoolUtxo[]>(
      `/address/${encodeURIComponent(relayWallet.sourceAddress)}/utxo`,
    )
    if (!Array.isArray(sourceUtxos) || sourceUtxos.length === 0) {
      return NextResponse.json(
        {error: 'No relay UTXOs available for BTC source address'},
        {status: 400},
      )
    }

    const feeRateSatPerVb = await getRecommendedFeeRate()
    const selection = selectRelayUtxos({
      availableUtxos: sourceUtxos,
      relayAmountSats,
      feeRateSatPerVb,
    })

    const relayTxId = await buildAndBroadcastRelayTransaction({
      relayWallet,
      selection,
    })

    const relayHash = `0x${relayTxId}` as `0x${string}`
    relayedHashes.set(paymentTxId, relayHash)

    return NextResponse.json({
      success: true,
      paymentHash,
      relayHash,
      relayFeeBps: RELAY_FEE_BPS,
      receivedAmountSats: receivedAmountSats.toString(),
      relayAmountSats: relayAmountSats.toString(),
      sourceAddress: relayWallet.sourceAddress,
      destinationAddress: relayWallet.destinationAddress,
      feeRateSatPerVb,
      selectedUtxoCount: selection.utxos.length,
    })
  } catch (error) {
    console.error('Bitcoin relay forwarding error:', error)
    return NextResponse.json(
      {
        error: 'Bitcoin relay forwarding failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      {status: 500},
    )
  }
}

import {api} from '@/convex/_generated/api'
import type {Doc, Id} from '@/convex/_generated/dataModel'
import {ConvexHttpClient} from 'convex/browser'

type PaymentStatus = Doc<'orders'>['payment']['status']
type CallbackPayload = Record<string, unknown>

const ORDER_NUMBER_KEYS = [
  'order_id',
  'orderId',
  'order_number',
  'orderNumber',
  'order',
  'number',
  'invoice_id',
  'invoiceId',
] as const

const ORDER_DOC_ID_KEYS = ['order_doc_id', 'orderDocId', 'order_doc'] as const
const SESSION_KEYS = ['session_id', 'sessionId'] as const
const STATUS_KEYS = ['status'] as const
const TX_IN_KEYS = ['txid_in', 'txidIn', 'transaction_id', 'transactionId'] as const
const TX_OUT_KEYS = ['txid_out', 'txidOut'] as const
const ADDRESS_IN_KEYS = ['address_in', 'addressIn'] as const
const PROVIDER_KEYS = ['provider', 'provider_id', 'providerId'] as const
const VALUE_COIN_KEYS = ['value_coin', 'valueCoin', 'amount'] as const
const VALUE_FORWARDED_KEYS = ['value_forwarded_coin', 'valueForwardedCoin'] as const
const COIN_KEYS = ['coin', 'currency'] as const
const IPN_TOKEN_KEYS = ['ipn_token', 'ipnToken'] as const
const PENDING_KEYS = ['pending'] as const

const SUCCESS_STATUSES = new Set(['paid', 'completed', 'success'])
const FAILURE_STATUSES = new Set(['failed', 'error', 'canceled', 'cancelled'])
const PROCESSING_STATUSES = new Set(['processing', 'pending'])

type SettlementSuccess = {
  ok: true
  updated: boolean
  orderId: Id<'orders'>
  orderNumber: string
  paymentStatus: PaymentStatus
}

type SettlementFailure = {
  ok: false
  status: number
  error: string
  details?: string
}

export type SettlementResult = SettlementSuccess | SettlementFailure

const toNonEmptyString = (value: unknown): string | undefined => {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : undefined
  }

  if (typeof value === 'number' || typeof value === 'bigint') {
    return String(value)
  }

  return undefined
}

const parseNumeric = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }

  return undefined
}

const getFirstString = (
  payload: CallbackPayload,
  keys: readonly string[],
): string | undefined => {
  for (const key of keys) {
    const value = toNonEmptyString(payload[key])
    if (value) return value
  }

  return undefined
}

const parsePendingFlag = (payload: CallbackPayload): boolean | undefined => {
  const pendingValue = getFirstString(payload, PENDING_KEYS)
  if (!pendingValue) return undefined

  if (pendingValue === '1' || pendingValue.toLowerCase() === 'true') return true
  if (pendingValue === '0' || pendingValue.toLowerCase() === 'false') return false
  return undefined
}

const mapStatusFromPayload = (payload: CallbackPayload): PaymentStatus => {
  const rawStatus = getFirstString(payload, STATUS_KEYS)?.toLowerCase()
  if (rawStatus && SUCCESS_STATUSES.has(rawStatus)) return 'completed'
  if (rawStatus && FAILURE_STATUSES.has(rawStatus)) return 'failed'
  if (rawStatus === 'refunded') return 'refunded'
  if (rawStatus && PROCESSING_STATUSES.has(rawStatus)) {
    return rawStatus === 'processing' ? 'processing' : 'pending'
  }

  const pendingFlag = parsePendingFlag(payload)
  const txIn = getFirstString(payload, TX_IN_KEYS)
  const txOut = getFirstString(payload, TX_OUT_KEYS)
  const valueCoin = parseNumeric(getFirstString(payload, VALUE_COIN_KEYS))
  const hasPaymentSignal = Boolean(txIn || txOut || (valueCoin ?? 0) > 0)

  if (pendingFlag === true) return 'processing'
  if (hasPaymentSignal) return 'completed'

  return 'pending'
}

const findOrder = async (
  convex: ConvexHttpClient,
  payload: CallbackPayload,
): Promise<Doc<'orders'> | null> => {
  const orderDocId = getFirstString(payload, ORDER_DOC_ID_KEYS)
  if (orderDocId) {
    try {
      const byId = await convex.query(api.orders.q.getById, {
        id: orderDocId as Id<'orders'>,
      })
      if (byId) return byId
    } catch {
      // Ignore malformed IDs and continue with order number fallback.
    }
  }

  const orderNumber = getFirstString(payload, ORDER_NUMBER_KEYS)
  if (orderNumber) {
    const byNumber = await convex.query(api.orders.q.getOrderByNumber, {
      orderNumber,
    })
    if (byNumber) return byNumber
  }

  const sessionId = getFirstString(payload, SESSION_KEYS)
  if (!sessionId) return null

  const sessionOrderIdMatch = sessionId.match(/session_([a-z0-9]+)/i)
  if (!sessionOrderIdMatch?.[1]) return null

  try {
    return await convex.query(api.orders.q.getById, {
      id: sessionOrderIdMatch[1] as Id<'orders'>,
    })
  } catch {
    return null
  }
}

const metadataNumberEquals = (
  metadata: Record<string, unknown> | undefined,
  key: string,
  value: number | undefined,
): boolean => {
  if (value === undefined) return true
  if (!metadata) return false
  return parseNumeric(metadata[key]) === value
}

const metadataStringEquals = (
  metadata: Record<string, unknown> | undefined,
  key: string,
  value: string | undefined,
): boolean => {
  if (!value) return true
  if (!metadata) return false
  return toNonEmptyString(metadata[key]) === value
}

const needsPaymentUpdate = (
  order: Doc<'orders'>,
  nextStatus: PaymentStatus,
  txIn: string | undefined,
  txOut: string | undefined,
  valueCoin: number | undefined,
  valueForwardedCoin: number | undefined,
  coin: string | undefined,
): boolean => {
  if (nextStatus !== order.payment.status) return true
  if (txIn && txIn !== order.payment.transactionId) return true
  if (txOut && txOut !== order.payment.gateway?.transactionId) return true

  const metadata = order.payment.gateway?.metadata as
    | Record<string, unknown>
    | undefined

  if (!metadataNumberEquals(metadata, 'valueCoin', valueCoin)) return true
  if (!metadataNumberEquals(metadata, 'valueForwardedCoin', valueForwardedCoin))
    return true
  if (!metadataStringEquals(metadata, 'coin', coin)) return true

  return false
}

export const settlePaygateCallback = async (
  convex: ConvexHttpClient,
  payload: CallbackPayload,
): Promise<SettlementResult> => {
  const hasPayload = Object.keys(payload).length > 0
  if (!hasPayload) {
    return {ok: false, status: 400, error: 'Missing callback payload'}
  }

  const order = await findOrder(convex, payload)
  if (!order) {
    return {
      ok: false,
      status: 404,
      error: 'Order not found for callback payload',
    }
  }

  const nextStatus = mapStatusFromPayload(payload)
  const txIn = getFirstString(payload, TX_IN_KEYS)
  const txOut = getFirstString(payload, TX_OUT_KEYS)
  const addressIn = getFirstString(payload, ADDRESS_IN_KEYS)
  const provider = getFirstString(payload, PROVIDER_KEYS)
  const sessionId = getFirstString(payload, SESSION_KEYS)
  const ipnToken = getFirstString(payload, IPN_TOKEN_KEYS)
  const coin = getFirstString(payload, COIN_KEYS)
  const valueCoin = parseNumeric(getFirstString(payload, VALUE_COIN_KEYS))
  const valueForwardedCoin = parseNumeric(
    getFirstString(payload, VALUE_FORWARDED_KEYS),
  )
  const rawStatus = getFirstString(payload, STATUS_KEYS)
  const now = Date.now()

  const shouldUpdate = needsPaymentUpdate(
    order,
    nextStatus,
    txIn,
    txOut,
    valueCoin,
    valueForwardedCoin,
    coin,
  )

  if (!shouldUpdate) {
    return {
      ok: true,
      updated: false,
      orderId: order._id,
      orderNumber: order.orderNumber,
      paymentStatus: order.payment.status,
    }
  }

  const existingMetadata = (order.payment.gateway?.metadata ??
    {}) as Record<string, unknown>

  const nextMetadata: Record<string, unknown> = {
    ...existingMetadata,
    callbackReceivedAt: now,
  }

  if (valueCoin !== undefined) nextMetadata.valueCoin = valueCoin
  if (valueForwardedCoin !== undefined) {
    nextMetadata.valueForwardedCoin = valueForwardedCoin
  }
  if (coin) nextMetadata.coin = coin
  if (txIn) nextMetadata.txidIn = txIn
  if (txOut) nextMetadata.txidOut = txOut
  if (addressIn) nextMetadata.addressIn = addressIn
  if (rawStatus) nextMetadata.paygateStatus = rawStatus

  const gatewayId =
    addressIn || order.payment.gateway?.id || order.payment.gatewayId || 'paygate'
  const gatewayProvider = provider || order.payment.gateway?.provider || 'paygate'
  const gatewaySession = ipnToken || sessionId || order.payment.gateway?.sessionId

  const nextGateway = {
    ...(order.payment.gateway ?? {
      name: 'paygate',
      id: gatewayId,
      provider: gatewayProvider,
      status: nextStatus,
    }),
    name: order.payment.gateway?.name || 'paygate',
    id: gatewayId,
    provider: gatewayProvider,
    status: nextStatus,
    sessionId: gatewaySession,
    transactionId: txOut || order.payment.gateway?.transactionId,
    metadata: nextMetadata,
  }

  const paidAt =
    nextStatus === 'completed' ? order.payment.paidAt ?? now : order.payment.paidAt

  await convex.mutation(api.orders.m.updatePayment, {
    orderId: order._id,
    payment: {
      ...order.payment,
      status: nextStatus,
      transactionId: txIn || order.payment.transactionId,
      paidAt,
      gatewayId: gatewaySession || order.payment.gatewayId,
      gateway: nextGateway,
    },
  })

  return {
    ok: true,
    updated: true,
    orderId: order._id,
    orderNumber: order.orderNumber,
    paymentStatus: nextStatus,
  }
}

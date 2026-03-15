import type {Doc} from '../../convex/_generated/dataModel'
import {formatDate} from '../../utils/date'
import {createClient} from './index'
import {resolvePaymentEmailAmountUsd} from './payment-email-amount'
import {queueResendSend} from './rate-limit'
import {renderTemplate} from './render'
import {PaymentPendingEmail} from './templates/payment-pending'

type SendPaymentPendingEmailArgs = {
  order: Doc<'orders'>
}

const DEFAULT_FROM = 'hello@rapidfirenow.com'
const DEFAULT_APP_BASE_URL = 'https://rapidfirenow.com'
const FALLBACK_RETRY_DELAYS_MS = [500, 1500] as const

const toNonEmptyString = (value: string | undefined | null): string | null => {
  if (!value) {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

const getCustomerName = (order: Doc<'orders'>): string => {
  const parts = [
    toNonEmptyString(order.shippingAddress.firstName),
    toNonEmptyString(order.shippingAddress.lastName),
  ].filter((value): value is string => value !== null)

  if (parts.length > 0) {
    return parts.join(' ')
  }

  const emailName = toNonEmptyString(order.contactEmail)?.split('@')[0]
  return emailName || 'there'
}

const extractResendError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  if (error && typeof error === 'object') {
    const message =
      'message' in error && typeof error.message === 'string'
        ? error.message
        : undefined
    const name =
      'name' in error && typeof error.name === 'string' ? error.name : undefined

    if (message && name) {
      return `${name}: ${message}`
    }

    if (message) {
      return message
    }
  }

  return 'Unknown Resend error'
}

const getAppBaseUrl = (): string =>
  process.env.EMAIL_API_BASE_URL?.trim() ||
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  process.env.SITE_URL?.trim() ||
  DEFAULT_APP_BASE_URL

async function sendViaAppApi(args: {
  to: string
  subject: string
  html: string
}): Promise<{id: string | null}> {
  const response = await fetch(`${getAppBaseUrl()}/api/resend`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      intent: 'sales',
      type: 'products',
      group: 'auto',
      from: process.env.RESEND_FROM ?? DEFAULT_FROM,
      to: [args.to],
      subject: args.subject,
      html: args.html,
    }),
  })

  const payload = (await response.json().catch(() => null)) as {
    ok?: boolean
    id?: string | null
    error?: string
  } | null

  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error ?? 'Failed to send via /api/resend')
  }

  return {
    id: payload.id ?? null,
  }
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function sendViaAppApiWithRetry(args: {
  to: string
  subject: string
  html: string
  orderNumber: string
}): Promise<{id: string | null}> {
  let lastError: unknown = null

  for (let attempt = 0; attempt <= FALLBACK_RETRY_DELAYS_MS.length; attempt++) {
    try {
      const result = await sendViaAppApi(args)
      if (attempt > 0) {
        console.info('[payment-pending-email] fallback send recovered', {
          orderNumber: args.orderNumber,
          attempt: attempt + 1,
          to: args.to,
        })
      }
      return result
    } catch (error) {
      lastError = error
      console.error('[payment-pending-email] fallback send failed', {
        orderNumber: args.orderNumber,
        attempt: attempt + 1,
        to: args.to,
        error: extractResendError(error),
      })

      const retryDelay = FALLBACK_RETRY_DELAYS_MS[attempt]
      if (retryDelay === undefined) {
        break
      }

      await delay(retryDelay)
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Failed to send via /api/resend after retries')
}

export async function sendPaymentPendingEmail({
  order,
}: SendPaymentPendingEmailArgs): Promise<{id: string | null} | null> {
  const to = toNonEmptyString(order.contactEmail)
  if (!to) {
    return null
  }

  const html = await renderTemplate(PaymentPendingEmail, {
    customerName: getCustomerName(order),
    paymentMethod: order.payment.method,
    orderNumber: order.orderNumber,
    orderDate: formatDate(order.createdAt ?? Date.now()),
    amount: resolvePaymentEmailAmountUsd(order),
    currency: 'USD',
  })
  const subject = 'We received your order!'

  let resend: ReturnType<typeof createClient> | null = null
  try {
    resend = createClient()
  } catch (error) {
    const message = extractResendError(error)
    if (!message.includes('Resend API key is not configured')) {
      throw error
    }
  }

  if (!resend) {
    return sendViaAppApiWithRetry({
      to,
      subject,
      html,
      orderNumber: order.orderNumber,
    })
  }

  const result = await queueResendSend(() =>
    resend.emails.send({
      from: process.env.RESEND_FROM ?? DEFAULT_FROM,
      to,
      subject,
      html,
    }),
  )

  if (result.error) {
    throw new Error(extractResendError(result.error))
  }

  return {
    id: result.data?.id ?? null,
  }
}

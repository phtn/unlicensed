import type {Doc} from '../../convex/_generated/dataModel'
import {createClient} from './index'
import {queueResendSend} from './rate-limit'
import {renderTemplate} from './render'
import {WelcomeEmail} from './templates/welcome'

const DEFAULT_FROM = 'hello@rapidfirenow.com'
const DEFAULT_APP_BASE_URL = 'https://rapidfirenow.com'
const FALLBACK_RETRY_DELAYS_MS = [500, 1500] as const

const WELCOME_COUPON_PATTERNS = [
  'welcome',
  'first order',
  'first-order',
  'signup',
  'sign up',
  'new customer',
  'new signup',
  'new sign up',
] as const

const toNonEmptyString = (value: string | undefined | null): string | null => {
  if (!value) {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
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

const getWelcomeRecipientName = (user: Doc<'users'>): string => {
  const name = toNonEmptyString(user.name)
  if (name) {
    return name
  }

  const emailName = toNonEmptyString(user.email)?.split('@')[0]
  return emailName || 'there'
}

export const isCouponActive = (
  coupon: Doc<'coupons'>,
  now: number = Date.now(),
): boolean => {
  if (!coupon.enabled) {
    return false
  }

  if (coupon.startsAt !== undefined && coupon.startsAt > now) {
    return false
  }

  if (coupon.expiresAt !== undefined && coupon.expiresAt <= now) {
    return false
  }

  return true
}

const getWelcomeCouponScore = (coupon: Doc<'coupons'>): number => {
  const haystack = [coupon.code, coupon.name, coupon.description, coupon.notes]
    .filter((value): value is string => typeof value === 'string')
    .join(' ')
    .toLowerCase()

  let score = 0
  for (const pattern of WELCOME_COUPON_PATTERNS) {
    if (haystack.includes(pattern)) {
      score += 100
    }
  }

  return score
}

export const pickWelcomeCoupon = (
  coupons: Doc<'coupons'>[],
  now: number = Date.now(),
): Doc<'coupons'> | null => {
  const activeCoupons = coupons.filter((coupon) => isCouponActive(coupon, now))
  if (activeCoupons.length === 0) {
    return null
  }

  const rankedWelcomeCoupons = activeCoupons
    .map((coupon) => ({
      coupon,
      score: getWelcomeCouponScore(coupon),
    }))
    .filter(({score}) => score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score
      }

      return b.coupon.updatedAt - a.coupon.updatedAt
    })

  if (rankedWelcomeCoupons.length > 0) {
    return rankedWelcomeCoupons[0]!.coupon
  }

  return activeCoupons.length === 1 ? activeCoupons[0]! : null
}

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
  userId: string
}): Promise<{id: string | null}> {
  let lastError: unknown = null

  for (let attempt = 0; attempt <= FALLBACK_RETRY_DELAYS_MS.length; attempt++) {
    try {
      const result = await sendViaAppApi(args)
      if (attempt > 0) {
        console.info('[welcome-email] fallback send recovered', {
          userId: args.userId,
          attempt: attempt + 1,
          to: args.to,
        })
      }
      return result
    } catch (error) {
      lastError = error
      console.error('[welcome-email] fallback send failed', {
        userId: args.userId,
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

export async function sendWelcomeEmail(args: {
  user: Doc<'users'>
  couponCode: string
}): Promise<{id: string | null} | null> {
  const to = toNonEmptyString(args.user.email)
  if (!to) {
    return null
  }

  const html = await renderTemplate(WelcomeEmail, {
    userName: getWelcomeRecipientName(args.user),
    couponCode: args.couponCode,
  })
  const subject = 'Welcome to Rapid Fire'

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
      userId: String(args.user._id),
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

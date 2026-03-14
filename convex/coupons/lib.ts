import type {Doc} from '../_generated/dataModel'

type CouponDoc = Doc<'coupons'>

const DEFAULT_PER_USER_LIMIT = 1

export function normalizeCouponCode(code: string) {
  return code.trim().toUpperCase()
}

export function isCouponActive(
  coupon: Pick<CouponDoc, 'enabled' | 'startsAt' | 'expiresAt'>,
  now: number = Date.now(),
): boolean {
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

export function getCouponDiscountCents(
  coupon: Pick<
    CouponDoc,
    'discountType' | 'discountValue' | 'maximumDiscountCents'
  >,
  subtotalCents: number,
): number {
  if (subtotalCents <= 0) {
    return 0
  }

  const rawDiscountCents =
    coupon.discountType === 'percentage'
      ? Math.round((subtotalCents * coupon.discountValue) / 100)
      : Math.round(coupon.discountValue)

  const cappedDiscountCents =
    coupon.maximumDiscountCents !== undefined
      ? Math.min(rawDiscountCents, coupon.maximumDiscountCents)
      : rawDiscountCents

  return Math.max(0, Math.min(subtotalCents, cappedDiscountCents))
}

function formatCentsForMessage(amountCents: number) {
  return `$${(amountCents / 100).toFixed(2)}`
}

export function getCouponEligibilityError(
  coupon: Pick<
    CouponDoc,
    | 'enabled'
    | 'startsAt'
    | 'expiresAt'
    | 'minimumSubtotalCents'
    | 'usageLimit'
    | 'timesRedeemed'
    | 'perUserLimit'
  >,
  args: {
    subtotalCents: number
    userUses: number
    now?: number
  },
): string | null {
  const now = args.now ?? Date.now()

  if (!isCouponActive(coupon, now)) {
    return 'This coupon is not active right now.'
  }

  if (
    coupon.minimumSubtotalCents !== undefined &&
    args.subtotalCents < coupon.minimumSubtotalCents
  ) {
    return `This coupon requires a subtotal of at least ${formatCentsForMessage(coupon.minimumSubtotalCents)}.`
  }

  if (
    coupon.usageLimit !== undefined &&
    coupon.timesRedeemed >= coupon.usageLimit
  ) {
    return 'This coupon has reached its usage limit.'
  }

  const perUserLimit = coupon.perUserLimit ?? DEFAULT_PER_USER_LIMIT
  if (args.userUses >= perUserLimit) {
    return 'You have already used this coupon.'
  }

  return null
}

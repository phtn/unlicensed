import {ConvexError} from 'convex/values'

const COUPON_ERROR_KIND = 'coupon_error'

type CouponErrorData = {
  kind: typeof COUPON_ERROR_KIND
  message: string
}

export function createCouponError(message: string) {
  return new ConvexError<CouponErrorData>({
    kind: COUPON_ERROR_KIND,
    message,
  })
}

export function getCouponErrorMessage(error: unknown): string | null {
  if (!(error instanceof ConvexError)) {
    return null
  }

  const {data} = error
  if (
    typeof data === 'object' &&
    data !== null &&
    'kind' in data &&
    data.kind === COUPON_ERROR_KIND &&
    'message' in data &&
    typeof data.message === 'string'
  ) {
    return data.message
  }

  return null
}

import {createAppError, getAppErrorMessage, isAppError} from './errors'

export function createCouponError(message: string) {
  return createAppError('validation', message, 'coupon_error')
}

export function getCouponErrorMessage(error: unknown): string | null {
  if (!isAppError(error, 'validation')) return null
  const data = error.data as {code?: string; message: string}
  if (data.code !== 'coupon_error') return null
  return getAppErrorMessage(error)
}

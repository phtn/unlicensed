import {describe, expect, test} from 'bun:test'
import {ConvexError} from 'convex/values'
import {createCouponError, getCouponErrorMessage} from '../lib/coupon-errors'

describe('coupon error helpers', () => {
  test('extracts the message from structured coupon errors', () => {
    const error = createCouponError('Coupon code not found.')

    expect(getCouponErrorMessage(error)).toBe('Coupon code not found.')
  })

  test('ignores unrelated Convex errors', () => {
    const error = new ConvexError({kind: 'other_error', message: 'Hidden'})

    expect(getCouponErrorMessage(error)).toBeNull()
  })

  test('ignores standard errors', () => {
    expect(getCouponErrorMessage(new Error('raw backend error'))).toBeNull()
  })
})

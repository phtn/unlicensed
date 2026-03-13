import {v} from 'convex/values'
import {
  pickWelcomeCoupon,
  sendWelcomeEmail,
} from '../../lib/resend/send-welcome-email'
import {api} from '../_generated/api'
import {internalAction} from '../_generated/server'

type WelcomeEmailSendResult = {
  ok: boolean
  id: string | null
  couponCode?: string
  error?: string
}

const toErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  try {
    return JSON.stringify(error)
  } catch {
    return 'Unknown error'
  }
}

export const sendWelcomeEmailForUser = internalAction({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args): Promise<WelcomeEmailSendResult> => {
    const user = await ctx.runQuery(api.users.q.getById, {
      id: args.userId,
    })
    if (!user) {
      return {ok: false, id: null, error: 'User not found'}
    }

    const coupons = await ctx.runQuery(api.coupons.q.listCoupons, {})
    const coupon = pickWelcomeCoupon(coupons, Date.now())
    if (!coupon) {
      console.warn('[users/sendWelcomeEmailForUser] no active welcome coupon', {
        userId: args.userId,
        email: user.email,
      })
      return {
        ok: false,
        id: null,
        error: 'No active welcome coupon configured',
      }
    }

    try {
      const result = await sendWelcomeEmail({
        user,
        couponCode: coupon.code,
      })

      return {
        ok: true,
        id: result?.id ?? null,
        couponCode: coupon.code,
      }
    } catch (error) {
      const message = toErrorMessage(error)

      console.error('[users/sendWelcomeEmailForUser] send failed', {
        userId: args.userId,
        email: user.email,
        couponCode: coupon.code,
        error: message,
      })

      return {
        ok: false,
        id: null,
        couponCode: coupon.code,
        error: message,
      }
    }
  },
})

import {v} from 'convex/values'
import {query} from '../_generated/server'

function normalizeCouponCode(code: string) {
  return code.trim().toUpperCase()
}

export const listCoupons = query({
  handler: async (ctx) => {
    const coupons = await ctx.db.query('coupons').collect()
    return coupons.slice().sort((a, b) => b.updatedAt - a.updatedAt)
  },
})

export const getCouponByCode = query({
  args: {code: v.string()},
  handler: async (ctx, {code}) => {
    return await ctx.db
      .query('coupons')
      .withIndex('by_code', (q) => q.eq('code', normalizeCouponCode(code)))
      .unique()
  },
})

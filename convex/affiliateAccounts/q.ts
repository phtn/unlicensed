import {v} from 'convex/values'
import {query} from '../_generated/server'

/**
 * List all affiliate accounts
 */
export const listAffiliates = query({
  args: {},
  handler: async (ctx) => {
    const affiliates = await ctx.db.query('affiliateAccounts').collect()
    return affiliates.sort((a, b) => {
      // Sort by enabled first, then by creation date
      if (a.enabled && !b.enabled) return -1
      if (!a.enabled && b.enabled) return 1
      return (b.createdAt ?? 0) - (a.createdAt ?? 0)
    })
  },
})

/**
 * Get affiliate account by ID
 */
export const getAffiliateById = query({
  args: {
    id: v.id('affiliateAccounts'),
  },
  handler: async (ctx, {id}) => {
    const affiliate = await ctx.db.get(id)
    return affiliate ?? null
  },
})

/**
 * Get affiliate account by wallet address
 */
export const getAffiliateByWallet = query({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, {walletAddress}) => {
    const affiliate = await ctx.db
      .query('affiliateAccounts')
      .withIndex('by_wallet_address', (q) => q.eq('walletAddress', walletAddress.toLowerCase()))
      .unique()
    return affiliate ?? null
  },
})


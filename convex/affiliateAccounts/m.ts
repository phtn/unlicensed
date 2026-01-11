import {v} from 'convex/values'
import {mutation} from '../_generated/server'

/**
 * Create a new affiliate account
 */
export const createAffiliate = mutation({
  args: {
    paygateAccount: v.id('paygateAccounts'),
    walletAddress: v.string(),
    label: v.optional(v.string()),
    description: v.optional(v.string()),
    commissionRate: v.optional(v.number()),
    merchantRate: v.optional(v.number()),
    enabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Validate wallet address format (basic Ethereum address format)
    const addressRegex = /^0x[a-fA-F0-9]{40}$/
    if (!addressRegex.test(args.walletAddress)) {
      throw new Error(
        'Invalid wallet address format. Must be a valid Ethereum address (0x...).',
      )
    }

    // Validate commission rate if provided
    if (args.commissionRate !== undefined) {
      if (args.commissionRate < 0 || args.commissionRate > 1) {
        throw new Error(
          'Commission rate must be between 0 and 1 (e.g., 0.005 for 0.5%).',
        )
      }
    }

    // Check if affiliate with this wallet address already exists
    const existing = await ctx.db
      .query('affiliateAccounts')
      .withIndex('by_wallet_address', (q) =>
        q.eq('walletAddress', args.walletAddress.toLowerCase()),
      )
      .unique()

    if (existing) {
      throw new Error('Affiliate with this wallet address already exists.')
    }

    const now = Date.now()
    const affiliateId = await ctx.db.insert('affiliateAccounts', {
      paygateAccount: args.paygateAccount,
      walletAddress: args.walletAddress.toLowerCase(), // Normalize to lowercase
      label: args.label,
      description: args.description,
      commissionRate: args.commissionRate,
      merchantRate: args.merchantRate,
      enabled: args.enabled ?? true,
      totalCommissions: 0,
      totalTransactions: 0,
      successfulTransactions: 0,
      createdAt: now,
      updatedAt: now,
    })

    return affiliateId
  },
})

/**
 * Update an affiliate account
 */
export const updateAffiliate = mutation({
  args: {
    id: v.id('affiliateAccounts'),
    label: v.optional(v.string()),
    description: v.optional(v.string()),
    commissionRate: v.optional(v.number()),
    merchantRate: v.optional(v.number()),
    enabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const affiliate = await ctx.db.get(args.id)
    if (!affiliate) {
      throw new Error('Affiliate account not found')
    }

    // Validate commission rate if provided
    if (args.commissionRate !== undefined) {
      if (args.commissionRate < 0 || args.commissionRate > 1) {
        throw new Error(
          'Commission rate must be between 0 and 1 (e.g., 0.005 for 0.5%).',
        )
      }
    }

    const {id, ...updateData} = args
    await ctx.db.patch(id, {
      ...updateData,
      updatedAt: Date.now(),
    })

    return id
  },
})

/**
 * Delete an affiliate account
 */
export const deleteAffiliate = mutation({
  args: {
    id: v.id('affiliateAccounts'),
  },
  handler: async (ctx, {id}) => {
    const affiliate = await ctx.db.get(id)
    if (!affiliate) {
      throw new Error('Affiliate account not found')
    }

    await ctx.db.delete(id)
    return {success: true}
  },
})

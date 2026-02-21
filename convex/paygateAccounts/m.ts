import {v} from 'convex/values'
import {mutation} from '../_generated/server'
import {paygateAccountSchema, topTenProviderValidator} from './d'

/**
 * Create a new PayGate account
 */
export const createAccount = mutation({
  args: paygateAccountSchema,
  handler: async (ctx, args) => {
    // Validate wallet address format (basic Ethereum address format)
    const addressRegex = /^0x[a-fA-F0-9]{40}$/
    if (!addressRegex.test(args.hexAddress!)) {
      throw new Error(
        'Invalid wallet address format. Must be a valid Ethereum address (0x...).',
      )
    }

    const gateway = args.gateway ?? 'paygate'

    // Check if account with this address already exists for this gateway
    const existing = await ctx.db
      .query('paygateAccounts')
      .withIndex('by_gateway_hexAddress', (q) =>
        q.eq('gateway', gateway).eq('hexAddress', args.hexAddress.toLowerCase()),
      )
      .unique()

    if (existing) {
      throw new Error('Account with this wallet address already exists.')
    }

    // If setting as default, unset other default accounts for this gateway
    if (args.isDefault) {
      const currentDefaults = await ctx.db
        .query('paygateAccounts')
        .withIndex('by_gateway_default', (q) =>
          q.eq('gateway', gateway).eq('isDefault', true),
        )
        .collect()
      for (const account of currentDefaults) {
        await ctx.db.patch(account._id, {isDefault: false})
      }
    }

    const now = Date.now()
    const accountId = await ctx.db.insert('paygateAccounts', {
      ...args,
      gateway,
      hexAddress: args.hexAddress.toLowerCase(), // Normalize to lowercase
      isDefault: args.isDefault ?? false,
      enabled: args.enabled ?? true,
      createdAt: now,
      updatedAt: now,
    })

    return accountId
  },
})

/**
 * Update a PayGate account
 */
export const updateAccount = mutation({
  args: {
    id: v.id('paygateAccounts'),
    hexAddress: v.optional(v.string()),
    callbackUrl: v.optional(v.string()),
    label: v.optional(v.string()),
    description: v.optional(v.string()),
    isDefault: v.optional(v.boolean()),
    enabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const account = await ctx.db.get(args.id)
    if (!account) {
      throw new Error('Account not found')
    }

    // If setting as default, unset other default accounts for this gateway
    const gateway = account.gateway ?? 'paygate'
    if (args.isDefault && !account.isDefault) {
      const currentDefaults = await ctx.db
        .query('paygateAccounts')
        .withIndex('by_gateway_default', (q) =>
          q.eq('gateway', gateway).eq('isDefault', true),
        )
        .collect()
      for (const defaultAccount of currentDefaults) {
        if (defaultAccount._id !== args.id) {
          await ctx.db.patch(defaultAccount._id, {isDefault: false})
        }
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
 * Delete a PayGate account
 */
export const deleteAccount = mutation({
  args: {
    id: v.id('paygateAccounts'),
  },
  handler: async (ctx, {id}) => {
    const account = await ctx.db.get(id)
    if (!account) {
      throw new Error('Account not found')
    }

    await ctx.db.delete(id)
    return {success: true}
  },
})

/**
 * Update account data from PayGate API sync
 */
export const updateAccountSyncData = mutation({
  args: {
    id: v.id('paygateAccounts'),
    accountStatus: v.optional(
      v.union(
        v.literal('active'),
        v.literal('inactive'),
        v.literal('suspended'),
        v.literal('pending'),
      ),
    ),
    paymentStatus: v.optional(
      v.union(
        v.literal('enabled'),
        v.literal('disabled'),
        v.literal('limited'),
      ),
    ),
    verificationStatus: v.optional(
      v.union(
        v.literal('verified'),
        v.literal('unverified'),
        v.literal('pending'),
        v.literal('rejected'),
      ),
    ),
    addressOut: v.optional(v.string()),
    affiliateWallet: v.optional(v.string()),
    commissionRate: v.optional(v.number()),
    affiliateEnabled: v.optional(v.boolean()),
    totalTransactions: v.optional(v.number()),
    totalVolume: v.optional(v.number()),
    successfulTransactions: v.optional(v.number()),
    failedTransactions: v.optional(v.number()),
    pendingAmount: v.optional(v.number()),
    availableBalance: v.optional(v.number()),
    minTransactionAmount: v.optional(v.number()),
    maxTransactionAmount: v.optional(v.number()),
    dailyLimit: v.optional(v.number()),
    transactionFee: v.optional(v.number()),
    supportedCurrencies: v.optional(v.array(v.string())),
    defaultCurrency: v.optional(v.string()),
    lastPaymentDate: v.optional(v.number()),
    syncedData: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const account = await ctx.db.get(args.id)
    if (!account) {
      throw new Error('Account not found')
    }

    const {id, ...syncData} = args
    await ctx.db.patch(id, {
      ...syncData,
      lastSyncedAt: Date.now(),
      updatedAt: Date.now(),
    })

    return id
  },
})

const TOP_TEN_MAX = 10

/**
 * Update top 10 providers for a PayGate account
 */
export const updateTopTenProviders = mutation({
  args: {
    id: v.id('paygateAccounts'),
    topTenProviders: v.array(topTenProviderValidator),
  },
  handler: async (ctx, args) => {
    if (args.topTenProviders.length > TOP_TEN_MAX) {
      throw new Error(
        `At most ${TOP_TEN_MAX} providers can be selected as top ten.`,
      )
    }
    const account = await ctx.db.get(args.id)
    if (!account) {
      throw new Error('Account not found')
    }
    await ctx.db.patch(args.id, {
      topTenProviders: args.topTenProviders,
      updatedAt: Date.now(),
    })
    return args.id
  },
})

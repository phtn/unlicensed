import {v} from 'convex/values'
import {mutation} from '../_generated/server'
import {topTenProviderValidator, walletValidator} from './d'

const accountUpdateInputValidator = v.object({
  addressIn: v.optional(v.string()),
  label: v.optional(v.string()),
  description: v.optional(v.string()),
  hexAddress: v.optional(v.string()),
  polygonAddressIn: v.optional(v.string()),
  callbackUrl: v.optional(v.string()),
  ipnToken: v.optional(v.string()),
  addressOut: v.optional(v.string()),
  affiliateWallet: v.optional(v.string()),
  commissionRate: v.optional(v.number()),
  affiliateEnabled: v.optional(v.boolean()),
  accountStatus: v.optional(
    v.union(
      v.literal('active'),
      v.literal('inactive'),
      v.literal('suspended'),
      v.literal('pending'),
    ),
  ),
  isDefault: v.optional(v.boolean()),
  enabled: v.optional(v.boolean()),
})

const TOP_TEN_MAX = 10

/**
 * Create a new account on a gateway. Appends to the accounts array.
 */
export const createAccount = mutation({
  args: {
    gatewayId: v.id('gateways'),
    account: walletValidator,
  },
  handler: async (ctx, {gatewayId, account}) => {
    const gateway = await ctx.db.get(gatewayId)
    if (!gateway) {
      throw new Error('Gateway not found')
    }

    const existing = gateway.accounts ?? []
    const hasDuplicate =
      existing.some((a) => a.hexAddress === account.hexAddress) ||
      existing.some((a) => a.addressIn === account.addressIn)
    if (hasDuplicate) {
      throw new Error(
        'Account with this hexAddress or addressIn already exists on this gateway',
      )
    }

    const newAccount = {
      ...account,
      createdAt: account.createdAt ?? Date.now(),
    }

    await ctx.db.patch(gatewayId, {
      accounts: [...existing, newAccount],
      updatedAt: Date.now(),
    })

    return gatewayId
  },
})

/**
 * Update an existing account on a gateway by hexAddress.
 */
export const updateAccount = mutation({
  args: {
    gatewayId: v.id('gateways'),
    hexAddress: v.string(),
    account: accountUpdateInputValidator,
  },
  handler: async (ctx, {gatewayId, hexAddress, account}) => {
    const gateway = await ctx.db.get(gatewayId)
    if (!gateway) {
      throw new Error('Gateway not found')
    }

    const existing = gateway.accounts ?? []
    const idx = existing.findIndex((a) => a.hexAddress === hexAddress)
    if (idx === -1) {
      throw new Error(
        `Account with hexAddress ${hexAddress} not found on this gateway`,
      )
    }

    const updated = existing.map((a, i) =>
      i === idx ? {...a, ...account} : a,
    )

    await ctx.db.patch(gatewayId, {
      accounts: updated,
      updatedAt: Date.now(),
    })

    return gatewayId
  },
})

/**
 * Delete an account from a gateway by hexAddress.
 */
export const deleteAccount = mutation({
  args: {
    gatewayId: v.id('gateways'),
    hexAddress: v.string(),
  },
  handler: async (ctx, {gatewayId, hexAddress}) => {
    const gateway = await ctx.db.get(gatewayId)
    if (!gateway) {
      throw new Error('Gateway not found')
    }

    const existing = gateway.accounts ?? []
    const filtered = existing.filter((a) => a.hexAddress !== hexAddress)
    if (filtered.length === existing.length) {
      throw new Error(
        `Account with hexAddress ${hexAddress} not found on this gateway`,
      )
    }

    await ctx.db.patch(gatewayId, {
      accounts: filtered,
      updatedAt: Date.now(),
    })

    return gatewayId
  },
})

/**
 * Set a gateway as the default. Unsets isDefault on all other gateways.
 */
export const setDefault = mutation({
  args: {id: v.id('gateways')},
  handler: async (ctx, {id}) => {
    const gateway = await ctx.db.get(id)
    if (!gateway) {
      throw new Error('Gateway not found')
    }

    const currentDefaults = await ctx.db
      .query('gateways')
      .withIndex('by_default', (q) => q.eq('isDefault', true))
      .collect()

    for (const g of currentDefaults) {
      if (g._id !== id) {
        await ctx.db.patch(g._id, {isDefault: false, updatedAt: Date.now()})
      }
    }

    await ctx.db.patch(id, {
      isDefault: true,
      updatedAt: Date.now(),
    })

    return id
  },
})

/**
 * Update top providers on a gateway document.
 * Keeps defaultProvider valid by requiring it to exist in topTenProviders.
 */
export const updateTopTenProviders = mutation({
  args: {
    gatewayId: v.id('gateways'),
    topTenProviders: v.array(topTenProviderValidator),
    defaultProvider: v.optional(v.string()),
  },
  handler: async (ctx, {gatewayId, topTenProviders, defaultProvider}) => {
    if (topTenProviders.length > TOP_TEN_MAX) {
      throw new Error(
        `At most ${TOP_TEN_MAX} providers can be selected as top ten.`,
      )
    }

    const gateway = await ctx.db.get(gatewayId)
    if (!gateway) {
      throw new Error('Gateway not found')
    }

    if (
      defaultProvider &&
      !topTenProviders.some((provider) => provider.id === defaultProvider)
    ) {
      throw new Error('Default provider must be included in top ten providers')
    }

    const updatedAt = Date.now()

    await ctx.db.patch(gatewayId, {
      topTenProviders,
      defaultProvider,
      updatedAt,
    })

    const gatewayName = gateway.gateway ?? 'paygate'
    const defaultAccount = await ctx.db
      .query('paygateAccounts')
      .withIndex('by_gateway_default', (q) =>
        q.eq('gateway', gatewayName).eq('isDefault', true),
      )
      .first()

    if (defaultAccount) {
      await ctx.db.patch(defaultAccount._id, {
        topTenProviders,
        defaultProvider,
        updatedAt,
      })
    }

    return gatewayId
  },
})

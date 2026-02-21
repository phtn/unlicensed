import {v} from 'convex/values'
import {query} from '../_generated/server'
import {gatewayValidator} from './d'

const gatewayArg = v.optional(gatewayValidator)

/**
 * List all PayGate accounts (optionally filtered by gateway)
 */
export const listAccounts = query({
  args: {gateway: gatewayArg},
  handler: async (ctx, args) => {
    const effectiveGateway = args?.gateway ?? 'paygate'
    const accounts = await ctx.db
      .query('paygateAccounts')
      .withIndex('by_gateway', (q) => q.eq('gateway', effectiveGateway))
      .collect()
    // Fallback: legacy rows may not have gateway set
    const list =
      accounts.length > 0
        ? accounts
        : (await ctx.db.query('paygateAccounts').collect()).filter(
            (a) => (a.gateway ?? 'paygate') === effectiveGateway,
          )
    return list.sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1
      if (!a.isDefault && b.isDefault) return 1
      return (b.createdAt ?? 0) - (a.createdAt ?? 0)
    })
  },
})

/**
 * Get PayGate account by ID
 */
export const getAccountById = query({
  args: {
    id: v.id('paygateAccounts'),
  },
  handler: async (ctx, {id}) => {
    const account = await ctx.db.get(id)
    return account ?? null
  },
})

/**
 * Get PayGate account by wallet address
 */
export const getAccountByAddress = query({
  args: {
    addressIn: v.string(),
  },
  handler: async (ctx, {addressIn}) => {
    const account = await ctx.db
      .query('paygateAccounts')
      .withIndex('by_address_in', (q) => q.eq('addressIn', addressIn.toLowerCase()))
      .unique()
    return account ?? null
  },
})

/**
 * Get default account for a gateway (defaults to paygate)
 */
export const getDefaultAccount = query({
  args: {gateway: gatewayArg},
  handler: async (ctx, args) => {
    const effectiveGateway = args?.gateway ?? 'paygate'
    const accounts = await ctx.db
      .query('paygateAccounts')
      .withIndex('by_gateway_default', (q) =>
        q.eq('gateway', effectiveGateway).eq('isDefault', true),
      )
      .collect()
    if (accounts.length > 0) return accounts[0] ?? null
    // Legacy: no gateway on rows
    const legacy = await ctx.db
      .query('paygateAccounts')
      .withIndex('by_default', (q) => q.eq('isDefault', true))
      .collect()
    const match = legacy.find((a) => (a.gateway ?? 'paygate') === effectiveGateway)
    return match ?? legacy[0] ?? null
  },
})


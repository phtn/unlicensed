import {v} from 'convex/values'
import {query} from '../_generated/server'

/**
 * List all PayGate accounts
 */
export const listAccounts = query({
  args: {},
  handler: async (ctx) => {
    const accounts = await ctx.db.query('paygateAccounts').collect()
    return accounts.sort((a, b) => {
      // Sort by default first, then by creation date
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
 * Get default PayGate account
 */
export const getDefaultAccount = query({
  args: {},
  handler: async (ctx) => {
    const account = await ctx.db
      .query('paygateAccounts')
      .withIndex('by_default', (q) => q.eq('isDefault', true))
      .unique()
    return account ?? null
  },
})


import {v} from 'convex/values'
import {query} from '../_generated/server'
import {gatewayValidator} from './d'

export const list = query({
  handler: async ({db}) => {
    return await db.query('gateways').collect()
  },
})

export const getByName = query({
  args: {
    name: gatewayValidator,
  },
  handler: async ({db}, {name}) => {
    return await db
      .query('gateways')
      .withIndex('by_gateway', (q) => q.eq('gateway', name))
      .first()
  },
})

export const listAccounts = query({
  args: {
    gateway: gatewayValidator,
  },
  handler: async ({db}, {gateway}) => {
    const g = await db
      .query('gateways')
      .withIndex('by_gateway', (q) => q.eq('gateway', gateway))
      .first()

    if (!g) return []
    return g.accounts ?? []
  },
})

/**
 * Get gateway document by gateway identifier (paygate | paylex | rampex)
 */
export const getByGateway = query({
  args: {gateway: gatewayValidator},
  handler: async ({db}, {gateway}) => {
    return await db
      .query('gateways')
      .withIndex('by_gateway', (q) => q.eq('gateway', gateway))
      .first()
  },
})

/**
 * Get a single account from a gateway by hexAddress
 */
export const getAccount = query({
  args: {
    gateway: gatewayValidator,
    hexAddress: v.string(),
  },
  handler: async ({db}, {gateway, hexAddress}) => {
    const g = await db
      .query('gateways')
      .withIndex('by_gateway', (q) => q.eq('gateway', gateway))
      .first()

    if (!g?.accounts) return null
    const normalized = hexAddress.toLowerCase()
    return (
      g.accounts.find((a) => a.hexAddress.toLowerCase() === normalized) ?? null
    )
  },
})

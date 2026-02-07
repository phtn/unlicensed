import {v} from 'convex/values'
import {query} from '../_generated/server'

export const getCurrentUser = query({
  args: {
    fid: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_fid', (q) => q.eq('fid', args.fid))
      .first()

    return user
  },
})

/** Get user by fid (Firebase/auth UID) - alias for message/chat components that use "proId" for fid */
export const getByFid = query({
  args: {
    fid: v.string(),
  },
  handler: async (ctx, args) => {
    return ctx.db
      .query('users')
      .withIndex('by_fid', (q) => q.eq('fid', args.fid))
      .first()
  },
})

export const getUserAddresses = query({
  args: {
    fid: v.string(),
    type: v.optional(
      v.union(v.literal('shipping'), v.literal('billing'), v.literal('both')),
    ),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_fid', (q) => q.eq('fid', args.fid))
      .unique()

    if (!user || !user.addresses) {
      return []
    }

    if (args.type) {
      return user.addresses.filter(
        (addr) => addr.type === args.type || addr.type === 'both',
      )
    }

    return user.addresses
  },
})

export const getDefaultAddress = query({
  args: {
    fid: v.string(),
    type: v.optional(
      v.union(v.literal('shipping'), v.literal('billing'), v.literal('both')),
    ),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_fid', (q) => q.eq('fid', args.fid))
      .unique()

    if (!user || !user.addresses) {
      return null
    }

    let addresses = user.addresses

    if (args.type) {
      addresses = addresses.filter(
        (addr) => addr.type === args.type || addr.type === 'both',
      )
    }

    // Find default address
    const defaultAddr = addresses.find((addr) => addr.isDefault === true)
    if (defaultAddr) {
      return defaultAddr
    }

    // If no default, return first address
    return addresses[0] || null
  },
})

/**
 * Get all users (for admin personnel management)
 */
export const getAllUsers = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100
    const users = await ctx.db.query('users').collect()
    // Sort by createdAt descending if available, otherwise by name
    const sorted = users.sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return b.createdAt - a.createdAt
      }
      return a.name.localeCompare(b.name)
    })
    return sorted.slice(0, limit)
  },
})

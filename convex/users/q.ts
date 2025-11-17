import {query} from '../_generated/server'
import {v} from 'convex/values'

export const getCurrentUser = query({
  args: {
    firebaseId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_firebase_id', (q) => q.eq('firebaseId', args.firebaseId))
      .unique()

    return user
  },
})

export const getUserAddresses = query({
  args: {
    firebaseId: v.string(),
    type: v.optional(
      v.union(v.literal('shipping'), v.literal('billing'), v.literal('both')),
    ),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_firebase_id', (q) => q.eq('firebaseId', args.firebaseId))
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
    firebaseId: v.string(),
    type: v.optional(
      v.union(v.literal('shipping'), v.literal('billing'), v.literal('both')),
    ),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_firebase_id', (q) => q.eq('firebaseId', args.firebaseId))
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







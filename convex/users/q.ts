import {v} from 'convex/values'
import type {Doc, Id} from '../_generated/dataModel'
import type {QueryCtx} from '../_generated/server'
import {query} from '../_generated/server'
import type {AddressType} from './d'

const matchesType = (
  addressType: AddressType['type'],
  requestedType?: AddressType['type'],
) => {
  if (!requestedType) {
    return true
  }
  return addressType === requestedType || addressType === 'both'
}

const mapAddressDocToAddress = (doc: Doc<'addresses'>): AddressType => ({
  id: doc.id,
  bio: doc.bio,
  type: doc.type,
  firstName: doc.firstName,
  lastName: doc.lastName,
  company: doc.company,
  addressLine1: doc.addressLine1,
  addressLine2: doc.addressLine2,
  city: doc.city,
  state: doc.state,
  zipCode: doc.zipCode,
  country: doc.country,
  phone: doc.phone,
  isDefault: doc.isDefault,
  visible: doc.visible,
  telegram: doc.telegram,
  signal: doc.signal,
})

const getLegacyAddresses = (
  user: Doc<'users'>,
  type?: AddressType['type'],
): AddressType[] => {
  if (!user.addresses || user.addresses.length === 0) {
    return []
  }
  if (!type) {
    return user.addresses
  }
  return user.addresses.filter((address) => matchesType(address.type, type))
}

const getUserAddressDocs = async (ctx: QueryCtx, userId: Id<'users'>) =>
  ctx.db
    .query('addresses')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .collect()

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

    if (!user) {
      return []
    }

    const addressDocs = await getUserAddressDocs(ctx, user._id)
    if (addressDocs.length > 0) {
      return addressDocs
        .filter((doc) => matchesType(doc.type, args.type))
        .map(mapAddressDocToAddress)
    }

    // Backward compatibility for users who still have embedded addresses.
    return getLegacyAddresses(user, args.type)
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

    if (!user) {
      return null
    }

    const addressDocs = await getUserAddressDocs(ctx, user._id)
    if (addressDocs.length > 0) {
      const matchingDocs = addressDocs.filter((doc) => matchesType(doc.type, args.type))
      if (matchingDocs.length === 0) {
        return null
      }

      const defaultIdForType =
        args.type === 'shipping'
          ? user.defaultShippingAddressId
          : args.type === 'billing'
            ? user.defaultBillingAddressId
            : user.defaultShippingAddressId ?? user.defaultBillingAddressId

      if (defaultIdForType) {
        const defaultDoc = matchingDocs.find(
          (doc) => String(doc._id) === defaultIdForType,
        )
        if (defaultDoc) {
          return mapAddressDocToAddress(defaultDoc)
        }
      }

      const flaggedDefault = matchingDocs.find((doc) => doc.isDefault === true)
      if (flaggedDefault) {
        return mapAddressDocToAddress(flaggedDefault)
      }

      return mapAddressDocToAddress(matchingDocs[0])
    }

    const legacyAddresses = getLegacyAddresses(user, args.type)
    if (legacyAddresses.length === 0) {
      return null
    }

    const legacyDefault = legacyAddresses.find((addr) => addr.isDefault === true)
    if (legacyDefault) {
      return legacyDefault
    }

    return legacyAddresses[0]
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

import {v} from 'convex/values'
import type {Doc, Id} from '../_generated/dataModel'
import {internal} from '../_generated/api'
import type {MutationCtx} from '../_generated/server'
import {mutation} from '../_generated/server'
import {
  addressSchema,
  contactSchema,
  preferencesSchema,
  socialMediaSchema,
  type AddressType,
} from './d'

const supportsShipping = (type: AddressType['type']) =>
  type === 'shipping' || type === 'both'

const supportsBilling = (type: AddressType['type']) =>
  type === 'billing' || type === 'both'

const findFallbackDefaultId = (
  addresses: Doc<'addresses'>[],
  kind: 'shipping' | 'billing',
): string | null => {
  const fallback = addresses.find((address) =>
    kind === 'shipping'
      ? supportsShipping(address.type)
      : supportsBilling(address.type),
  )
  return fallback ? String(fallback._id) : null
}

const upsertUserAddress = async (
  ctx: MutationCtx,
  userId: Id<'users'>,
  address: AddressType,
  now: number,
): Promise<{id: Id<'addresses'>; inserted: boolean}> => {
  const existing = await ctx.db
    .query('addresses')
    .withIndex('by_user_address_id', (q) =>
      q.eq('userId', userId).eq('id', address.id),
    )
    .unique()

  if (existing) {
    await ctx.db.patch(existing._id, {
      ...address,
      updatedAt: now,
    })
    return {
      id: existing._id,
      inserted: false,
    }
  }

  const id = await ctx.db.insert('addresses', {
    userId,
    ...address,
    createdAt: now,
    updatedAt: now,
  })
  return {
    id,
    inserted: true,
  }
}

const syncLegacyAddressesToTable = async (
  ctx: MutationCtx,
  user: Doc<'users'>,
  addresses: AddressType[],
  now: number,
): Promise<{inserted: number; updated: number}> => {
  let inserted = 0
  let updated = 0
  let defaultShippingAddressId = user.defaultShippingAddressId ?? null
  let defaultBillingAddressId = user.defaultBillingAddressId ?? null
  let firstShippingAddressId: string | null = null
  let firstBillingAddressId: string | null = null
  const syncedAddressIds = new Set<string>()

  for (const address of addresses) {
    const result = await upsertUserAddress(ctx, user._id, address, now)
    if (result.inserted) {
      inserted += 1
    } else {
      updated += 1
    }

    const addressDocId = String(result.id)
    syncedAddressIds.add(addressDocId)
    if (
      supportsShipping(address.type) &&
      (address.isDefault === true || !defaultShippingAddressId)
    ) {
      defaultShippingAddressId = addressDocId
    }
    if (supportsShipping(address.type) && !firstShippingAddressId) {
      firstShippingAddressId = addressDocId
    }
    if (
      supportsBilling(address.type) &&
      (address.isDefault === true || !defaultBillingAddressId)
    ) {
      defaultBillingAddressId = addressDocId
    }
    if (supportsBilling(address.type) && !firstBillingAddressId) {
      firstBillingAddressId = addressDocId
    }
  }

  if (
    defaultShippingAddressId &&
    !syncedAddressIds.has(defaultShippingAddressId) &&
    firstShippingAddressId
  ) {
    defaultShippingAddressId = firstShippingAddressId
  }
  if (
    defaultBillingAddressId &&
    !syncedAddressIds.has(defaultBillingAddressId) &&
    firstBillingAddressId
  ) {
    defaultBillingAddressId = firstBillingAddressId
  }

  if (
    defaultShippingAddressId !== (user.defaultShippingAddressId ?? null) ||
    defaultBillingAddressId !== (user.defaultBillingAddressId ?? null)
  ) {
    await ctx.db.patch(user._id, {
      defaultShippingAddressId,
      defaultBillingAddressId,
      updatedAt: now,
    })
  }

  return {inserted, updated}
}

export const createOrUpdateUser = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    firebaseId: v.string(),
    fid: v.optional(v.string()),
    photoUrl: v.optional(v.string()),
    // Optional customer fields for backward compatibility
    contact: v.optional(contactSchema),
    addresses: v.optional(v.array(addressSchema)),
    socialMedia: v.optional(socialMediaSchema),
    dateOfBirth: v.optional(v.string()),
    gender: v.optional(
      v.union(
        v.literal('male'),
        v.literal('female'),
        v.literal('other'),
        v.literal('prefer-not-to-say'),
      ),
    ),
    preferences: v.optional(preferencesSchema),
    cashAppUsername: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now()

    // Check if user exists by fid
    const existing = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', args.email))
      .unique()

    if (existing) {
      // Update existing user - only patch fields that are provided (not undefined)
      const updates: {
        email: string
        name: string
        fid: string
        photoUrl?: string
        contact?: typeof args.contact
        socialMedia?: typeof args.socialMedia
        dateOfBirth?: string
        gender?: typeof args.gender
        preferences?: typeof args.preferences
        cashAppUsername?: string
        updatedAt: number
      } = {
        email: args.email,
        name: args.name,
        fid: args.firebaseId,
        updatedAt: now,
      }

      if (args.photoUrl !== undefined) updates.photoUrl = args.photoUrl
      if (args.contact !== undefined) updates.contact = args.contact
      if (args.socialMedia !== undefined) updates.socialMedia = args.socialMedia
      if (args.dateOfBirth !== undefined) updates.dateOfBirth = args.dateOfBirth
      if (args.gender !== undefined) updates.gender = args.gender
      if (args.preferences !== undefined) updates.preferences = args.preferences
      if (args.cashAppUsername !== undefined)
        updates.cashAppUsername = args.cashAppUsername

      await ctx.db.patch(existing._id, updates)

      if (args.addresses && args.addresses.length > 0) {
        await syncLegacyAddressesToTable(ctx, existing, args.addresses, now)
      }

      return existing._id
    }

    // Create new user
    const userId = await ctx.db.insert('users', {
      email: args.email,
      name: args.name,
      firebaseId: args.firebaseId,
      fid: args.firebaseId,
      photoUrl: args.photoUrl,
      contact: args.contact,
      socialMedia: args.socialMedia,
      dateOfBirth: args.dateOfBirth,
      gender: args.gender,
      preferences: args.preferences,
      cashAppUsername: args.cashAppUsername,
      createdAt: now,
      updatedAt: now,
    })

    if (args.addresses && args.addresses.length > 0) {
      const createdUser = await ctx.db.get(userId)
      if (createdUser) {
        await syncLegacyAddressesToTable(ctx, createdUser, args.addresses, now)
      }
    }

    // Log user signup activity
    await ctx.scheduler.runAfter(0, internal.activities.m.logUserSignup, {
      userId,
      userName: args.name,
      userEmail: args.email,
    })

    return userId
  },
})

export const getUserByFid = mutation({
  args: {
    fid: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_fid', (q) => q.eq('fid', args.fid))
      .unique()

    return user
  },
})

export const updateContact = mutation({
  args: {
    fid: v.string(),
    contact: contactSchema,
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_fid', (q) => q.eq('fid', args.fid))
      .unique()

    if (!user) {
      throw new Error('User not found')
    }

    // Merge with existing contact data
    const existingContact = user.contact || {}
    const updatedContact = {
      ...existingContact,
      ...args.contact,
    }

    await ctx.db.patch(user._id, {
      contact: updatedContact,
      updatedAt: Date.now(),
    })

    return user._id
  },
})

export const addAddress = mutation({
  args: {
    fid: v.string(),
    address: addressSchema,
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_fid', (q) => q.eq('fid', args.fid))
      .unique()

    if (!user) {
      throw new Error('User not found')
    }

    const now = Date.now()
    const upserted = await upsertUserAddress(ctx, user._id, args.address, now)
    const addressDocId = String(upserted.id)

    const updates: {
      defaultShippingAddressId?: string
      defaultBillingAddressId?: string
      updatedAt: number
    } = {
      updatedAt: now,
    }

    if (
      supportsShipping(args.address.type) &&
      (args.address.isDefault === true || !user.defaultShippingAddressId)
    ) {
      updates.defaultShippingAddressId = addressDocId
    }
    if (
      supportsBilling(args.address.type) &&
      (args.address.isDefault === true || !user.defaultBillingAddressId)
    ) {
      updates.defaultBillingAddressId = addressDocId
    }

    await ctx.db.patch(user._id, updates)

    return user._id
  },
})

export const updateAddress = mutation({
  args: {
    fid: v.string(),
    addressId: v.string(),
    address: addressSchema,
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_fid', (q) => q.eq('fid', args.fid))
      .unique()

    if (!user) {
      throw new Error('User not found')
    }

    const existingAddress = await ctx.db
      .query('addresses')
      .withIndex('by_user_address_id', (q) =>
        q.eq('userId', user._id).eq('id', args.addressId),
      )
      .unique()

    if (!existingAddress) {
      throw new Error('Address not found')
    }

    const now = Date.now()
    await ctx.db.patch(existingAddress._id, {
      ...args.address,
      updatedAt: now,
    })

    const addressDocId = String(existingAddress._id)
    const addresses = await ctx.db
      .query('addresses')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect()

    const updates: {
      defaultShippingAddressId?: string | null
      defaultBillingAddressId?: string | null
      updatedAt: number
    } = {
      updatedAt: now,
    }

    if (args.address.isDefault === true) {
      if (supportsShipping(args.address.type)) {
        updates.defaultShippingAddressId = addressDocId
      }
      if (supportsBilling(args.address.type)) {
        updates.defaultBillingAddressId = addressDocId
      }
    }

    if (
      user.defaultShippingAddressId === addressDocId &&
      !supportsShipping(args.address.type)
    ) {
      updates.defaultShippingAddressId = findFallbackDefaultId(
        addresses,
        'shipping',
      )
    }

    if (
      user.defaultBillingAddressId === addressDocId &&
      !supportsBilling(args.address.type)
    ) {
      updates.defaultBillingAddressId = findFallbackDefaultId(
        addresses,
        'billing',
      )
    }

    await ctx.db.patch(user._id, updates)

    return user._id
  },
})

export const removeAddress = mutation({
  args: {
    fid: v.string(),
    addressId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_fid', (q) => q.eq('fid', args.fid))
      .unique()

    if (!user) {
      throw new Error('User not found')
    }

    const existingAddress = await ctx.db
      .query('addresses')
      .withIndex('by_user_address_id', (q) =>
        q.eq('userId', user._id).eq('id', args.addressId),
      )
      .unique()

    if (!existingAddress) {
      throw new Error('Address not found')
    }

    await ctx.db.delete(existingAddress._id)

    const addressDocId = String(existingAddress._id)
    const remainingAddresses = await ctx.db
      .query('addresses')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect()

    const updates: {
      defaultShippingAddressId?: string | null
      defaultBillingAddressId?: string | null
      updatedAt: number
    } = {
      updatedAt: Date.now(),
    }

    if (user.defaultShippingAddressId === addressDocId) {
      updates.defaultShippingAddressId = findFallbackDefaultId(
        remainingAddresses,
        'shipping',
      )
    }

    if (user.defaultBillingAddressId === addressDocId) {
      updates.defaultBillingAddressId = findFallbackDefaultId(
        remainingAddresses,
        'billing',
      )
    }

    await ctx.db.patch(user._id, updates)

    return user._id
  },
})

export const updateSocialMedia = mutation({
  args: {
    fid: v.string(),
    socialMedia: socialMediaSchema,
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_fid', (q) => q.eq('fid', args.fid))
      .unique()

    if (!user) {
      throw new Error('User not found')
    }

    // Merge with existing social media data
    const existingSocialMedia = user.socialMedia || {}
    const updatedSocialMedia = {
      ...existingSocialMedia,
      ...args.socialMedia,
    }

    await ctx.db.patch(user._id, {
      socialMedia: updatedSocialMedia,
      updatedAt: Date.now(),
    })

    return user._id
  },
})

export const updatePreferences = mutation({
  args: {
    fid: v.string(),
    preferences: preferencesSchema,
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_fid', (q) => q.eq('fid', args.fid))
      .unique()

    if (!user) {
      throw new Error('User not found')
    }

    // Merge with existing preferences
    const existingPreferences = user.preferences || {}
    const updatedPreferences = {
      ...existingPreferences,
      ...args.preferences,
    }

    await ctx.db.patch(user._id, {
      preferences: updatedPreferences,
      updatedAt: Date.now(),
    })

    return user._id
  },
})

export const updateProfile = mutation({
  args: {
    fid: v.string(),
    name: v.optional(v.string()),
    photoUrl: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),
    gender: v.optional(
      v.union(
        v.literal('male'),
        v.literal('female'),
        v.literal('other'),
        v.literal('prefer-not-to-say'),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_fid', (q) => q.eq('fid', args.fid))
      .unique()

    if (!user) {
      throw new Error('User not found')
    }

    const updates: {
      name?: string
      photoUrl?: string
      dateOfBirth?: string
      gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say'
      updatedAt: number
    } = {
      updatedAt: Date.now(),
    }

    if (args.name !== undefined) updates.name = args.name
    if (args.photoUrl !== undefined) updates.photoUrl = args.photoUrl
    if (args.dateOfBirth !== undefined) updates.dateOfBirth = args.dateOfBirth
    if (args.gender !== undefined) updates.gender = args.gender

    await ctx.db.patch(user._id, updates)

    return user._id
  },
})

export const updateNotes = mutation({
  args: {
    userId: v.id('users'),
    notes: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId)
    if (!user) {
      throw new Error('User not found')
    }

    await ctx.db.patch(args.userId, {
      notes: args.notes,
      updatedAt: Date.now(),
    })

    return args.userId
  },
})

export const migrateLegacyAddressesToTable = mutation({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const users = await ctx.db.query('users').collect()
    const max = args.limit ?? users.length

    let usersScanned = 0
    let usersMigrated = 0
    let addressesInserted = 0
    let addressesUpdated = 0

    for (const user of users.slice(0, max)) {
      usersScanned += 1
      if (!user.addresses || user.addresses.length === 0) {
        continue
      }

      const result = await syncLegacyAddressesToTable(
        ctx,
        user,
        user.addresses,
        Date.now(),
      )
      usersMigrated += 1
      addressesInserted += result.inserted
      addressesUpdated += result.updated
    }

    return {
      usersScanned,
      usersMigrated,
      addressesInserted,
      addressesUpdated,
    }
  },
})

export const purgeTestUsers = mutation({
  handler: async ({db}) => {
    const allItems = await db.query('users').collect()
    const itemsToDelete = allItems.filter((item) =>
      item.email.startsWith('test'),
    )
    for (const item of itemsToDelete) {
      const userAddresses = await db
        .query('addresses')
        .withIndex('by_user', (q) => q.eq('userId', item._id))
        .collect()
      for (const address of userAddresses) {
        await db.delete(address._id)
      }
      await db.delete(item._id)
    }
    return itemsToDelete.length
  },
})

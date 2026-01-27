import {v} from 'convex/values'
import {mutation} from '../_generated/server'
import {addressSchema, contactSchema, socialMediaSchema, preferencesSchema} from './d'
import {internal} from '../_generated/api'

export const createOrUpdateUser = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    firebaseId: v.string(),
    photoUrl: v.optional(v.string()),
    // Optional customer fields for backward compatibility
    contact: v.optional(contactSchema),
    addresses: v.optional(v.array(addressSchema)),
    socialMedia: v.optional(socialMediaSchema),
    dateOfBirth: v.optional(v.string()),
    gender: v.optional(v.union(v.literal('male'), v.literal('female'), v.literal('other'), v.literal('prefer-not-to-say'))),
    preferences: v.optional(preferencesSchema),
    cashAppUsername: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    
    // Check if user exists by firebaseId
    const existing = await ctx.db
      .query('users')
      .withIndex('by_firebase_id', (q) => q.eq('firebaseId', args.firebaseId))
      .unique()

    if (existing) {
      // Update existing user - only patch fields that are provided (not undefined)
      const updates: {
        email: string
        name: string
        photoUrl?: string
        contact?: typeof args.contact
        addresses?: typeof args.addresses
        socialMedia?: typeof args.socialMedia
        dateOfBirth?: string
        gender?: typeof args.gender
        preferences?: typeof args.preferences
        cashAppUsername?: string
        updatedAt: number
      } = {
        email: args.email,
        name: args.name,
        updatedAt: now,
      }

      if (args.photoUrl !== undefined) updates.photoUrl = args.photoUrl
      if (args.contact !== undefined) updates.contact = args.contact
      if (args.addresses !== undefined) updates.addresses = args.addresses
      if (args.socialMedia !== undefined) updates.socialMedia = args.socialMedia
      if (args.dateOfBirth !== undefined) updates.dateOfBirth = args.dateOfBirth
      if (args.gender !== undefined) updates.gender = args.gender
      if (args.preferences !== undefined) updates.preferences = args.preferences
      if (args.cashAppUsername !== undefined)
        updates.cashAppUsername = args.cashAppUsername

      await ctx.db.patch(existing._id, updates)
      return existing._id
    }

    // Create new user
    const userId = await ctx.db.insert('users', {
      email: args.email,
      name: args.name,
      firebaseId: args.firebaseId,
      photoUrl: args.photoUrl,
      contact: args.contact,
      addresses: args.addresses,
      socialMedia: args.socialMedia,
      dateOfBirth: args.dateOfBirth,
      gender: args.gender,
      preferences: args.preferences,
      cashAppUsername: args.cashAppUsername,
      createdAt: now,
      updatedAt: now,
    })

    // Log user signup activity
    await ctx.scheduler.runAfter(0, internal.activities.m.logUserSignup, {
      userId,
      userName: args.name,
      userEmail: args.email,
    })

    return userId
  },
})

export const getUserByFirebaseId = mutation({
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

export const updateContact = mutation({
  args: {
    firebaseId: v.string(),
    contact: contactSchema,
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_firebase_id', (q) => q.eq('firebaseId', args.firebaseId))
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
    firebaseId: v.string(),
    address: addressSchema,
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_firebase_id', (q) => q.eq('firebaseId', args.firebaseId))
      .unique()

    if (!user) {
      throw new Error('User not found')
    }

    const addresses = user.addresses || []
    addresses.push(args.address)

    await ctx.db.patch(user._id, {
      addresses,
      updatedAt: Date.now(),
    })

    return user._id
  },
})

export const updateAddress = mutation({
  args: {
    firebaseId: v.string(),
    addressId: v.string(),
    address: addressSchema,
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_firebase_id', (q) => q.eq('firebaseId', args.firebaseId))
      .unique()

    if (!user) {
      throw new Error('User not found')
    }

    const addresses = user.addresses || []
    const index = addresses.findIndex((addr) => addr.id === args.addressId)

    if (index === -1) {
      throw new Error('Address not found')
    }

    addresses[index] = args.address

    await ctx.db.patch(user._id, {
      addresses,
      updatedAt: Date.now(),
    })

    return user._id
  },
})

export const removeAddress = mutation({
  args: {
    firebaseId: v.string(),
    addressId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_firebase_id', (q) => q.eq('firebaseId', args.firebaseId))
      .unique()

    if (!user) {
      throw new Error('User not found')
    }

    const addresses = (user.addresses || []).filter(
      (addr) => addr.id !== args.addressId,
    )

    await ctx.db.patch(user._id, {
      addresses,
      updatedAt: Date.now(),
    })

    return user._id
  },
})

export const updateSocialMedia = mutation({
  args: {
    firebaseId: v.string(),
    socialMedia: socialMediaSchema,
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_firebase_id', (q) => q.eq('firebaseId', args.firebaseId))
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
    firebaseId: v.string(),
    preferences: preferencesSchema,
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_firebase_id', (q) => q.eq('firebaseId', args.firebaseId))
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
    firebaseId: v.string(),
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
      .withIndex('by_firebase_id', (q) => q.eq('firebaseId', args.firebaseId))
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

export const purgeTestUsers = mutation({
  handler: async ({db}) => {
    const allItems = await db.query('users').collect()
    const itemsToDelete = allItems.filter((item) =>
      item.email.startsWith('test'),
    )
    for (const item of itemsToDelete) {
      await db.delete(item._id)
    }
    return itemsToDelete.length
  },
})

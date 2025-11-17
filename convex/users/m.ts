import {v} from 'convex/values'
import {mutation} from '../_generated/server'

export const createOrUpdateUser = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    firebaseId: v.string(),
    photoUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user exists by firebaseId
    const existing = await ctx.db
      .query('users')
      .withIndex('by_firebase_id', (q) => q.eq('firebaseId', args.firebaseId))
      .unique()

    if (existing) {
      // Update existing user
      await ctx.db.patch(existing._id, {
        email: args.email,
        name: args.name,
        photoUrl: args.photoUrl,
      })
      return existing._id
    }

    // Create new user
    const userId = await ctx.db.insert('users', {
      email: args.email,
      name: args.name,
      firebaseId: args.firebaseId,
      photoUrl: args.photoUrl,
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

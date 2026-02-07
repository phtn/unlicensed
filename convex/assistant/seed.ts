import {mutation} from '../_generated/server'
import {
  ASSISTANT_AVATAR,
  ASSISTANT_EMAIL,
  ASSISTANT_NAME,
  ASSISTANT_PRO_ID,
  ASSISTANT_USERNAME,
} from './d'

/**
 * Seed the assistant user and profile.
 * This should be called once to create the Protap Assistant user.
 * Safe to call multiple times - will not duplicate.
 */
export const seedAssistant = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if assistant already exists
    const existingUser = await ctx.db
      .query('users')
      .withIndex('by_fid', (q) => q.eq('fid', ASSISTANT_PRO_ID))
      .first()

    if (existingUser) {
      // Update avatar URL if needed
      if (existingUser.photoUrl !== ASSISTANT_AVATAR) {
        await ctx.db.patch(existingUser._id, {
          photoUrl: ASSISTANT_AVATAR,
          updatedAt: Date.now(),
        })
      }

      // Check profile exists
      const existingProfile = await ctx.db
        .query('users')
        .withIndex('by_fid', (q) => q.eq('fid', ASSISTANT_PRO_ID))
        .first()

      if (existingProfile) {
        // Update profile if needed
        await ctx.db.patch(existingProfile._id, {
          photoUrl: ASSISTANT_AVATAR,
          name: ASSISTANT_USERNAME,
          updatedAt: Date.now(),
        })
      }

      return {
        success: true,
        message: 'Assistant already exists, updated',
        userId: existingUser._id,
      }
    }

    // Create the assistant user
    const userId = await ctx.db.insert('users', {
      firebaseId: ASSISTANT_PRO_ID,
      email: ASSISTANT_EMAIL,
      name: ASSISTANT_NAME,
      photoUrl: ASSISTANT_AVATAR,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    // Create the assistant profile
    const profileId = await ctx.db.insert('users', {
      firebaseId: ASSISTANT_PRO_ID,
      fid: ASSISTANT_PRO_ID,
      name: ASSISTANT_USERNAME,
      photoUrl: ASSISTANT_AVATAR,
      email: ASSISTANT_EMAIL,
      bio: "Hi! I'm Protap Girl, your AI assistant. I can help you with questions about Protap, including features, insurance coverage, digital business cards, and our policies.",
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    return {
      success: true,
      message: 'Assistant created successfully',
      userId,
      profileId,
    }
  },
})

/**
 * Get the assistant user
 */
export const getAssistant = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_fid', (q) => q.eq('fid', ASSISTANT_PRO_ID))
      .first()

    if (!user) {
      return null
    }

    const profile = await ctx.db
      .query('users')
      .withIndex('by_fid', (q) => q.eq('fid', ASSISTANT_PRO_ID))
      .first()

    return {
      user,
      profile,
    }
  },
})

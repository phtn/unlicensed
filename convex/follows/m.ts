import {v} from 'convex/values'
import {mutation} from '../_generated/server'

// Follow a user
export const follow = mutation({
  args: {
    followedId: v.id('users'), // The user to follow
    followerId: v.string(), // The current user's proId (Firebase UID)
  },
  handler: async (ctx, args) => {
    // Get the follower user by proId
    const follower = await ctx.db
      .query('users')
      .withIndex('by_fid', (q) => q.eq('fid', args.followerId))
      .first()

    if (!follower) {
      throw new Error('Follower user not found')
    }

    // Check if already following
    const existingFollow = await ctx.db
      .query('follows')
      .withIndex('by_follower_followed', (q) =>
        q.eq('followerId', follower._id).eq('followedId', args.followedId),
      )
      .first()

    if (existingFollow) {
      // Already following, return existing follow
      return existingFollow._id
    }

    // Prevent self-follow
    if (follower._id === args.followedId) {
      throw new Error('Cannot follow yourself')
    }

    // Create the follow relationship
    const followId = await ctx.db.insert('follows', {
      followerId: follower._id,
      followedId: args.followedId,
      createdAt: new Date().toISOString(),
      visible: true,
    })

    // Get the followed user to create notification
    const followedUser = await ctx.db.get(args.followedId)
    if (followedUser) {
      // Create a notification for the followed user
      await ctx.db.insert('notifications', {
        uid: followedUser._id,
        fid: followedUser.fid!,
        type: 'follow',
        actorId: follower._id,
        title: 'New Follower',
        message: `${follower.name ?? follower.email} started following you`,
        readAt: null,
        createdAt: new Date().toISOString(),
        visible: true,
        relatedEntityId: followId,
        actionUrl: null, // Could link to follower's profile
      })

      const followedProfile = await ctx.db.get('users', followedUser._id)
      const tokens =
        followedProfile?.fcm?.tokens?.filter((t) => t.length > 0) ?? []
      const token = followedProfile?.fcm?.token
      const hasDeclined = followedProfile?.fcm?.hasDeclined === true

      // const sendTokens = tokens.length > 0 ? tokens : token ? [token] : []
      // if (sendTokens.length > 0 && !hasDeclined) {
      //   for (const token of sendTokens) {
      //     await ctx.scheduler.runAfter(0, api.push.a.sendToToken, {
      //       token,
      //       title: 'New Follower',
      //       body: `${follower.name || follower.email} started following you`,
      //       url: '/account',
      //     })
      //   }
      // }
    }

    return followId
  },
})

// Unfollow a user
export const unfollow = mutation({
  args: {
    followedId: v.id('users'), // The user to unfollow
    followerId: v.string(), // The current user's proId (Firebase UID)
  },
  handler: async (ctx, args) => {
    // Get the follower user by proId
    const follower = await ctx.db
      .query('users')
      .withIndex('by_fid', (q) => q.eq('fid', args.followerId))
      .first()

    if (!follower) {
      throw new Error('Follower user not found')
    }

    // Find the follow relationship
    const existingFollow = await ctx.db
      .query('follows')
      .withIndex('by_follower_followed', (q) =>
        q.eq('followerId', follower._id).eq('followedId', args.followedId),
      )
      .first()

    if (!existingFollow) {
      // Not following, return null
      return null
    }

    // Delete the follow relationship
    await ctx.db.delete(existingFollow._id)

    return existingFollow._id
  },
})

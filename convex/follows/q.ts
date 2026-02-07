import {v} from 'convex/values'
import {query} from '../_generated/server'

// Check if a user is following another user
export const isFollowing = query({
  args: {
    followerId: v.string(), // Current user's proId (Firebase UID) or null if not logged in
    followedId: v.id('users'), // The user being checked
  },
  handler: async (ctx, args) => {
    if (!args.followerId) {
      return false
    }

    // Get the follower user by proId
    const follower = await ctx.db
      .query('users')
      .withIndex('by_fid', (q) => q.eq('fid', args.followerId))
      .first()

    if (!follower) {
      return false
    }

    // Check if following
    const follow = await ctx.db
      .query('follows')
      .withIndex('by_follower_followed', (q) =>
        q.eq('followerId', follower._id).eq('followedId', args.followedId),
      )
      .first()

    return follow !== null
  },
})

// Get follower count for a user
export const getFollowerCount = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const followers = await ctx.db
      .query('follows')
      .withIndex('by_followed', (q) => q.eq('followedId', args.userId))
      .filter((q) => q.eq(q.field('visible'), true))
      .collect()

    return followers.length
  },
})

// Get following count for a user
export const getFollowingCount = query({
  args: {
    followerId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const following = await ctx.db
      .query('follows')
      .withIndex('by_follower', (q) => q.eq('followerId', args.followerId))
      .filter((q) => q.eq(q.field('visible'), true))
      .collect()

    return following.length
  },
})

// Get all followers of a user
export const getFollowers = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const follows = await ctx.db
      .query('follows')
      .withIndex('by_followed', (q) => q.eq('followedId', args.userId))
      .filter((q) => q.eq(q.field('visible'), true))
      .collect()

    // Get user details for each follower
    const followers = await Promise.all(
      follows.map(async (follow) => {
        const user = await ctx.db.get(follow.followerId)
        let name = null
        if (user) {
          const profile = await ctx.db.get('users', user._id)
          name = profile?.name ?? null
        }
        return {
          ...follow,
          user: user ? {...user, name} : null,
        }
      }),
    )

    return followers
  },
})

// Get all users that a user is following
export const getFollowing = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const follows = await ctx.db
      .query('follows')
      .withIndex('by_follower', (q) => q.eq('followerId', args.userId))
      .filter((q) => q.eq(q.field('visible'), true))
      .collect()

    // Get user details for each followed user
    const following = await Promise.all(
      follows.map(async (follow) => {
        const user = await ctx.db.get(follow.followedId)
        return {
          ...follow,
          user,
        }
      }),
    )

    return following
  },
})

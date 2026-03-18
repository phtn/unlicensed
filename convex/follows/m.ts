import {v} from 'convex/values'
import {mutation} from '../_generated/server'
import {
  chatParticipantIdValidator,
  getChatParticipantByFid,
  getChatParticipantById,
  getChatParticipantFid,
} from '../messages/participants'
import {resolveStaffChatUser} from '../staff/chat'

// Connect admin with staff member for chat: creates follow and returns staff user's fid
export const connectStaffForChat = mutation({
  args: {
    staffId: v.id('staff'),
    currentUserFid: v.string(), // Firebase UID of the admin initiating the chat
  },
  handler: async (ctx, args) => {
    const staff = await ctx.db.get(args.staffId)
    if (!staff) {
      throw new Error('Staff member not found')
    }

    const {user: staffUser, fid: staffUserFid} = await resolveStaffChatUser(
      ctx,
      staff,
    )

    const follower = await ctx.db
      .query('users')
      .withIndex('by_fid', (q) => q.eq('fid', args.currentUserFid))
      .first()

    if (!follower) {
      throw new Error('Current user not found')
    }

    const existingFollow = await ctx.db
      .query('follows')
      .withIndex('by_follower_followed', (q) =>
        q.eq('followerId', follower._id).eq('followedId', staffUser._id),
      )
      .first()

    if (!existingFollow) {
      if (follower._id !== staffUser._id) {
        await ctx.db.insert('follows', {
          followerId: follower._id,
          followedId: staffUser._id,
          createdAt: new Date().toISOString(),
          visible: true,
        })
      }
    }

    return {staffUserFid}
  },
})

// Connect current user with a customer for chat: creates follow and returns customer fid
export const connectCustomerForChat = mutation({
  args: {
    customerId: chatParticipantIdValidator,
    currentUserFid: v.string(), // Firebase UID of the user initiating the chat
  },
  handler: async (ctx, args) => {
    const customer = await getChatParticipantById(ctx, args.customerId)
    if (!customer) {
      throw new Error('Customer not found')
    }

    const customerFid = getChatParticipantFid(customer)
    if (!customerFid) {
      throw new Error('Customer does not have a linked user account to chat')
    }

    const follower = await getChatParticipantByFid(ctx, args.currentUserFid)

    if (!follower) {
      throw new Error('Current user not found')
    }

    const existingFollow = await ctx.db
      .query('follows')
      .withIndex('by_follower_followed', (q) =>
        q.eq('followerId', follower._id).eq('followedId', customer._id),
      )
      .first()

    if (!existingFollow) {
      if (follower._id !== customer._id) {
        await ctx.db.insert('follows', {
          followerId: follower._id,
          followedId: customer._id,
          createdAt: new Date().toISOString(),
          visible: true,
        })
      }
    }

    return {customerFid}
  },
})

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

      // Push notification wiring intentionally disabled for follow events.
      // const followedProfile = await ctx.db.get('users', followedUser._id)
      // const tokens =
      //   followedProfile?.fcm?.tokens?.filter((t) => t.length > 0) ?? []
      // const token = followedProfile?.fcm?.token
      // const hasDeclined = followedProfile?.fcm?.hasDeclined === true
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

import {v} from 'convex/values'
import {Id} from '../_generated/dataModel'
import {query} from '../_generated/server'
import {ASSISTANT_PRO_ID} from '../assistant/d'
import {LastMessage, OtherUser} from './d'

// Check if two users are connected (either follows the other)
export const areConnected = query({
  args: {
    user1Id: v.string(), // First user's proId (Firebase UID)
    user2Id: v.string(), // Second user's proId (Firebase UID)
  },
  handler: async (ctx, args) => {
    // Get both users by proId
    const user1 = await ctx.db
      .query('users')
      .withIndex('by_fid', (q) => q.eq('fid', args.user1Id))
      .first()

    const user2 = await ctx.db
      .query('users')
      .withIndex('by_fid', (q) => q.eq('fid', args.user2Id))
      .first()

    if (!user1 || !user2) {
      return false
    }

    // Check if user1 follows user2
    const follow1 = await ctx.db
      .query('follows')
      .withIndex('by_follower_followed', (q) =>
        q.eq('followerId', user1._id).eq('followedId', user2._id),
      )
      .filter((q) => q.eq(q.field('visible'), true))
      .first()

    // Check if user2 follows user1
    const follow2 = await ctx.db
      .query('follows')
      .withIndex('by_follower_followed', (q) =>
        q.eq('followerId', user2._id).eq('followedId', user1._id),
      )
      .filter((q) => q.eq(q.field('visible'), true))
      .first()

    // Users are connected if either follows the other
    return follow1 !== null || follow2 !== null
  },
})

// Search conversations and users
export const searchConversations = query({
  args: {
    fid: v.string(), // Current user's proId (Firebase UID)
    searchQuery: v.string(), // Search term
  },
  handler: async (ctx, args) => {
    if (!args.searchQuery.trim()) {
      return []
    }

    const searchLower = args.searchQuery.toLowerCase().trim()

    // Get the user by proId
    const user = await ctx.db
      .query('users')
      .withIndex('by_fid', (q) => q.eq('fid', args.fid))
      .first()

    if (!user) {
      return []
    }

    // Get archived conversation partner IDs for this user
    const archivedRecords = await ctx.db
      .query('archivedConversations')
      .withIndex('by_userId', (q) => q.eq('userId', user._id))
      .collect()
    const archivedOtherUserIds = new Set(
      archivedRecords.map((r) => r.otherUserId as string),
    )

    // Get all connected users (people user follows or who follow user)
    const following = await ctx.db
      .query('follows')
      .withIndex('by_follower', (q) => q.eq('followerId', user._id))
      .filter((q) => q.eq(q.field('visible'), true))
      .collect()

    const followers = await ctx.db
      .query('follows')
      .withIndex('by_followed', (q) => q.eq('followedId', user._id))
      .filter((q) => q.eq(q.field('visible'), true))
      .collect()

    // Get all connected user IDs
    const connectedUserIds = new Set<string>()
    for (const follow of following) {
      connectedUserIds.add(follow.followedId as string)
    }
    for (const follow of followers) {
      connectedUserIds.add(follow.followerId as string)
    }

    // Check if current user is staff with admin privileges (can search staff)
    const currentUserStaff = await ctx.db
      .query('staff')
      .withIndex('by_email', (q) => q.eq('email', user.email))
      .unique()
    const isStaffAdmin =
      !!currentUserStaff &&
      currentUserStaff.active &&
      currentUserStaff.accessRoles.includes('admin')

    // Get all users and filter by search query
    const allUsers = await ctx.db.query('users').collect()
    const matchingUsers = allUsers.filter((u) => {
      const isConnected = connectedUserIds.has(u._id as string)
      if (!isConnected) return false

      const name = (u.name || '').toLowerCase()
      const email = (u.email || '').toLowerCase()
      return (
        name.includes(searchLower) ||
        email.includes(searchLower) ||
        email.split('@')[0].includes(searchLower)
      )
    })

    // If staff admin: also search staff members and include their linked users
    const staffMatchingUserIds = new Set<string>()
    if (isStaffAdmin) {
      const allStaff = await ctx.db.query('staff').collect()
      const matchingStaff = allStaff.filter((s) => {
        if (!s.active) return false
        const name = (s.name || '').toLowerCase()
        const email = (s.email || '').toLowerCase()
        return (
          name.includes(searchLower) ||
          email.includes(searchLower) ||
          (email && email.split('@')[0].includes(searchLower))
        )
      })
      for (const s of matchingStaff) {
        let linkedUser: Awaited<ReturnType<typeof ctx.db.get>> = null
        const staffEmail = s.email
        if (s.userId) {
          linkedUser = await ctx.db.get(s.userId)
        } else if (staffEmail) {
          linkedUser = await ctx.db
            .query('users')
            .withIndex('by_email', (q) => q.eq('email', staffEmail))
            .first()
        }
        if (
          linkedUser &&
          'fid' in linkedUser &&
          linkedUser._id !== user._id
        ) {
          staffMatchingUserIds.add(linkedUser._id as string)
        }
      }
    }

    // Get conversations with matching messages
    const sentMessages = await ctx.db
      .query('messages')
      .withIndex('by_sender', (q) => q.eq('senderId', user._id))
      .filter((q) => q.eq(q.field('visible'), true))
      .collect()

    const receivedMessages = await ctx.db
      .query('messages')
      .withIndex('by_receiver', (q) => q.eq('receiverId', user._id))
      .filter((q) => q.eq(q.field('visible'), true))
      .collect()

    const allMessages = [...sentMessages, ...receivedMessages]
    const matchingMessageUserIds = new Set<string>()

    for (const message of allMessages) {
      if (message.content.toLowerCase().includes(searchLower)) {
        if (message.senderId === user._id) {
          matchingMessageUserIds.add(message.receiverId as string)
        } else {
          matchingMessageUserIds.add(message.senderId as string)
        }
      }
    }

    // Combine and get user details
    const resultUserIds = new Set([
      ...matchingUsers.map((u) => u._id as string),
      ...Array.from(matchingMessageUserIds),
      ...Array.from(staffMatchingUserIds),
    ])

    const results = await Promise.all(
      Array.from(resultUserIds).map(async (userId) => {
        const otherUser = await ctx.db.get(userId as Id<'users'>)
        if (!otherUser || !('fid' in otherUser)) return null
        const fid = otherUser.fid ?? otherUser.firebaseId

        // Get latest message with this user
        const messagesWithUser = allMessages.filter(
          (m) =>
            (m.senderId === user._id &&
              m.receiverId === (userId as Id<'users'>)) ||
            (m.receiverId === user._id &&
              m.senderId === (userId as Id<'users'>)),
        )

        const latestMessage =
          messagesWithUser.length > 0
            ? messagesWithUser.sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime(),
              )[0]
            : null

        return {
          otherUserId: userId,
          otherUser: {
            fid: fid ?? '',
            name: otherUser.name ?? null,
            email: otherUser.email ?? '',
            photoUrl: otherUser.photoUrl ?? null,
            proId: fid ?? undefined,
            displayName: otherUser.name ?? null,
            avatarUrl: otherUser.photoUrl ?? null,
          },
          lastMessage: latestMessage || {
            _id: null,
            content: 'No messages yet',
            createdAt: new Date().toISOString(),
            senderId: user._id,
            receiverId: userId as Id<'users'>,
          },
          unreadCount: receivedMessages.filter(
            (m) => m.senderId === (userId as Id<'users'>) && m.readAt === null,
          ).length,
          hasMessages: latestMessage !== null,
        }
      }),
    )

    // Filter out assistant, archived, and null results
    return results.filter(
      (r) =>
        r !== null &&
        r.otherUser?.fid !== ASSISTANT_PRO_ID &&
        !archivedOtherUserIds.has(r.otherUserId),
    )
  },
})

// Get all conversations for a user (users they've messaged or been messaged by)
// Also includes all connected users (people they follow or who follow them) even without messages
export const getConversations = query({
  args: {
    fid: v.string(), // Current user's proId (Firebase UID)
  },
  handler: async (ctx, args) => {
    // Get the user by proId
    const user = await ctx.db
      .query('users')
      .withIndex('by_fid', (q) => q.eq('fid', args.fid))
      .first()

    if (!user) {
      return []
    }

    // Get archived conversation partner IDs for this user
    const archivedRecords = await ctx.db
      .query('archivedConversations')
      .withIndex('by_userId', (q) => q.eq('userId', user._id))
      .collect()
    const archivedOtherUserIds = new Set(
      archivedRecords.map((r) => r.otherUserId as string),
    )

    // Get all messages where user is sender or receiver
    const sentMessages = await ctx.db
      .query('messages')
      .withIndex('by_sender', (q) => q.eq('senderId', user._id))
      .filter((q) => q.eq(q.field('visible'), true))
      .collect()

    const receivedMessages = await ctx.db
      .query('messages')
      .withIndex('by_receiver', (q) => q.eq('receiverId', user._id))
      .filter((q) => q.eq(q.field('visible'), true))
      .collect()

    // Create a map of conversation partners with their latest message
    const conversationsMap = new Map<
      string,
      {
        otherUserId: string
        otherUser: OtherUser | null
        lastMessage: LastMessage | null
        unreadCount: number
        hasMessages: boolean
      }
    >()

    // Process sent messages
    for (const message of sentMessages) {
      const otherUserId = message.receiverId
      const otherUserIdString = otherUserId as string
      const existing = conversationsMap.get(otherUserIdString)

      if (
        !existing ||
        !existing.lastMessage?.createdAt ||
        new Date(message.createdAt) >
          (existing.lastMessage?.createdAt &&
            new Date(existing.lastMessage.createdAt))
      ) {
        const otherUser = await ctx.db.get(message.receiverId)
        conversationsMap.set(otherUserIdString, {
          otherUserId: otherUserIdString,
          otherUser:
            otherUser && 'fid' in otherUser
              ? {
                  fid: otherUser.fid ?? otherUser.firebaseId ?? '',
                  name: otherUser.name ?? null,
                  email: otherUser.email ?? '',
                  photoUrl: otherUser.photoUrl ?? null,
                  proId: otherUser.fid ?? otherUser.firebaseId ?? undefined,
                  displayName: otherUser.name ?? null,
                  avatarUrl: otherUser.photoUrl ?? null,
                }
              : null,
          lastMessage: message,
          unreadCount: 0, // Sent messages don't count as unread
          hasMessages: true,
        })
      }
    }

    // Process received messages
    for (const message of receivedMessages) {
      const otherUserId = message.senderId
      const otherUserIdString = otherUserId as string
      const existing = conversationsMap.get(otherUserIdString)

      if (
        !existing ||
        !existing.lastMessage?.createdAt ||
        new Date(message.createdAt) >
          (existing.lastMessage?.createdAt &&
            new Date(existing.lastMessage.createdAt))
      ) {
        const otherUser = await ctx.db.get(message.senderId)
        const unreadCount = receivedMessages.filter(
          (m) => m.senderId === otherUserId && m.readAt === null,
        ).length

        conversationsMap.set(otherUserIdString, {
          otherUserId: otherUserIdString,
          otherUser:
            otherUser && 'fid' in otherUser
              ? {
                  fid: otherUser.fid ?? otherUser.firebaseId ?? '',
                  name: otherUser.name ?? null,
                  email: otherUser.email ?? '',
                  photoUrl: otherUser.photoUrl ?? null,
                  proId: otherUser.fid ?? otherUser.firebaseId ?? undefined,
                  displayName: otherUser.name ?? null,
                  avatarUrl: otherUser.photoUrl ?? null,
                }
              : null,
          lastMessage: message,
          unreadCount,
          hasMessages: true,
        })
      } else {
        // Update unread count for existing conversation
        const unreadCount = receivedMessages.filter(
          (m) => m.senderId === otherUserId && m.readAt === null,
        ).length
        existing.unreadCount = unreadCount
      }
    }

    // Get all connected users (people user follows or who follow user)
    const following = await ctx.db
      .query('follows')
      .withIndex('by_follower', (q) => q.eq('followerId', user._id))
      .filter((q) => q.eq(q.field('visible'), true))
      .collect()

    const followers = await ctx.db
      .query('follows')
      .withIndex('by_followed', (q) => q.eq('followedId', user._id))
      .filter((q) => q.eq(q.field('visible'), true))
      .collect()

    // Add connected users who don't have messages yet
    for (const follow of following) {
      const otherUserIdString = follow.followedId as string
      if (!conversationsMap.has(otherUserIdString)) {
        const otherUser = await ctx.db.get(follow.followedId)
        if (otherUser && 'fid' in otherUser) {
          const fid = otherUser.fid ?? otherUser.firebaseId ?? ''
          conversationsMap.set(otherUserIdString, {
            otherUserId: otherUserIdString,
            otherUser: {
              fid,
              name: otherUser.name ?? null,
              email: otherUser.email ?? '',
              photoUrl: otherUser.photoUrl ?? null,
              proId: fid || undefined,
              displayName: otherUser.name ?? null,
              avatarUrl: otherUser.photoUrl ?? null,
            },
            lastMessage: {
              _id: null,
              content: 'No messages yet',
              createdAt: follow.createdAt, // Use follow date as fallback
              senderId: user._id,
              receiverId: follow.followedId,
            },
            unreadCount: 0,
            hasMessages: false,
          })
        }
      }
    }

    for (const follow of followers) {
      const otherUserIdString = follow.followerId as string
      if (!conversationsMap.has(otherUserIdString)) {
        const otherUser = await ctx.db.get(follow.followerId)
        if (otherUser && 'fid' in otherUser) {
          const fid = otherUser.fid ?? otherUser.firebaseId ?? ''
          conversationsMap.set(otherUserIdString, {
            otherUserId: otherUserIdString,
            otherUser: {
              fid,
              name: otherUser.name ?? null,
              email: otherUser.email ?? '',
              photoUrl: otherUser.photoUrl ?? null,
              proId: fid || undefined,
              displayName: otherUser.name ?? null,
              avatarUrl: otherUser.photoUrl ?? null,
            },
            lastMessage: {
              _id: null,
              content: 'No messages yet',
              createdAt: follow.createdAt, // Use follow date as fallback
              senderId: follow.followerId,
              receiverId: user._id,
            },
            unreadCount: 0,
            hasMessages: false,
          })
        }
      }
    }

    // Convert map to array, filter out assistant and archived, then sort
    const conversations = Array.from(conversationsMap.values())
      .filter((conv) => conv.otherUser?.fid !== ASSISTANT_PRO_ID)
      .filter((conv) => !archivedOtherUserIds.has(conv.otherUserId))

    conversations.sort((a, b) => {
      // Prioritize conversations with messages
      if (a.hasMessages && !b.hasMessages) return -1
      if (!a.hasMessages && b.hasMessages) return 1
      // Sort by date (lastMessage may be null for connected users without messages)
      const aTime = a.lastMessage?.createdAt
        ? new Date(a.lastMessage.createdAt).getTime()
        : 0
      const bTime = b.lastMessage?.createdAt
        ? new Date(b.lastMessage.createdAt).getTime()
        : 0
      return bTime - aTime
    })

    return conversations
  },
})

// Get messages between two users
export const getMessages = query({
  args: {
    currentUserId: v.string(), // Current user's proId (Firebase UID)
    otherUserId: v.string(), // Other user's proId (Firebase UID)
  },
  handler: async (ctx, args) => {
    // Get both users by proId
    const currentUser = await ctx.db
      .query('users')
      .withIndex('by_fid', (q) => q.eq('fid', args.currentUserId))
      .first()

    const otherUser = await ctx.db
      .query('users')
      .withIndex('by_fid', (q) => q.eq('fid', args.otherUserId))
      .first()

    if (!currentUser || !otherUser) {
      return []
    }

    // Get messages where current user is sender and other user is receiver
    const sentMessages = await ctx.db
      .query('messages')
      .withIndex('by_sender_receiver', (q) =>
        q.eq('senderId', currentUser._id).eq('receiverId', otherUser._id),
      )
      .filter((q) => q.eq(q.field('visible'), true))
      .collect()

    // Get messages where other user is sender and current user is receiver
    const receivedMessages = await ctx.db
      .query('messages')
      .withIndex('by_sender_receiver', (q) =>
        q.eq('senderId', otherUser._id).eq('receiverId', currentUser._id),
      )
      .filter((q) => q.eq(q.field('visible'), true))
      .collect()

    // Combine and sort by creation time
    const allMessages = [...sentMessages, ...receivedMessages]
    allMessages.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )

    // Get storage URLs for attachments
    const messagesWithUrls = await Promise.all(
      allMessages.map(async (message) => {
        if (message.attachments && message.attachments.length > 0) {
          const attachmentsWithUrls = await Promise.all(
            message.attachments.map(async (attachment) => {
              const url = await ctx.storage.getUrl(attachment.storageId)
              return {
                ...attachment,
                url,
              }
            }),
          )
          return {
            ...message,
            attachments: attachmentsWithUrls,
          }
        }
        return message
      }),
    )

    return messagesWithUrls
  },
})

// Get unread message count for a user
export const getUnreadCount = query({
  args: {
    fid: v.string(), // Current user's proId (Firebase UID)
  },
  handler: async (ctx, args) => {
    // Get the user by proId
    const user = await ctx.db
      .query('users')
      .withIndex('by_fid', (q) => q.eq('fid', args.fid))
      .first()

    if (!user) {
      return 0
    }

    // Get the assistant user to exclude their messages
    const assistant = await ctx.db
      .query('users')
      .withIndex('by_fid', (q) => q.eq('fid', ASSISTANT_PRO_ID))
      .first()

    // Get all unread messages for the user (excluding assistant messages)
    const unreadMessages = await ctx.db
      .query('messages')
      .withIndex('by_receiver', (q) => q.eq('receiverId', user._id))
      .filter((q) =>
        q.and(
          q.eq(q.field('visible'), true),
          q.eq(q.field('readAt'), null),
          // Exclude messages from the assistant
          assistant ? q.neq(q.field('senderId'), assistant._id) : true,
        ),
      )
      .collect()

    return unreadMessages.length
  },
})

// Get message likes
export const getMessageLikes = query({
  args: {
    messageId: v.id('messages'),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId)
    if (!message || !message.likes) {
      return []
    }

    // Get user details for each like
    const likesWithUsers = await Promise.all(
      message.likes.map(async (like) => {
        const user = await ctx.db.get(like.userId)
        return {
          ...like,
          user,
        }
      }),
    )

    return likesWithUsers
  },
})

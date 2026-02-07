import {v} from 'convex/values'
import type {Id} from '../_generated/dataModel'
import {mutation} from '../_generated/server'

// Send a message to another user
export const sendMessage = mutation({
  args: {
    receiverId: v.string(), // The user to send the message to (Firebase UID)
    senderId: v.string(), // The current user's fid (Firebase UID)
    content: v.string(), // The message content
    attachments: v.optional(
      v.array(
        v.object({
          storageId: v.id('_storage'),
          fileName: v.string(),
          fileType: v.string(),
          fileSize: v.number(),
        }),
      ),
    ),
  },
  handler: async (ctx, args) => {
    // Validate content or attachments
    if (
      !args.content.trim() &&
      (!args.attachments || args.attachments.length === 0)
    ) {
      throw new Error('Message must have content or attachments')
    }

    // Get both users by fid
    const sender = await ctx.db
      .query('users')
      .withIndex('by_fid', (q) => q.eq('fid', args.senderId))
      .first()

    const receiver = await ctx.db
      .query('users')
      .withIndex('by_fid', (q) => q.eq('fid', args.receiverId))
      .first()

    if (!sender) {
      throw new Error('Sender user not found')
    }

    if (!receiver) {
      throw new Error('Receiver user not found')
    }

    // Prevent self-messaging
    if (sender._id === receiver._id) {
      throw new Error('Cannot send message to yourself')
    }

    // Check if users are connected (either follows the other)
    const follow1 = await ctx.db
      .query('follows')
      .withIndex('by_follower_followed', (q) =>
        q.eq('followerId', sender._id).eq('followedId', receiver._id),
      )
      .filter((q) => q.eq(q.field('visible'), true))
      .first()

    const follow2 = await ctx.db
      .query('follows')
      .withIndex('by_follower_followed', (q) =>
        q.eq('followerId', receiver._id).eq('followedId', sender._id),
      )
      .filter((q) => q.eq(q.field('visible'), true))
      .first()

    if (!follow1 && !follow2) {
      throw new Error('Users must be connected to send messages')
    }

    // Get URLs for attachments
    const attachmentsWithUrls = args.attachments
      ? await Promise.all(
          args.attachments.map(async (attachment) => {
            const url = await ctx.storage.getUrl(attachment.storageId)
            return {
              ...attachment,
              url,
            }
          }),
        )
      : undefined

    // Create the message
    const messageId = await ctx.db.insert('messages', {
      senderId: sender._id,
      receiverId: receiver._id,
      content: args.content.trim() || '',
      createdAt: new Date().toISOString(),
      readAt: null,
      visible: true,
      attachments: attachmentsWithUrls,
      likes: [],
    })

    // Unarchive this conversation for both users so it reappears in their lists
    const senderArchived = await ctx.db
      .query('archivedConversations')
      .withIndex('by_userId_otherUserId', (q) =>
        q.eq('userId', sender._id).eq('otherUserId', receiver._id),
      )
      .first()
    if (senderArchived) {
      await ctx.db.delete(senderArchived._id)
    }
    const receiverArchived = await ctx.db
      .query('archivedConversations')
      .withIndex('by_userId_otherUserId', (q) =>
        q.eq('userId', receiver._id).eq('otherUserId', sender._id),
      )
      .first()
    if (receiverArchived) {
      await ctx.db.delete(receiverArchived._id)
    }

    // Push notify receiver (best-effort).
    const receiverProfile = await ctx.db.get('users', receiver._id)

    const tokens =
      receiverProfile?.fcm?.tokens?.filter((t) => t.length > 0) ?? []
    const token = receiverProfile?.fcm?.token
    const hasDeclined = receiverProfile?.fcm?.hasDeclined === true
    const sendTokens = tokens.length > 0 ? tokens : token ? [token] : []
    if (sendTokens.length > 0 && !hasDeclined) {
      const senderName =
        sender.name ?? sender.email.split('@')[0] ?? 'New message'
      const body =
        args.content.trim() ||
        (args.attachments?.length ? 'Sent an attachment' : 'New message')
      const url = `/account/chat/${sender.fid}`

      // for (const token of sendTokens) {
      //   await ctx.scheduler.runAfter(0, api.push.a.sendToToken, {
      //     token,
      //     title: senderName,
      //     body,
      //     url,
      //   })
      // }
    }

    return messageId
  },
})

// Like a message
export const likeMessage = mutation({
  args: {
    messageId: v.id('messages'),
    userfid: v.string(), // Current user's fid (Firebase UID)
  },
  handler: async (ctx, args) => {
    // Get the message
    const message = await ctx.db.get(args.messageId)

    if (!message) {
      throw new Error('Message not found')
    }

    // Get the user by fid
    const user = await ctx.db
      .query('users')
      .withIndex('by_fid', (q) => q.eq('fid', args.userfid))
      .first()

    if (!user) {
      throw new Error('User not found')
    }

    // Check if already liked
    const existingLikes = message.likes || []
    const alreadyLiked = existingLikes.some((like) => like.userId === user._id)

    if (alreadyLiked) {
      // Unlike: remove the like
      const updatedLikes = existingLikes.filter(
        (like) => like.userId !== user._id,
      )
      await ctx.db.patch(args.messageId, {
        likes: updatedLikes,
      })
      return {liked: false, likesCount: updatedLikes.length}
    } else {
      // Like: add the like
      const updatedLikes = [
        ...existingLikes,
        {
          userId: user._id,
          likedAt: new Date().toISOString(),
        },
      ]
      await ctx.db.patch(args.messageId, {
        likes: updatedLikes,
      })
      return {liked: true, likesCount: updatedLikes.length}
    }
  },
})

// Mark messages as read
export const markAsRead = mutation({
  args: {
    senderfid: v.string(), // The user who sent the messages (Firebase UID)
    receiverfid: v.string(), // The current user's fid (Firebase UID)
  },
  handler: async (ctx, args) => {
    // Get both users by fid
    const sender = await ctx.db
      .query('users')
      .withIndex('by_fid', (q) => q.eq('fid', args.senderfid))
      .first()

    const receiver = await ctx.db
      .query('users')
      .withIndex('by_fid', (q) => q.eq('fid', args.receiverfid))
      .first()

    if (!sender || !receiver) {
      throw new Error('User not found')
    }

    // Get all unread messages from sender to receiver
    const unreadMessages = await ctx.db
      .query('messages')
      .withIndex('by_sender_receiver', (q) =>
        q.eq('senderId', sender._id).eq('receiverId', receiver._id),
      )
      .filter((q) =>
        q.and(q.eq(q.field('visible'), true), q.eq(q.field('readAt'), null)),
      )
      .collect()

    // Mark all as read
    const readAt = new Date().toISOString()
    for (const message of unreadMessages) {
      await ctx.db.patch(message._id, {
        readAt,
      })
    }

    return unreadMessages.length
  },
})

// Archive a conversation (hides it from the main list for the current user).
// When the other user no longer exists (e.g. deleted), pass otherUserId so we can still hide the conversation.
export const archiveConversation = mutation({
  args: {
    userfid: v.string(), // Current user's fid (Firebase UID)
    otherUserfid: v.string(), // Other participant's fid (Firebase UID)
    otherUserId: v.optional(v.string()), // Other participant's Convex user id (use when otherUser not found by fid)
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_fid', (q) => q.eq('fid', args.userfid))
      .first()

    if (!user) {
      throw new Error('User not found')
    }

    const otherUser = await ctx.db
      .query('users')
      .withIndex('by_fid', (q) => q.eq('fid', args.otherUserfid))
      .first()

    const otherUserIdToArchive: Id<'users'> | null = otherUser
      ? otherUser._id
      : typeof args.otherUserId === 'string'
        ? (args.otherUserId as Id<'users'>)
        : null

    if (!otherUserIdToArchive) {
      throw new Error('Other user not found')
    }

    const existing = await ctx.db
      .query('archivedConversations')
      .withIndex('by_userId_otherUserId', (q) =>
        q.eq('userId', user._id).eq('otherUserId', otherUserIdToArchive),
      )
      .first()

    if (existing) {
      return existing._id
    }

    return await ctx.db.insert('archivedConversations', {
      userId: user._id,
      otherUserId: otherUserIdToArchive,
      archivedAt: new Date().toISOString(),
    })
  },
})

// Delete a message (soft delete by setting visible to false)
export const deleteMessage = mutation({
  args: {
    messageId: v.id('messages'),
    userfid: v.string(), // Current user's fid (Firebase UID) to verify ownership
  },
  handler: async (ctx, args) => {
    // Get the message
    const message = await ctx.db.get(args.messageId)

    if (!message) {
      throw new Error('Message not found')
    }

    // Get the user by fid
    const user = await ctx.db
      .query('users')
      .withIndex('by_fid', (q) => q.eq('fid', args.userfid))
      .first()

    if (!user) {
      throw new Error('User not found')
    }

    // Only sender or receiver can delete the message
    if (message.senderId !== user._id && message.receiverId !== user._id) {
      throw new Error('Unauthorized to delete this message')
    }

    // Soft delete by setting visible to false
    await ctx.db.patch(args.messageId, {
      visible: false,
    })

    return args.messageId
  },
})

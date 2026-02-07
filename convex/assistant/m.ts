import {v} from 'convex/values'
import {mutation} from '../_generated/server'
import {ASSISTANT_PRO_ID} from './d'

/**
 * Send a message to/from the assistant.
 * This bypasses the follow requirement since the assistant is available to everyone.
 */
export const sendAssistantMessage = mutation({
  args: {
    fid: v.string(), // The user's proId
    content: v.string(), // The message content
    isFromAssistant: v.boolean(), // true if message is from assistant, false if from user
  },
  handler: async (ctx, args) => {
    if (!args.content.trim()) {
      throw new Error('Message content cannot be empty')
    }

    // Get user and assistant in parallel
    const [user, assistant] = await Promise.all([
      ctx.db
        .query('users')
        .withIndex('by_fid', (q) => q.eq('fid', args.fid))
        .first(),
      ctx.db
        .query('users')
        .withIndex('by_fid', (q) => q.eq('fid', ASSISTANT_PRO_ID))
        .first(),
    ])

    if (!user) {
      throw new Error('User not found')
    }

    if (!assistant) {
      throw new Error('Assistant not found. Please run seedAssistant first.')
    }

    // Determine sender and receiver based on isFromAssistant
    const senderId = args.isFromAssistant ? assistant._id : user._id
    const receiverId = args.isFromAssistant ? user._id : assistant._id

    // Create the message
    const messageId = await ctx.db.insert('messages', {
      senderId,
      receiverId,
      content: args.content.trim(),
      createdAt: new Date().toISOString(),
      readAt: args.isFromAssistant ? null : new Date().toISOString(), // User messages are auto-read by assistant
      visible: true,
      likes: [],
    })

    return messageId
  },
})

/**
 * Clear all messages between user and assistant
 */
export const clearAssistantMessages = mutation({
  args: {
    fid: v.string(),
  },
  handler: async (ctx, args) => {
    // Get user and assistant in parallel
    const [user, assistant] = await Promise.all([
      ctx.db
        .query('users')
        .withIndex('by_fid', (q) => q.eq('fid', args.fid))
        .first(),
      ctx.db
        .query('users')
        .withIndex('by_fid', (q) => q.eq('fid', ASSISTANT_PRO_ID))
        .first(),
    ])

    if (!user) {
      throw new Error('User not found')
    }

    if (!assistant) {
      return 0
    }

    // Get all messages between user and assistant in parallel
    const [sentMessages, receivedMessages] = await Promise.all([
      ctx.db
        .query('messages')
        .withIndex('by_sender_receiver', (q) =>
          q.eq('senderId', user._id).eq('receiverId', assistant._id),
        )
        .collect(),
      ctx.db
        .query('messages')
        .withIndex('by_sender_receiver', (q) =>
          q.eq('senderId', assistant._id).eq('receiverId', user._id),
        )
        .collect(),
    ])

    // Soft delete all messages
    const allMessages = [...sentMessages, ...receivedMessages]
    for (const message of allMessages) {
      await ctx.db.patch(message._id, {visible: false})
    }

    return allMessages.length
  },
})

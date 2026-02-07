import {v} from 'convex/values'
import {query} from '../_generated/server'
import {ASSISTANT_PRO_ID} from './d'

/**
 * Get all messages between the user and the assistant
 */
export const getAssistantMessages = query({
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

    if (!user || !assistant) {
      return []
    }

    // Get messages sent by user to assistant and from assistant to user in parallel
    const [sentMessages, receivedMessages] = await Promise.all([
      ctx.db
        .query('messages')
        .withIndex('by_sender_receiver', (q) =>
          q.eq('senderId', user._id).eq('receiverId', assistant._id),
        )
        .filter((q) => q.eq(q.field('visible'), true))
        .collect(),
      ctx.db
        .query('messages')
        .withIndex('by_sender_receiver', (q) =>
          q.eq('senderId', assistant._id).eq('receiverId', user._id),
        )
        .filter((q) => q.eq(q.field('visible'), true))
        .collect(),
    ])

    // Combine and sort by creation time
    const allMessages = [...sentMessages, ...receivedMessages]
    allMessages.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )

    // Transform to a simpler format with role
    return allMessages.map((msg) => ({
      id: msg._id,
      role:
        msg.senderId === assistant._id
          ? ('assistant' as const)
          : ('user' as const),
      content: msg.content,
      createdAt: msg.createdAt,
    }))
  },
})

/**
 * Get the assistant user for display purposes
 */
export const getAssistantUser = query({
  args: {},
  handler: async (ctx) => {
    const assistant = await ctx.db
      .query('users')
      .withIndex('by_fid', (q) => q.eq('fid', ASSISTANT_PRO_ID))
      .first()

    return assistant
  },
})

/**
 * Get the assistant's profile including isPublic and bio fields
 */
export const getAssistantProfile = query({
  args: {},
  handler: async (ctx) => {
    const assistant = await ctx.db
      .query('users')
      .withIndex('by_fid', (q) => q.eq('fid', ASSISTANT_PRO_ID))
      .first()

    return assistant
  },
})

/**
 * Get the last message with the assistant for preview
 */
export const getLastAssistantMessage = query({
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

    if (!user || !assistant) {
      return null
    }

    // Get all messages between user and assistant in parallel
    const [sentMessages, receivedMessages] = await Promise.all([
      ctx.db
        .query('messages')
        .withIndex('by_sender_receiver', (q) =>
          q.eq('senderId', user._id).eq('receiverId', assistant._id),
        )
        .filter((q) => q.eq(q.field('visible'), true))
        .collect(),
      ctx.db
        .query('messages')
        .withIndex('by_sender_receiver', (q) =>
          q.eq('senderId', assistant._id).eq('receiverId', user._id),
        )
        .filter((q) => q.eq(q.field('visible'), true))
        .collect(),
    ])

    // Get the most recent message
    const allMessages = [...sentMessages, ...receivedMessages]
    if (allMessages.length === 0) {
      return null
    }

    allMessages.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )

    const lastMessage = allMessages[0]
    return {
      content: lastMessage.content,
      createdAt: lastMessage.createdAt,
      isFromAssistant: lastMessage.senderId === assistant._id,
    }
  },
})

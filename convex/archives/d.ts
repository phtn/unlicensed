import {v} from 'convex/values'

export const archivedConversationSchema = v.object({
  userId: v.id('users'), // User who archived
  otherUserId: v.id('users'), // Conversation partner
  archivedAt: v.string(), // ISO timestamp
})

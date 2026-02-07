import {v} from 'convex/values'

export const notificationSchema = v.object({
  fid: v.string(),
  uid: v.id('users'), // The user who receives the notification
  type: v.union(
    v.literal('follow'), // Someone followed you
    v.literal('message'), // Someone sent you a message
    // Add more types as needed
  ),
  actorId: v.id('users'), // The user who performed the action (e.g., who followed you)
  title: v.string(), // Notification title
  message: v.string(), // Notification message
  readAt: v.union(v.string(), v.null()), // ISO timestamp when notification was read, null if unread
  createdAt: v.string(), // ISO timestamp
  visible: v.boolean(), // Visibility flag
  // Optional: link to related entity
  relatedEntityId: v.union(v.string(), v.null()), // e.g., message ID, follow ID
  actionUrl: v.union(v.string(), v.null()), // URL to navigate to when clicking notification
})

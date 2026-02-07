import type {Id} from '../_generated/dataModel'
import {Infer, v} from 'convex/values'

export const messageAttachmentSchema = v.array(
  v.object({
    storageId: v.id('_storage'), // Convex storage ID
    fileName: v.string(), // Original file name
    fileType: v.string(), // MIME type (e.g., 'image/png', 'application/pdf')
    fileSize: v.number(), // File size in bytes
    url: v.union(v.string(), v.null()), // URL to access the file (can be null initially)
  }),
)

export const messageSchema = v.object({
  senderId: v.id('users'), // The user who sent the message
  receiverId: v.id('users'), // The user who receives the message
  content: v.string(), // The message content
  createdAt: v.string(), // ISO timestamp
  readAt: v.union(v.string(), v.null()), // ISO timestamp when message was read, null if unread
  visible: v.boolean(), // Visibility flag
  // Media attachments
  attachments: v.optional(messageAttachmentSchema),
  // Likes
  likes: v.optional(
    v.array(
      v.object({
        userId: v.id('users'), // User who liked the message
        likedAt: v.string(), // ISO timestamp
      }),
    ),
  ),
})

/** Array of attachments on a message */
export type MessageAttachmentArray = Infer<typeof messageAttachmentSchema>
/** Single attachment item */
export type MessageAttachment = MessageAttachmentArray[number]

export interface IMessageAttachment {
  storageId: string
  fileName: string
  fileType: string
  fileSize: number
  url: string | null
}

/** User info for chat UI - fid is the Firebase/auth UID used for routing and lookups */
export interface OtherUser {
  fid: string
  name: string | null
  email: string
  photoUrl: string | null
  /** Alias for fid - for frontend compatibility */
  proId?: string
  /** Alias for name - for frontend compatibility */
  displayName?: string | null
  /** Alias for photoUrl - for frontend compatibility */
  avatarUrl?: string | null
}

export interface LastMessage {
  _id?: string | null
  content: string
  createdAt: string
  senderId?: Id<'users'>
  receiverId?: Id<'users'>
  attachments?: MessageAttachmentArray
}

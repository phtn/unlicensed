import {Id} from '@/convex/_generated/dataModel'

export interface Message {
  _id: Id<'messages'>
  senderId: Id<'users'>
  receiverId: Id<'users'>
  content: string
  createdAt: string
  readAt: string | null
  attachments?: Array<{
    storageId: Id<'_storage'>
    fileName: string
    fileType: string
    fileSize: number
    url: string | null
  }>
  likes?: Array<{
    userId: Id<'users'>
    likedAt: string
  }>
}

export type Attachment = NonNullable<Message['attachments']>[number]

export interface MessageListProps {
  messages: Message[] | undefined
  currentUserProId: string
  otherUserProId: string
  onOptimisticLike?: (messageId: Id<'messages'>, userId: Id<'users'>) => void
  onOptimisticUnlike?: (messageId: Id<'messages'>, userId: Id<'users'>) => void
}

export interface MessageGroup {
  date: string
  messages: Message[]
}

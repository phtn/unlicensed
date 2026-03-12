import {Infer, v} from 'convex/values'

export const conversationFolderSchema = v.object({
  ownerUserId: v.id('users'),
  name: v.string(),
  nameLower: v.string(),
  createdAt: v.string(),
  updatedAt: v.string(),
})

export type ConversationFolder = Infer<typeof conversationFolderSchema>

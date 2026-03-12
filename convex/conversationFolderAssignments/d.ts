import {Infer, v} from 'convex/values'

export const conversationFolderAssignmentSchema = v.object({
  ownerUserId: v.id('users'),
  otherUserId: v.id('users'),
  folderId: v.id('conversationFolders'),
  assignedAt: v.string(),
})

export type ConversationFolderAssignment = Infer<
  typeof conversationFolderAssignmentSchema
>

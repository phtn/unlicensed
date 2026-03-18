import {Infer, v} from 'convex/values'
import {chatParticipantIdValidator} from '../messages/participants'

export const conversationFolderAssignmentSchema = v.object({
  ownerUserId: v.id('users'),
  otherUserId: chatParticipantIdValidator,
  folderId: v.id('conversationFolders'),
  assignedAt: v.string(),
})

export type ConversationFolderAssignment = Infer<
  typeof conversationFolderAssignmentSchema
>

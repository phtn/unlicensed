import {v} from 'convex/values'
import {chatParticipantIdValidator} from '../messages/participants'

export const archivedConversationSchema = v.object({
  userId: chatParticipantIdValidator, // User or guest who archived
  otherUserId: chatParticipantIdValidator, // Conversation partner
  archivedAt: v.string(), // ISO timestamp
})

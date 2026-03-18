import {v} from 'convex/values'
import {chatParticipantIdValidator} from '../messages/participants'

export const followSchema = v.object({
  followerId: chatParticipantIdValidator, // The user or guest who is following
  followedId: chatParticipantIdValidator, // The user or guest being followed
  createdAt: v.string(), // ISO timestamp
  visible: v.boolean(),
})

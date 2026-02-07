import {v} from 'convex/values'

export const followSchema = v.object({
  followerId: v.id('users'), // The user who is following
  followedId: v.id('users'), // The user being followed
  createdAt: v.string(), // ISO timestamp
  visible: v.boolean(),
})

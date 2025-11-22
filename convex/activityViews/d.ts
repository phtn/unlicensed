import {Infer, v} from 'convex/values'

// Activity view schema - tracks which admins have viewed each activity
export const activityViewSchema = v.object({
  activityId: v.id('activities'),
  userId: v.id('users'), // Admin user who viewed the activity
  viewedAt: v.number(), // Timestamp when viewed
})

export type ActivityView = Infer<typeof activityViewSchema>



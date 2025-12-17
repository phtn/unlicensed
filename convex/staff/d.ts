import {Infer, v} from 'convex/values'

export const staffSchema = v.object({
  email: v.string(),
  name: v.optional(v.string()),
  position: v.string(),
  accessRoles: v.array(v.string()), // e.g., ['admin', 'editor', 'viewer']
  active: v.boolean(),
  userId: v.optional(v.id('users')), // Optional link to a user account
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
})

export type Staff = Infer<typeof staffSchema>

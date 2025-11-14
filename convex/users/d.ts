import {Infer, v} from 'convex/values'

export const userSchema = v.object({
  email: v.string(),
  name: v.string(),
  firebaseId: v.string(),
  photoUrl: v.optional(v.string()),
})

export type UserType = Infer<typeof userSchema>





import {Infer, v} from 'convex/values'
import {addressFields} from '../users/d'

export const addressRecordSchema = v.object({
  userId: v.id('users'),
  ...addressFields,
  createdAt: v.optional(v.number()),
  updatedAt: v.optional(v.number()),
})

export type AddressRecordType = Infer<typeof addressRecordSchema>

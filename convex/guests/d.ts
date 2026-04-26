import {Infer, v} from 'convex/values'
import {contactSchema} from '../users/d'

export const guestSchema = v.object({
  guestId: v.string(),
  visitorId: v.optional(v.string()),
  deviceFingerprintId: v.optional(v.string()),
  fid: v.string(),
  email: v.string(),
  name: v.string(),
  representativeId: v.optional(v.id('users')),
  photoUrl: v.optional(v.string()),
  contact: v.optional(contactSchema),
  country: v.optional(v.string()),
  countryCode: v.optional(v.string()),
  city: v.optional(v.string()),
  latitude: v.optional(v.number()),
  longitude: v.optional(v.number()),
  locationSource: v.optional(
    v.union(
      v.literal('browser'),
      v.literal('header'),
      v.literal('ip'),
      v.literal('unknown'),
    ),
  ),
  locationUpdatedAt: v.optional(v.number()),
  isActive: v.optional(v.boolean()),
  createdAt: v.optional(v.number()),
  updatedAt: v.optional(v.number()),
  notes: v.optional(v.string()),
})

export type GuestType = Infer<typeof guestSchema>

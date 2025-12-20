import {Infer, v} from 'convex/values'

export const courierSchema = v.object({
  name: v.string(),
  code: v.string(),
  active: v.boolean(),
  trackingUrlTemplate: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
})

export type Courier = Infer<typeof courierSchema>


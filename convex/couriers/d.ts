import {Infer, v} from 'convex/values'

const courierAccountSchema = v.object({
  id: v.string(),
  label: v.string(),
  value: v.string(),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
  updatedBy: v.optional(v.string()),
})

export const courierSchema = v.object({
  name: v.string(),
  code: v.string(),
  active: v.boolean(),
  trackingUrlTemplate: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
  accounts: v.optional(v.array(courierAccountSchema)),
})

export type Courier = Infer<typeof courierSchema>
export type CourierAccount = Infer<typeof courierAccountSchema>

import {Infer, v} from 'convex/values'

export const emailSettingsSchema = v.object({
  id: v.optional(v.string()),
  intent: v.optional(v.string()),
  visible: v.optional(v.boolean()),
  title: v.optional(v.string()),
  type: v.optional(v.string()),
  from: v.optional(v.array(v.string())),
  to: v.optional(v.array(v.string())),
  cc: v.optional(v.array(v.string())),
  bcc: v.optional(v.array(v.string())),
  subject: v.optional(v.string()),
  text: v.optional(v.string()),
  body: v.optional(v.string()),
  group: v.optional(v.string()),
  headers: v.optional(v.record(v.string(), v.string())),
  html: v.optional(v.string()),
  attachments: v.optional(
    v.array(v.object({filename: v.string(), contentBase64: v.string()})),
  ),
  updatedBy: v.optional(v.number()),
  updatedAt: v.optional(v.number()),
  createdAt: v.optional(v.number()),
  createdBy: v.optional(v.number()),
})

export type EmailSettings = Infer<typeof emailSettingsSchema>

import {Infer, v} from 'convex/values'

export const statConfigSchema = v.object({
  id: v.string(),
  label: v.string(),
  visible: v.boolean(),
  order: v.number(),
})

export const paygateSettingsSchema = v.object({
  apiUrl: v.optional(v.string()),
  checkoutUrl: v.optional(v.string()),
  usdcWallet: v.optional(v.string()),
  enabled: v.optional(v.boolean()),
})

export const adminSettingsSchema = v.object({
  statConfigs: v.array(statConfigSchema),
  paygate: v.optional(paygateSettingsSchema),
  updatedAt: v.number(),
})

export type StatConfig = Infer<typeof statConfigSchema>
export type PaygateSettings = Infer<typeof paygateSettingsSchema>
export type AdminSettings = Infer<typeof adminSettingsSchema>



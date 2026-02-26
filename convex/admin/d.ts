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

export const gatewayUrlSettingsSchema = v.object({
  apiUrl: v.optional(v.string()),
  checkoutUrl: v.optional(v.string()),
})

export const gatewayIdValidator = v.union(
  v.literal('paygate'),
  v.literal('paylex'),
  v.literal('rampex'),
)

export const paymentGatewayConfigsSchema = v.object({
  paygate: v.optional(gatewayUrlSettingsSchema),
  paylex: v.optional(gatewayUrlSettingsSchema),
  rampex: v.optional(gatewayUrlSettingsSchema),
  defaultGateway: v.optional(gatewayIdValidator),
})

export const adminSettingsSchema = v.object({
  id: v.optional(v.string()),
  label: v.optional(v.string()),
  name: v.optional(v.string()),
  identifier: v.optional(v.string()),
  value: v.optional(v.record(v.string(), v.any())),
  updatedAt: v.number(),
  updatedBy: v.optional(v.string()),
  createdAt: v.optional(v.number()),
  createdBy: v.optional(v.string()),
})

export type StatConfig = Infer<typeof statConfigSchema>
export type PaygateSettings = Infer<typeof paygateSettingsSchema>
export type AdminSettings = Infer<typeof adminSettingsSchema>

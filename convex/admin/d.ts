import {Infer, v} from 'convex/values'

export const statConfigSchema = v.object({
  id: v.string(),
  label: v.string(),
  visible: v.boolean(),
  order: v.number(),
})

export const adminSettingsSchema = v.object({
  statConfigs: v.array(statConfigSchema),
  updatedAt: v.number(),
})

export type StatConfig = Infer<typeof statConfigSchema>
export type AdminSettings = Infer<typeof adminSettingsSchema>



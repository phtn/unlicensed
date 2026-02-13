import {Infer, v} from 'convex/values'

export const categorySchema = {
  name: v.string(),
  slug: v.optional(v.string()),
  description: v.optional(v.string()),
  heroImage: v.optional(v.id('_storage')),
  highlight: v.optional(v.string()),
  benefits: v.optional(v.array(v.string())),
  productTypes: v.optional(v.array(v.string())),
  denominations: v.optional(v.array(v.number())),
  units: v.optional(v.array(v.string())),
  visible: v.optional(v.boolean()),
}
export const category = v.object({
  ...categorySchema,
  _id: v.id('categories'),
  _creationTime: v.number(),
})
export type CategoryType = Infer<typeof category>

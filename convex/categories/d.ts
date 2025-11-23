import {Infer, v} from 'convex/values'

export const categorySchema = {
  name: v.string(),
  slug: v.string(),
  description: v.string(),
  heroImage: v.string(),
  highlight: v.optional(v.string()),
  benefits: v.optional(v.array(v.string())),
}
export const category = v.object({
  ...categorySchema,
  _id: v.id('categories'),
  _creationTime: v.number(),
})
export type CategoryType = Infer<typeof category>

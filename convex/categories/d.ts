import {v} from 'convex/values'

export const categorySchema = {
  name: v.string(),
  slug: v.string(),
  description: v.string(),
  heroImage: v.string(),
  highlight: v.optional(v.string()),
  benefits: v.optional(v.array(v.string())),
}

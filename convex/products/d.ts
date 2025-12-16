import {Infer, v} from 'convex/values'

const potencyLevel = v.union(
  v.literal('mild'),
  v.literal('medium'),
  v.literal('high'),
)

export type PotencyLevel = Infer<typeof potencyLevel>

export const productSchema = v.object({
  name: v.string(),
  slug: v.string(),
  categoryId: v.id('categories'),
  categorySlug: v.string(),
  shortDescription: v.string(),
  description: v.string(),
  priceCents: v.number(),
  unit: v.string(),
  availableDenominations: v.optional(v.array(v.number())),
  popularDenomination: v.optional(v.number()),
  thcPercentage: v.number(),
  cbdPercentage: v.optional(v.number()),
  effects: v.array(v.string()),
  terpenes: v.array(v.string()),
  featured: v.boolean(),
  available: v.boolean(),
  stock: v.number(),
  rating: v.number(),
  image: v.string(),
  gallery: v.array(v.string()),
  consumption: v.string(),
  flavorNotes: v.array(v.string()),
  potencyLevel: potencyLevel,
  potencyProfile: v.optional(v.string()),
  weightGrams: v.optional(v.number()),
  variants: v.optional(
    v.array(
      v.object({
        label: v.string(),
        price: v.number(),
      }),
    ),
  ),
  eligibleForRewards: v.optional(v.boolean()), // Whether this product is eligible for rewards points
})

export type ProductType = Infer<typeof productSchema>

import {Infer, v} from 'convex/values'

const potencyLevel = v.union(
  v.literal('mild'),
  v.literal('medium'),
  v.literal('high'),
)

export type PotencyLevel = Infer<typeof potencyLevel>

export const productSchema = v.object({
  name: v.optional(v.string()),
  slug: v.optional(v.string()),
  categoryId: v.optional(v.id('categories')),
  categorySlug: v.optional(v.string()),
  shortDescription: v.optional(v.string()),
  description: v.optional(v.string()),
  priceCents: v.optional(v.number()),
  unit: v.optional(v.string()),
  availableDenominations: v.optional(v.array(v.number())),
  popularDenomination: v.optional(v.number()),
  thcPercentage: v.optional(v.number()),
  cbdPercentage: v.optional(v.optional(v.number())),
  effects: v.optional(v.array(v.string())),
  terpenes: v.optional(v.array(v.string())),
  featured: v.optional(v.boolean()),
  available: v.optional(v.boolean()),
  stock: v.optional(v.number()),
  rating: v.optional(v.number()),
  image: v.optional(v.id('_storage')),
  gallery: v.optional(v.array(v.union(v.id('_storage'), v.string()))),
  consumption: v.optional(v.string()),
  flavorNotes: v.optional(v.array(v.string())),
  potencyLevel: v.optional(potencyLevel),
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

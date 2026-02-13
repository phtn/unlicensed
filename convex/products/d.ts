import {Infer, v} from 'convex/values'

const potencyLevel = v.union(
  v.literal('mild'),
  v.literal('medium'),
  v.literal('high'),
)

export type PotencyLevel = Infer<typeof potencyLevel>

const productTier = v.union(
  v.literal('B'),
  v.literal('A'),
  v.literal('AA'),
  v.literal('AAA'),
  v.literal('AAAA'),
  v.literal('RARE'),
)

export type ProductTier = Infer<typeof productTier>

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
  popularDenomination: v.optional(v.array(v.number())),
  thcPercentage: v.optional(v.number()),
  cbdPercentage: v.optional(v.optional(v.number())),
  effects: v.optional(v.array(v.string())),
  terpenes: v.optional(v.array(v.string())),
  featured: v.optional(v.boolean()),
  available: v.optional(v.boolean()),
  stock: v.optional(v.number()),
  /** Per-denomination inventory. Key = denomination as string (e.g. "0.125", "1", "3.5"), value = count. */
  stockByDenomination: v.optional(v.record(v.string(), v.number())),
  priceByDenomination: v.optional(v.record(v.string(), v.number())),
  rating: v.optional(v.number()),
  image: v.optional(v.id('_storage')),
  gallery: v.optional(v.array(v.union(v.id('_storage'), v.string()))),
  consumption: v.optional(v.string()),
  flavorNotes: v.optional(v.array(v.string())),
  potencyLevel: v.optional(potencyLevel),
  potencyProfile: v.optional(v.string()),
  weightGrams: v.optional(v.number()),
  brand: v.optional(v.string()),
  lineage: v.optional(v.string()),
  noseRating: v.optional(v.number()),
  variants: v.optional(
    v.array(
      v.object({
        label: v.string(),
        price: v.number(),
      }),
    ),
  ),
  tier: v.optional(productTier),
  eligibleForRewards: v.optional(v.boolean()), // Whether this product is eligible for rewards points
  eligibleForDeals: v.optional(v.boolean()), // Whether this product is eligible for rewards points
  onSale: v.optional(v.boolean()),
  eligibleDenominationForDeals: v.optional(v.array(v.number())),
  eligibleForUpgrade: v.optional(v.boolean()),
  upgradePrice: v.optional(v.number()),
  dealType: v.optional(
    v.union(v.literal('withinTier'), v.literal('acrossTiers')),
  ),
  productType: v.optional(v.string()),
  netWeight: v.optional(v.number()),
  netWeightUnit: v.optional(v.string()),
  subcategory: v.optional(v.string()),
  batchId: v.optional(v.string()),
})

export type ProductType = Infer<typeof productSchema>

// flowers, extracts, edibles, vapes, pre-rolls
// in-house -> 1/8, 1/4, 1/2, 1
// branded -> only 1/8
// merch -> shirts,
// extracts -> 1,3,7 grams
// packaged -> 1,5,10 unit
// branded flower -> 1/8,1/4,1/2,1

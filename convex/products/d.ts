import {Infer, v} from 'convex/values'

const potencyLevel = v.union(
  v.literal('mild'),
  v.literal('medium'),
  v.literal('high'),
)

export type PotencyLevel = Infer<typeof potencyLevel>

const inventoryModeSchema = v.union(
  v.literal('by_denomination'),
  v.literal('shared'),
)

const strainTypeSchema = v.string()

const productFields = {
  name: v.optional(v.string()),
  slug: v.optional(v.string()),
  base: v.optional(v.string()),
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
  limited: v.optional(v.boolean()),
  featured: v.optional(v.boolean()),
  available: v.optional(v.boolean()),
  stock: v.optional(v.number()),
  inventoryMode: v.optional(inventoryModeSchema),
  masterStockQuantity: v.optional(v.number()),
  masterStockUnit: v.optional(v.string()),
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
  brand: v.optional(v.array(v.string())),
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
  tier: v.optional(v.string()),
  eligibleForRewards: v.optional(v.boolean()), // Whether this product is eligible for rewards points
  eligibleForDeals: v.optional(v.boolean()), // Whether this product is eligible for rewards points
  onSale: v.optional(v.boolean()),
  salePriceByDenomination: v.optional(v.record(v.string(), v.number())),
  eligibleDenominationForDeals: v.optional(v.array(v.number())),
  eligibleForUpgrade: v.optional(v.boolean()),
  upgradePrice: v.optional(v.number()),
  dealType: v.optional(
    v.union(v.literal('withinTier'), v.literal('acrossTiers')),
  ),
  productType: v.optional(v.string()),
  strainType: v.optional(strainTypeSchema),
  netWeight: v.optional(v.number()),
  netWeightUnit: v.optional(v.string()),
  subcategory: v.optional(v.string()),
  batchId: v.optional(v.string()),
  archived: v.optional(v.boolean()),
  highMargins: v.optional(v.array(v.string())),
  brandCollaborators: v.optional(v.array(v.string())),
  tags: v.optional(v.array(v.string())),
  packagingMode: v.optional(v.union(v.literal('bulk'), v.literal('prepack'))),
  startingWeight: v.optional(v.number()),
  remainingWeight: v.optional(v.number()),
  stockUnit: v.optional(v.string()),
  packSize: v.optional(v.number()),
  lowStockThreshold: v.optional(v.number()),
  lowStockAlertActive: v.optional(v.boolean()),
  lowStockAlertTriggeredAt: v.optional(v.number()),
  lowStockAlertLastSentAt: v.optional(v.number()),
  lowStockAlertLastNotifiedStock: v.optional(v.number()),
  lowStockAlertLastError: v.optional(v.string()),
  lowStockAlertLastMessageIds: v.optional(v.array(v.string())),
} as const

export const productSchema = v.object(productFields)

export const productCsvImportRowSchema = v.object({
  ...productFields,
  _id: v.optional(v.id('products')),
})

export type ProductType = Infer<typeof productSchema>
export type ProductCsvImportRowType = Infer<typeof productCsvImportRowSchema>
export type InventoryMode = Infer<typeof inventoryModeSchema>
export type StrainType = Infer<typeof strainTypeSchema>

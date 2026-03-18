import {Infer, v} from 'convex/values'

/** Single variation of a deal (e.g. "8 x ⅛ oz" or "4 x ¼ oz") */
export const dealVariationSchema = v.object({
  categorySlug: v.optional(v.string()),
  totalUnits: v.number(),
  denominationPerUnit: v.number(),
  denominationLabel: v.optional(v.string()),
  unitLabel: v.string(),
})

/** Deal document stored in Convex. Maps to BundleConfig in the store. */
export const dealSchema = v.object({
  id: v.string(),
  title: v.string(),
  description: v.string(),
  categorySlugs: v.array(v.string()),
  excludedTiers: v.optional(v.array(v.string())),
  excludedSubcategories: v.optional(v.array(v.string())),
  excludedProductTypes: v.optional(v.array(v.string())),
  excludedBases: v.optional(v.array(v.string())),
  excludedBrands: v.optional(v.array(v.string())),
  variations: v.array(dealVariationSchema),
  defaultVariationIndex: v.optional(v.number()),
  maxPerStrain: v.number(),
  lowStockThreshold: v.optional(v.number()),
  order: v.number(),
  enabled: v.boolean(),
  updatedAt: v.number(),
  updatedBy: v.optional(v.string()),
})

export type DealVariation = Infer<typeof dealVariationSchema>
export type Deal = Infer<typeof dealSchema>

export const dealVariationValidator = dealVariationSchema
export const dealValidator = dealSchema

import {Infer, v} from 'convex/values'

/** Attribute value with display name and URL/query-friendly slug (auto-generated from name, editable). */
export const attributeEntrySchema = v.object({
  name: v.string(),
  slug: v.string(),
})

export type AttributeEntry = Infer<typeof attributeEntrySchema>

export const categorySchema = {
  name: v.string(),
  order: v.optional(v.number()),
  slug: v.optional(v.string()),
  description: v.optional(v.string()),
  heroImage: v.optional(v.id('_storage')),
  highlight: v.optional(v.string()),
  benefits: v.optional(v.array(v.string())),
  productType: v.optional(v.any()),
  strainTypes: v.optional(v.array(attributeEntrySchema)),
  subcategories: v.optional(v.array(attributeEntrySchema)),
  denominations: v.optional(v.array(v.number())),
  units: v.optional(v.array(v.string())),
  visible: v.optional(v.boolean()),
  /** Tier options for this category (e.g. B, A, AA for flower; Distillate, Live Resin for vape). */
  tiers: v.optional(v.array(attributeEntrySchema)),
  /** Allowed base options for products in this category. */
  bases: v.optional(v.array(attributeEntrySchema)),
  /** Allowed brand options for products in this category. */
  brands: v.optional(v.array(attributeEntrySchema)),
}
export const category = v.object({
  ...categorySchema,
  _id: v.id('categories'),
  _creationTime: v.number(),
})
export type CategoryType = Infer<typeof category>

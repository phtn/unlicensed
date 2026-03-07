import {v} from 'convex/values'
import {mutation} from '../_generated/server'
import {dealVariationSchema} from './d'

export const create = mutation({
  args: {
    deal: v.object({
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
    }),
    updatedBy: v.optional(v.string()),
  },
  handler: async (ctx, {deal, updatedBy}) => {
    const existing = await ctx.db
      .query('deals')
      .withIndex('by_deal_slug', (q) => q.eq('id', deal.id))
      .unique()
    if (existing) throw new Error(`Deal with id "${deal.id}" already exists`)
    const now = Date.now()
    await ctx.db.insert('deals', {
      ...deal,
      updatedAt: now,
      updatedBy,
    })
    return {success: true}
  },
})

export const update = mutation({
  args: {
    id: v.string(),
    patch: v.object({
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      categorySlugs: v.optional(v.array(v.string())),
      excludedTiers: v.optional(v.array(v.string())),
      excludedSubcategories: v.optional(v.array(v.string())),
      excludedProductTypes: v.optional(v.array(v.string())),
      excludedBases: v.optional(v.array(v.string())),
      excludedBrands: v.optional(v.array(v.string())),
      variations: v.optional(v.array(dealVariationSchema)),
      defaultVariationIndex: v.optional(v.number()),
      maxPerStrain: v.optional(v.number()),
      lowStockThreshold: v.optional(v.number()),
      order: v.optional(v.number()),
      enabled: v.optional(v.boolean()),
    }),
    updatedBy: v.optional(v.string()),
  },
  handler: async (ctx, {id, patch, updatedBy}) => {
    const doc = await ctx.db
      .query('deals')
      .withIndex('by_deal_slug', (q) => q.eq('id', id))
      .unique()
    if (!doc) throw new Error(`Deal "${id}" not found`)
    const now = Date.now()
    await ctx.db.patch(doc._id, {
      ...patch,
      updatedAt: now,
      updatedBy,
    })
    return {success: true}
  },
})

export const remove = mutation({
  args: {id: v.string()},
  handler: async (ctx, {id}) => {
    const doc = await ctx.db
      .query('deals')
      .withIndex('by_deal_slug', (q) => q.eq('id', id))
      .unique()
    if (!doc) throw new Error(`Deal "${id}" not found`)
    await ctx.db.delete(doc._id)
    return {success: true}
  },
})

export const reorder = mutation({
  args: {
    orderedIds: v.array(v.string()),
    updatedBy: v.optional(v.string()),
  },
  handler: async (ctx, {orderedIds, updatedBy}) => {
    const now = Date.now()
    for (let i = 0; i < orderedIds.length; i++) {
      const doc = await ctx.db
        .query('deals')
        .withIndex('by_deal_slug', (q) => q.eq('id', orderedIds[i]))
        .unique()
      if (doc)
        await ctx.db.patch(doc._id, {order: i, updatedAt: now, updatedBy})
    }
    return {success: true}
  },
})

/** Seed default deals (idempotent: only runs if no deals exist). */
export const seedDefaults = mutation({
  args: {updatedBy: v.optional(v.string())},
  handler: async (ctx, {updatedBy}) => {
    const existing = await ctx.db.query('deals').first()
    if (existing) return {success: true, message: 'Deals already exist'}

    const defaults = [
      {
        id: 'build-your-own-oz',
        title: 'Build Your Own Oz',
        description:
          'Select 8 of ⅛ oz (3.5g) or 4 of ¼ oz (7g) — mix strains your way',
        categorySlugs: ['flower'],
        excludedTiers: [],
        excludedSubcategories: [],
        excludedProductTypes: [],
        excludedBases: [],
        excludedBrands: [],
        variations: [
          {
            totalUnits: 8,
            denominationPerUnit: 0.125,
            denominationLabel: '⅛',
            unitLabel: 'oz',
          },
          {
            totalUnits: 4,
            denominationPerUnit: 0.25,
            denominationLabel: '¼',
            unitLabel: 'oz',
          },
        ],
        defaultVariationIndex: 0,
        maxPerStrain: 2,
        lowStockThreshold: 3,
        order: 0,
        enabled: true,
      },
      {
        id: 'mix-match-4oz',
        title: 'Mix & Match 4 Oz',
        description: 'Pick up to 4 oz, 1 oz max per strain',
        categorySlugs: ['flower'],
        excludedTiers: [],
        excludedSubcategories: [],
        excludedProductTypes: [],
        excludedBases: [],
        excludedBrands: [],
        variations: [
          {
            totalUnits: 4,
            denominationPerUnit: 1,
            denominationLabel: '1',
            unitLabel: 'oz',
          },
        ],
        maxPerStrain: 1,
        order: 1,
        enabled: true,
      },
      {
        id: 'extracts-3g',
        title: '3 x 1g Mix & Match',
        description: 'Pick 3 extracts, 1g each',
        categorySlugs: ['extracts'],
        excludedTiers: [],
        excludedSubcategories: [],
        excludedProductTypes: [],
        excludedBases: [],
        excludedBrands: [],
        variations: [{totalUnits: 3, denominationPerUnit: 1, unitLabel: 'g'}],
        maxPerStrain: 1,
        order: 2,
        enabled: true,
      },
      {
        id: 'extracts-7g',
        title: '7 x 1g Mix & Match',
        description: 'Pick 7 extracts, 1g each',
        categorySlugs: ['extracts'],
        excludedTiers: [],
        excludedSubcategories: [],
        excludedProductTypes: [],
        excludedBases: [],
        excludedBrands: [],
        variations: [{totalUnits: 7, denominationPerUnit: 1, unitLabel: 'g'}],
        maxPerStrain: 1,
        order: 3,
        enabled: true,
      },
      {
        id: 'edibles-prerolls-5',
        title: '5 x 1 Unit Mix & Match',
        description: 'Pick 5 edibles or pre-rolls',
        categorySlugs: ['edibles', 'pre-rolls'],
        excludedTiers: [],
        excludedSubcategories: [],
        excludedProductTypes: [],
        excludedBases: [],
        excludedBrands: [],
        variations: [
          {totalUnits: 5, denominationPerUnit: 1, unitLabel: 'unit'},
        ],
        maxPerStrain: 1,
        order: 4,
        enabled: true,
      },
      {
        id: 'edibles-prerolls-10',
        title: '10 x 1 Unit Mix & Match',
        description: 'Pick 10 edibles or pre-rolls',
        categorySlugs: ['edibles', 'pre-rolls'],
        excludedTiers: [],
        excludedSubcategories: [],
        excludedProductTypes: [],
        excludedBases: [],
        excludedBrands: [],
        variations: [
          {totalUnits: 10, denominationPerUnit: 1, unitLabel: 'unit'},
        ],
        maxPerStrain: 1,
        order: 5,
        enabled: true,
      },
    ]

    const now = Date.now()
    for (const d of defaults) {
      await ctx.db.insert('deals', {
        ...d,
        updatedAt: now,
        updatedBy,
      })
    }
    return {success: true, message: 'Seeded default deals'}
  },
})

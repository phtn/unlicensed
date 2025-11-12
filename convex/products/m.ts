import {mutation} from '../_generated/server'
import {v} from 'convex/values'
import {ensureSlug} from '../../lib/slug'

export const createProduct = mutation({
  args: {
    name: v.string(),
    slug: v.optional(v.string()),
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
    potencyLevel: v.union(
      v.literal('mild'),
      v.literal('medium'),
      v.literal('high'),
    ),
    potencyProfile: v.optional(v.string()),
    weightGrams: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const slug = ensureSlug(args.slug ?? '', args.name)

    const existing = await ctx.db
      .query('products')
      .withIndex('by_slug', (q) => q.eq('slug', slug))
      .unique()

    if (existing) {
      throw new Error(`Product with slug "${slug}" already exists.`)
    }

    const category = await ctx.db
      .query('categories')
      .withIndex('by_slug', (q) => q.eq('slug', args.categorySlug))
      .unique()

    if (!category) {
      throw new Error(`Category "${args.categorySlug}" not found.`)
    }

    const sanitizeArray = (values: string[]) =>
      values
        .map((value) => value.trim())
        .filter((value) => value.length > 0)

    const numericArray = (values?: number[]) =>
      values?.filter((value) => Number.isFinite(value)) ?? undefined

    const productId = await ctx.db.insert('products', {
      name: args.name.trim(),
      slug,
      categoryId: category._id,
      categorySlug: category.slug,
      shortDescription: args.shortDescription.trim(),
      description: args.description.trim(),
      priceCents: args.priceCents,
      unit: args.unit.trim(),
      availableDenominations: numericArray(args.availableDenominations ?? undefined),
      popularDenomination: args.popularDenomination ?? undefined,
      thcPercentage: args.thcPercentage,
      cbdPercentage: args.cbdPercentage ?? undefined,
      effects: sanitizeArray(args.effects),
      terpenes: sanitizeArray(args.terpenes),
      featured: args.featured,
      available: args.available,
      stock: args.stock,
      rating: args.rating,
      image: args.image,
      gallery: args.gallery.filter((value) => value.trim().length > 0),
      consumption: args.consumption.trim(),
      flavorNotes: sanitizeArray(args.flavorNotes),
      potencyLevel: args.potencyLevel,
      potencyProfile: args.potencyProfile?.trim() || undefined,
      weightGrams: args.weightGrams ?? undefined,
    })

    return productId
  },
})


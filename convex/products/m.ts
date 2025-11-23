import {v} from 'convex/values'
import {ensureSlug} from '../../lib/slug'
import {internal} from '../_generated/api'
import {mutation} from '../_generated/server'

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
      values.map((value) => value.trim()).filter((value) => value.length > 0)

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
      availableDenominations: numericArray(
        args.availableDenominations ?? undefined,
      ),
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

    // Log product created activity
    await ctx.scheduler.runAfter(0, internal.activities.m.logProductActivity, {
      type: 'product_created',
      productId,
      productName: args.name.trim(),
      productSlug: slug,
    })

    return productId
  },
})

export const updateProduct = mutation({
  args: {
    productId: v.id('products'),
    name: v.optional(v.string()),
    priceCents: v.optional(v.number()),
    stock: v.optional(v.number()),
    available: v.optional(v.boolean()),
    featured: v.optional(v.boolean()),
    unit: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId)
    if (!product) {
      throw new Error(`Product with id "${args.productId}" not found.`)
    }

    const updates: Partial<typeof product> = {}
    if (args.name !== undefined) {
      updates.name = args.name.trim()
    }
    if (args.priceCents !== undefined) {
      updates.priceCents = args.priceCents
    }
    if (args.stock !== undefined) {
      updates.stock = args.stock
    }
    if (args.available !== undefined) {
      updates.available = args.available
    }
    if (args.featured !== undefined) {
      updates.featured = args.featured
    }
    if (args.unit !== undefined) {
      updates.unit = args.unit.trim()
    }

    await ctx.db.patch(args.productId, updates)
    return {success: true}
  },
})

export const purgeTestProducts = mutation({
  handler: async ({db}) => {
    const allItems = await db.query('products').collect()
    const itemsToDelete = allItems.filter((item) =>
      item.categorySlug.startsWith('test'),
    )
    for (const item of itemsToDelete) {
      await db.delete(item._id)
    }
    return itemsToDelete.length
  },
})

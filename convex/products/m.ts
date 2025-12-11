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
    variants: v.optional(
      v.array(
        v.object({
          label: v.string(),
          price: v.number(),
        }),
      ),
    ),
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
      variants: args.variants,
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
    slug: v.optional(v.string()),
    categorySlug: v.optional(v.string()),
    shortDescription: v.optional(v.string()),
    description: v.optional(v.string()),
    priceCents: v.optional(v.number()),
    unit: v.optional(v.string()),
    availableDenominations: v.optional(v.array(v.number())),
    popularDenomination: v.optional(v.number()),
    thcPercentage: v.optional(v.number()),
    cbdPercentage: v.optional(v.number()),
    effects: v.optional(v.array(v.string())),
    terpenes: v.optional(v.array(v.string())),
    featured: v.optional(v.boolean()),
    available: v.optional(v.boolean()),
    stock: v.optional(v.number()),
    rating: v.optional(v.number()),
    image: v.optional(v.string()),
    gallery: v.optional(v.array(v.string())),
    consumption: v.optional(v.string()),
    flavorNotes: v.optional(v.array(v.string())),
    potencyLevel: v.optional(
      v.union(v.literal('mild'), v.literal('medium'), v.literal('high')),
    ),
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
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId)
    if (!product) {
      throw new Error(`Product with id "${args.productId}" not found.`)
    }

    const sanitizeArray = (values?: string[]) =>
      values
        ? values.map((value) => value.trim()).filter((value) => value.length > 0)
        : undefined

    const numericArray = (values?: number[]) =>
      values?.filter((value) => Number.isFinite(value)) ?? undefined

    const updates: Partial<typeof product> = {}
    if (args.name !== undefined) {
      updates.name = args.name.trim()
    }
    if (args.slug !== undefined) {
      const newSlug = ensureSlug(args.slug, args.name ?? product.name)
      // Check if slug is being changed and if it conflicts with another product
      if (newSlug !== product.slug) {
        const existing = await ctx.db
          .query('products')
          .withIndex('by_slug', (q) => q.eq('slug', newSlug))
          .unique()
        if (existing && existing._id !== args.productId) {
          throw new Error(`Product with slug "${newSlug}" already exists.`)
        }
      }
      updates.slug = newSlug
    }
    if (args.categorySlug !== undefined) {
      const category = await ctx.db
        .query('categories')
        .withIndex('by_slug', (q) => q.eq('slug', args.categorySlug!))
        .unique()
      if (!category) {
        throw new Error(`Category "${args.categorySlug}" not found.`)
      }
      updates.categoryId = category._id
      updates.categorySlug = category.slug
    }
    if (args.shortDescription !== undefined) {
      updates.shortDescription = args.shortDescription.trim()
    }
    if (args.description !== undefined) {
      updates.description = args.description.trim()
    }
    if (args.priceCents !== undefined) {
      updates.priceCents = args.priceCents
    }
    if (args.unit !== undefined) {
      updates.unit = args.unit.trim()
    }
    if (args.availableDenominations !== undefined) {
      updates.availableDenominations = numericArray(args.availableDenominations)
    }
    if (args.popularDenomination !== undefined) {
      updates.popularDenomination = args.popularDenomination
    }
    if (args.thcPercentage !== undefined) {
      updates.thcPercentage = args.thcPercentage
    }
    if (args.cbdPercentage !== undefined) {
      updates.cbdPercentage = args.cbdPercentage
    }
    if (args.effects !== undefined) {
      updates.effects = sanitizeArray(args.effects) ?? []
    }
    if (args.terpenes !== undefined) {
      updates.terpenes = sanitizeArray(args.terpenes) ?? []
    }
    if (args.featured !== undefined) {
      updates.featured = args.featured
    }
    if (args.available !== undefined) {
      updates.available = args.available
    }
    if (args.stock !== undefined) {
      updates.stock = args.stock
    }
    if (args.rating !== undefined) {
      updates.rating = args.rating
    }
    if (args.image !== undefined) {
      updates.image = args.image
    }
    if (args.gallery !== undefined) {
      updates.gallery = args.gallery.filter((value) => value.trim().length > 0)
    }
    if (args.consumption !== undefined) {
      updates.consumption = args.consumption.trim()
    }
    if (args.flavorNotes !== undefined) {
      updates.flavorNotes = sanitizeArray(args.flavorNotes) ?? []
    }
    if (args.potencyLevel !== undefined) {
      updates.potencyLevel = args.potencyLevel
    }
    if (args.potencyProfile !== undefined) {
      updates.potencyProfile = args.potencyProfile.trim() || undefined
    }
    if (args.weightGrams !== undefined) {
      updates.weightGrams = args.weightGrams
    }
    if (args.variants !== undefined) {
      updates.variants = args.variants
    }

    await ctx.db.patch(args.productId, updates)
    return {success: true}
  },
})

export const bulkUpdatePrices = mutation({
  args: {
    productIds: v.array(v.id('products')),
    priceCents: v.number(),
  },
  handler: async (ctx, args) => {
    const results = []
    for (const productId of args.productIds) {
      const product = await ctx.db.get(productId)
      if (product) {
        await ctx.db.patch(productId, {
          priceCents: args.priceCents,
        })
        results.push({productId, success: true})
      } else {
        results.push({productId, success: false, error: 'Product not found'})
      }
    }
    return {updated: results.filter((r) => r.success).length, results}
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

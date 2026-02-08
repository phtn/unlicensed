import {v} from 'convex/values'
import {ensureSlug} from '../../lib/slug'
import {internal} from '../_generated/api'
import {mutation} from '../_generated/server'
import {productSchema} from './d'

export const createProduct = mutation({
  args: productSchema,
  handler: async (ctx, args) => {
    if (!args.name) {
      throw new Error('Product name is required')
    }
    const slug = ensureSlug(args.slug ?? '', args.name)

    const existing = await ctx.db
      .query('products')
      .withIndex('by_slug', (q) => q.eq('slug', slug))
      .unique()

    if (existing) {
      throw new Error(`Product with slug "${slug}" already exists.`)
    }

    if (!args.categorySlug) {
      throw new Error('Category slug is required')
    }

    const category = await ctx.db
      .query('categories')
      .withIndex('by_slug', (q) => q.eq('slug', args.categorySlug!))
      .unique()

    if (!category) {
      throw new Error(`Category "${args.categorySlug}" not found.`)
    }

    const sanitizeArray = (values: Array<string> | undefined) =>
      values &&
      values.map((value) => value.trim()).filter((value) => value.length > 0)

    const numericArray = (values?: Array<number>) =>
      values?.filter((value) => Number.isFinite(value)) ?? undefined

    const productId = await ctx.db.insert('products', {
      name: args.name ?? '',
      slug,
      categoryId: category._id,
      categorySlug: category.slug ?? '',
      shortDescription: args.shortDescription,
      description: args.description,
      priceCents: args.priceCents,
      unit: args.unit,
      availableDenominations: numericArray(args.availableDenominations),
      popularDenomination: args.popularDenomination,
      thcPercentage: args.thcPercentage,
      cbdPercentage: args.cbdPercentage,
      effects: sanitizeArray(args.effects),
      terpenes: sanitizeArray(args.terpenes),
      featured: args.featured,
      available: args.available,
      stock: args.stock,
      stockByDenomination: args.stockByDenomination,
      rating: args.rating,
      image: args.image,
      gallery: args.gallery,
      consumption: args.consumption,
      flavorNotes: sanitizeArray(args.flavorNotes),
      potencyLevel: args.potencyLevel,
      potencyProfile: args.potencyProfile,
      lineage: args.lineage,
      noseRating: args.noseRating,
      weightGrams: args.weightGrams,
      variants: args.variants,
      priceByDenomination: args.priceByDenomination,
      eligibleForRewards: args.eligibleForRewards,
      eligibleForDeals: args.eligibleForDeals,
      onSale: args.onSale,
      tier: args.tier,
      eligibleForUpgrade: args.eligibleForUpgrade,
      upgradePrice: args.upgradePrice,
    })

    // Log product created activity
    await ctx.scheduler.runAfter(0, internal.activities.m.logProductActivity, {
      type: 'product_created',
      productId,
      productName: args.name?.trim() ?? '',
      productSlug: slug,
    })

    return productId
  },
})

export const updateProduct = mutation({
  args: {
    fields: productSchema,
    id: v.id('products'),
  },
  handler: async (ctx, {id, fields}) => {
    const product = await ctx.db.get(id)
    if (!product) {
      throw new Error(`Product with id "${id}" not found.`)
    }

    const sanitizeArray = (values?: string[]) =>
      values
        ? values
            .map((value) => value.trim())
            .filter((value) => value.length > 0)
        : undefined

    const numericArray = (values?: number[]) =>
      values?.filter((value) => Number.isFinite(value)) ?? undefined

    const updates: Partial<typeof product> = {}
    if (fields.name !== undefined) {
      updates.name = fields.name.trim()
    }
    if (fields.slug !== undefined) {
      const newSlug = ensureSlug(fields.slug, fields.name ?? product.name ?? '')
      // Check if slug is being changed and if it conflicts with another product
      if (newSlug !== product.slug) {
        const existing = await ctx.db
          .query('products')
          .withIndex('by_slug', (q) => q.eq('slug', newSlug))
          .unique()
        if (existing && existing._id !== id) {
          throw new Error(`Product with slug "${newSlug}" already exists.`)
        }
      }
      updates.slug = newSlug
    }
    if (fields.categorySlug !== undefined) {
      const category = await ctx.db
        .query('categories')
        .withIndex('by_slug', (q) => q.eq('slug', fields.categorySlug!))
        .unique()
      if (!category) {
        throw new Error(`Category "${fields.categorySlug}" not found.`)
      }
      updates.categoryId = category._id
      updates.categorySlug = category.slug ?? ''
    }
    if (fields.shortDescription !== undefined) {
      updates.shortDescription = fields.shortDescription.trim()
    }
    if (fields.description !== undefined) {
      updates.description = fields.description.trim()
    }
    if (fields.priceCents !== undefined) {
      updates.priceCents = fields.priceCents
    }
    if (fields.unit !== undefined) {
      updates.unit = fields.unit.trim()
    }
    if (fields.availableDenominations !== undefined) {
      updates.availableDenominations = numericArray(
        fields.availableDenominations,
      )
    }
    if (fields.popularDenomination !== undefined) {
      updates.popularDenomination = fields.popularDenomination
    }
    if (fields.thcPercentage !== undefined) {
      updates.thcPercentage = fields.thcPercentage
    }
    if (fields.cbdPercentage !== undefined) {
      updates.cbdPercentage = fields.cbdPercentage
    }
    if (fields.effects !== undefined) {
      updates.effects = sanitizeArray(fields.effects) ?? []
    }
    if (fields.terpenes !== undefined) {
      updates.terpenes = sanitizeArray(fields.terpenes) ?? []
    }
    if (fields.featured !== undefined) {
      updates.featured = fields.featured
    }
    if (fields.available !== undefined) {
      updates.available = fields.available
    }
    if (fields.stock !== undefined) {
      updates.stock = fields.stock
    }
    if (fields.stockByDenomination !== undefined) {
      updates.stockByDenomination = fields.stockByDenomination
    }
    if (fields.rating !== undefined) {
      updates.rating = fields.rating
    }
    if (fields.image !== undefined) {
      updates.image = fields.image
    }
    if (fields.gallery !== undefined) {
      // Filter out empty strings, but keep storage IDs
      updates.gallery = fields.gallery.filter((value) => {
        if (typeof value === 'string') {
          return value.trim().length > 0
        }
        // Storage IDs are valid
        return true
      })
    }
    if (fields.consumption !== undefined) {
      updates.consumption = fields.consumption.trim()
    }
    if (fields.flavorNotes !== undefined) {
      updates.flavorNotes = sanitizeArray(fields.flavorNotes) ?? []
    }
    if (fields.potencyLevel !== undefined) {
      updates.potencyLevel = fields.potencyLevel
    }
    if (fields.potencyProfile !== undefined) {
      updates.potencyProfile = fields.potencyProfile.trim() || undefined
    }
    if (fields.weightGrams !== undefined) {
      updates.weightGrams = fields.weightGrams
    }
    if (fields.lineage !== undefined) {
      updates.lineage = fields.lineage.trim() || undefined
    }
    if (fields.noseRating !== undefined) {
      updates.noseRating = fields.noseRating
    }
    if (fields.variants !== undefined) {
      updates.variants = fields.variants
    }
    if (fields.priceByDenomination !== undefined) {
      updates.priceByDenomination = fields.priceByDenomination
    }
    if (fields.tier !== undefined) {
      updates.tier = fields.tier
    }
    if (fields.eligibleForDeals !== undefined) {
      updates.eligibleForDeals = fields.eligibleForDeals
    }
    if (fields.onSale !== undefined) {
      updates.onSale = fields.onSale
    }
    if (fields.eligibleForUpgrade !== undefined) {
      updates.eligibleForUpgrade = fields.eligibleForUpgrade
    }
    if (fields.upgradePrice !== undefined) {
      updates.upgradePrice = fields.upgradePrice
    }

    await ctx.db.patch(id, updates)
    return {success: true}
  },
})

export const toggleAvailability = mutation({
  args: {
    productId: v.id('products'),
    available: v.boolean(),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId)
    if (!product) {
      return {success: false, error: 'Product not found'}
    }
    await ctx.db.patch(args.productId, {
      available: args.available,
    })
    return {success: true}
  },
})
export const toggleDeals = mutation({
  args: {
    productId: v.id('products'),
    deals: v.boolean(),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId)
    if (!product) {
      return {success: false, error: 'Product not found'}
    }
    await ctx.db.patch(args.productId, {
      eligibleForDeals: args.deals,
    })
    return {success: true}
  },
})
export const toggleFeatured = mutation({
  args: {
    productId: v.id('products'),
    featured: v.boolean(),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId)
    if (!product) {
      return {success: false, error: 'Product not found'}
    }
    await ctx.db.patch(args.productId, {
      featured: args.featured,
    })
    return {success: true}
  },
})
export const toggleRewardEligibility = mutation({
  args: {
    productId: v.id('products'),
    eligibleForRewards: v.boolean(),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId)
    if (!product) {
      return {success: false, error: 'Product not found'}
    }
    await ctx.db.patch(args.productId, {
      eligibleForRewards: args.eligibleForRewards,
    })
    return {success: true}
  },
})
export const toggleOnSale = mutation({
  args: {
    productId: v.id('products'),
    onSale: v.boolean(),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId)
    if (!product) {
      return {success: false, error: 'Product not found'}
    }
    await ctx.db.patch(args.productId, {
      onSale: args.onSale,
    })
    return {success: true}
  },
})
export const toggleUpgradeEligibility = mutation({
  args: {
    productId: v.id('products'),
    eligibleForUpgrade: v.boolean(),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId)
    if (!product) {
      return {success: false, error: 'Product not found'}
    }
    await ctx.db.patch(args.productId, {
      eligibleForUpgrade: args.eligibleForUpgrade,
    })
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

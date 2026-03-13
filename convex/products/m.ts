import {v} from 'convex/values'
import {ensureSlug} from '../../lib/slug'
import {internal} from '../_generated/api'
import type {Id} from '../_generated/dataModel'
import {mutation, MutationCtx} from '../_generated/server'
import {productSchema, type ProductType} from './d'

const FLOWER_TIERS = new Set(['B', 'A', 'AA', 'AAA', 'AAAA', 'RARE'])
const EXTRACT_TIERS = new Set([
  'Cured Resin',
  'Fresh Frozen',
  'Live Resin',
  'Full Melt',
  'Half Melt',
])
const VAPE_TIERS = new Set([
  'Distillate',
  'Live Resin',
  'Cured Resin',
  'Liquid Diamonds',
  'Sauce',
  'Live Rosin',
  'Cured Rosin',
])
const EXTRACT_AND_EDIBLE_BASES = new Set([
  'Distillate',
  'Hydrocarbon (BHO)',
  'CO2',
  'Rosin',
  'Hash',
])
const PRE_ROLL_BASES = new Set(['Flower', 'Infused'])

type AttributeEntry = {name: string; slug: string}

function allowedSetFromAttributeEntries(
  entries: AttributeEntry[] | undefined,
): Set<string> | null {
  if (!entries?.length) return null
  const set = new Set<string>()
  for (const e of entries) {
    const n = e.name?.trim()
    const s = e.slug?.trim()
    if (n) set.add(n)
    if (s) set.add(s)
  }
  return set.size > 0 ? set : null
}

const categoryContains = (
  categorySlug: string,
  candidates: readonly string[],
) => candidates.some((candidate) => categorySlug.includes(candidate))

const getAllowedTierSetForCategory = (categorySlug?: string) => {
  const normalized = categorySlug?.toLowerCase().trim() ?? ''

  if (categoryContains(normalized, ['extract', 'concentrate'])) {
    return EXTRACT_TIERS
  }

  if (categoryContains(normalized, ['vape', 'cart', 'cartridge'])) {
    return VAPE_TIERS
  }

  return FLOWER_TIERS
}

const getAllowedBaseSetForCategory = (categorySlug?: string) => {
  const normalized = categorySlug?.toLowerCase().trim() ?? ''

  if (categoryContains(normalized, ['extract', 'concentrate', 'edible'])) {
    return EXTRACT_AND_EDIBLE_BASES
  }

  if (categoryContains(normalized, ['pre-roll', 'preroll', 'pre roll'])) {
    return PRE_ROLL_BASES
  }

  return null
}

const validateTierForCategory = (
  tier: string | undefined,
  categorySlug?: string,
  categoryTiers?: AttributeEntry[],
) => {
  if (!tier) {
    return
  }

  const fromEntries = allowedSetFromAttributeEntries(categoryTiers)
  const allowedTierSet =
    fromEntries ?? getAllowedTierSetForCategory(categorySlug)
  if (allowedTierSet.has(tier.trim())) {
    return
  }

  const allowedTiers = Array.from(allowedTierSet).join(', ')
  throw new Error(
    `Tier "${tier}" is invalid for category "${categorySlug ?? 'unknown'}". Allowed tiers: ${allowedTiers}.`,
  )
}

/** If categoryBases is non-empty, use it; else derive from slug. */
const getAllowedBaseSetForCategoryWithOverrides = (
  categorySlug?: string,
  categoryBases?: AttributeEntry[],
): Set<string> | null => {
  const fromEntries = allowedSetFromAttributeEntries(categoryBases)
  if (fromEntries) return fromEntries
  return getAllowedBaseSetForCategory(categorySlug)
}

const validateBaseForCategory = (
  base: string | undefined,
  categorySlug?: string,
  categoryBases?: AttributeEntry[],
) => {
  if (!base) {
    return
  }

  const allowedBaseSet = getAllowedBaseSetForCategoryWithOverrides(
    categorySlug,
    categoryBases,
  )
  if (!allowedBaseSet) {
    return
  }

  if (allowedBaseSet.has(base.trim())) {
    return
  }

  const allowedBases = Array.from(allowedBaseSet).join(', ')
  throw new Error(
    `Base "${base}" is invalid for category "${categorySlug ?? 'unknown'}". Allowed base values: ${allowedBases}.`,
  )
}

const validateBrandForCategory = (
  brands: string[] | undefined,
  categoryBrands?: AttributeEntry[],
) => {
  if (!brands || brands.length === 0) {
    return
  }
  if (!categoryBrands || categoryBrands.length === 0) {
    return
  }
  const allowed = allowedSetFromAttributeEntries(categoryBrands)
  if (!allowed) return
  for (const brand of brands) {
    if (!allowed.has(brand.trim())) {
      const allowedBrands = Array.from(allowed).join(', ')
      throw new Error(
        `Brand "${brand}" is invalid. Allowed brands for this category: ${allowedBrands}.`,
      )
    }
  }
}

const sanitizeArray = (values: Array<string> | undefined) =>
  values &&
  values.map((value) => value.trim()).filter((value) => value.length > 0)

const numericArray = (values?: Array<number>) =>
  values?.filter((value) => Number.isFinite(value)) ?? undefined

const ARCHIVED_SLUG_SUFFIX_PATTERN = /--archived-\d+(?:-\d+)?$/

async function buildArchivedSlug(
  ctx: MutationCtx,
  productId: Id<'products'>,
  slug: string | undefined,
  name: string | undefined,
): Promise<string> {
  const baseSlug = (slug ?? '').trim() || ensureSlug('', name ?? 'product')
  const normalizedBaseSlug = baseSlug.replace(ARCHIVED_SLUG_SUFFIX_PATTERN, '')
  const timestamp = Date.now()

  for (let attempt = 0; attempt < 100; attempt++) {
    const archivedSlug =
      attempt === 0
        ? `${normalizedBaseSlug}--archived-${timestamp}`
        : `${normalizedBaseSlug}--archived-${timestamp}-${attempt}`

    const existing = await ctx.db
      .query('products')
      .withIndex('by_slug', (q) => q.eq('slug', archivedSlug))
      .unique()

    if (!existing || existing._id === productId) {
      return archivedSlug
    }
  }

  throw new Error('Failed to generate a unique archived slug.')
}

async function buildProductInsertDoc(
  ctx: MutationCtx,
  args: ProductType,
): Promise<{slug: string; doc: Record<string, unknown>}> {
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

  const base = args.base?.trim() || undefined

  validateTierForCategory(
    args.tier,
    category.slug ?? args.categorySlug,
    category.tiers,
  )
  validateBaseForCategory(
    base,
    category.slug ?? args.categorySlug,
    category.bases,
  )
  validateBrandForCategory(sanitizeArray(args.brand), category.brands)

  const doc = {
    name: args.name ?? '',
    slug,
    base,
    categoryId: category._id,
    categorySlug: category.slug ?? '',
    shortDescription: args.shortDescription,
    description: args.description,
    priceCents: args.priceCents,
    batchId: args.batchId?.trim() || undefined,
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
    inventoryMode: args.inventoryMode,
    masterStockQuantity: args.masterStockQuantity,
    masterStockUnit: args.masterStockUnit?.trim() || undefined,
    stockByDenomination: args.stockByDenomination,
    rating: args.rating,
    image: args.image,
    gallery: args.gallery,
    consumption: args.consumption,
    flavorNotes: sanitizeArray(args.flavorNotes),
    potencyLevel: args.potencyLevel,
    potencyProfile: args.potencyProfile,
    lineage: args.lineage,
    brand: sanitizeArray(args.brand),
    subcategory: args.subcategory?.trim() || undefined,
    productType: args.productType?.trim() || undefined,
    noseRating: args.noseRating,
    weightGrams: args.weightGrams,
    netWeight: args.netWeight,
    netWeightUnit: args.netWeightUnit?.trim() || undefined,
    packagingMode: args.packagingMode,
    stockUnit: args.stockUnit?.trim() || undefined,
    startingWeight: args.startingWeight,
    remainingWeight: args.remainingWeight,
    variants: args.variants,
    priceByDenomination: args.priceByDenomination,
    eligibleForRewards: args.eligibleForRewards,
    eligibleForDeals: args.eligibleForDeals,
    onSale: args.onSale,
    tier: args.tier,
    eligibleForUpgrade: args.eligibleForUpgrade,
    upgradePrice: args.upgradePrice,
    archived: false,
  }
  return {slug, doc}
}

export const createProduct = mutation({
  args: productSchema,
  handler: async (ctx, args) => {
    const {slug, doc} = await buildProductInsertDoc(ctx, args)

    const productId = await ctx.db.insert('products', doc)

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
    let nextCategorySlug = product.categorySlug
    let categoryChanged = false

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
      nextCategorySlug = category.slug ?? ''
      updates.categoryId = category._id
      updates.categorySlug = nextCategorySlug
      categoryChanged = nextCategorySlug !== product.categorySlug
    }
    const nextBaseFromFields = fields.base?.trim() || undefined
    const baseChanged =
      fields.base !== undefined && nextBaseFromFields !== product.base
    if (fields.base !== undefined) {
      updates.base = nextBaseFromFields
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
    if (fields.batchId !== undefined) {
      updates.batchId = fields.batchId.trim() || undefined
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
    if (fields.inventoryMode !== undefined) {
      updates.inventoryMode = fields.inventoryMode
    }
    if (fields.masterStockQuantity !== undefined) {
      updates.masterStockQuantity = fields.masterStockQuantity
    }
    if (fields.masterStockUnit !== undefined) {
      updates.masterStockUnit = fields.masterStockUnit.trim() || undefined
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
    if (fields.netWeight !== undefined) {
      updates.netWeight = fields.netWeight
    }
    if (fields.netWeightUnit !== undefined) {
      updates.netWeightUnit = fields.netWeightUnit.trim() || undefined
    }
    if (fields.packagingMode !== undefined) {
      updates.packagingMode = fields.packagingMode
    }
    if (fields.stockUnit !== undefined) {
      updates.stockUnit = fields.stockUnit.trim() || undefined
    }
    if (fields.startingWeight !== undefined) {
      updates.startingWeight = fields.startingWeight
    }
    if (fields.remainingWeight !== undefined) {
      updates.remainingWeight = fields.remainingWeight
    }
    if (fields.lineage !== undefined) {
      updates.lineage = fields.lineage.trim() || undefined
    }
    if (fields.brand !== undefined && fields.brand !== null) {
      updates.brand = sanitizeArray(fields.brand)
    }
    if (fields.subcategory !== undefined) {
      updates.subcategory = fields.subcategory.trim() || undefined
    }
    if (fields.productType !== undefined) {
      updates.productType = fields.productType.trim() || undefined
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
    const tierChanged =
      fields.tier !== undefined && fields.tier !== product.tier
    if (fields.tier !== undefined) {
      updates.tier = fields.tier
    }

    if (
      categoryChanged &&
      fields.tier === undefined &&
      product.tier !== undefined
    ) {
      updates.tier = undefined
    }

    const categoryForValidation = nextCategorySlug
      ? await ctx.db
          .query('categories')
          .withIndex('by_slug', (q) => q.eq('slug', nextCategorySlug))
          .unique()
      : null

    if (tierChanged || categoryChanged) {
      const nextTier =
        fields.tier !== undefined
          ? fields.tier
          : categoryChanged
            ? undefined
            : product.tier
      validateTierForCategory(
        nextTier,
        nextCategorySlug,
        categoryForValidation?.tiers,
      )
    }
    if (
      categoryChanged &&
      fields.base === undefined &&
      product.base !== undefined
    ) {
      updates.base = undefined
    }

    if (baseChanged || categoryChanged) {
      const nextBase =
        fields.base !== undefined
          ? nextBaseFromFields
          : categoryChanged
            ? undefined
            : product.base
      validateBaseForCategory(
        nextBase,
        nextCategorySlug,
        categoryForValidation?.bases,
      )
    }
    if (fields.brand !== undefined && fields.brand !== null) {
      validateBrandForCategory(
        sanitizeArray(fields.brand),
        categoryForValidation?.brands,
      )
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
export const toggleLimited = mutation({
  args: {
    productId: v.id('products'),
    limited: v.boolean(),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId)
    if (!product) {
      return {success: false, error: 'Product not found'}
    }
    await ctx.db.patch(args.productId, {
      limited: args.limited,
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

export const archiveProduct = mutation({
  args: {
    productId: v.id('products'),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId)
    if (!product) return null

    const archivedSlug = await buildArchivedSlug(
      ctx,
      product._id,
      product.slug,
      product.name,
    )

    return await ctx.db.patch(product._id, {
      archived: true,
      slug: archivedSlug,
    })
  },
})

export const seedProductsFromCsv = mutation({
  args: {
    title: v.string(),
    uploadedBy: v.string(),
    products: v.array(productSchema),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    const importId = await ctx.db.insert('productImports', {
      title: args.title,
      uploadedBy: args.uploadedBy,
      createdAt: now,
      rowCount: args.products.length,
      successCount: 0,
      errorCount: 0,
    })

    let successCount = 0
    const errors: Array<{
      rowIndex: number
      slug?: string
      message: string
    }> = []

    for (let rowIndex = 0; rowIndex < args.products.length; rowIndex++) {
      const row = args.products[rowIndex]
      try {
        const {slug, doc} = await buildProductInsertDoc(ctx, row)
        const productId = await ctx.db.insert('products', doc)
        await ctx.scheduler.runAfter(
          0,
          internal.activities.m.logProductActivity,
          {
            type: 'product_created',
            productId,
            productName: row.name?.trim() ?? '',
            productSlug: slug,
          },
        )
        successCount++
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e)
        const slug =
          row?.name != null
            ? ensureSlug((row.slug as string) ?? '', String(row.name))
            : undefined
        errors.push({rowIndex, slug, message})
      }
    }

    const errorCount = errors.length
    await ctx.db.patch(importId, {
      successCount,
      errorCount,
      ...(errors.length > 0 ? {errors} : {}),
    })

    return {
      importId,
      successCount,
      errorCount,
      errors,
    }
  },
})

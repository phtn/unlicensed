import {v} from 'convex/values'
import {
  mergeDefinedCsvImportFields,
  sortProductCsvImportRowsForProcessing,
} from '../../lib/product-csv-import'
import {
  resolveAttributeSlug,
  resolveAttributeSlugs,
} from '../../lib/product-attribute-normalization'
import {ensureSlug} from '../../lib/slug'
import {internal} from '../_generated/api'
import type {Id} from '../_generated/dataModel'
import {mutation, MutationCtx} from '../_generated/server'
import {
  productCsvImportRowSchema,
  productSchema,
  type ProductCsvImportRowType,
  type ProductType,
} from './d'

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

const trimToUndefined = (value: string | undefined) => {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

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
  if (fromEntries?.has(tier.trim())) {
    return
  }

  if (
    fromEntries == null &&
    resolveAttributeSlug(
      tier,
      Array.from(getAllowedTierSetForCategory(categorySlug)),
    ) != null
  ) {
    return
  }

  const allowedTierSet = fromEntries ?? getAllowedTierSetForCategory(categorySlug)
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

  if (resolveAttributeSlug(base, Array.from(allowedBaseSet)) != null) {
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

const normalizeTierValue = (
  tier: string | undefined,
  categorySlug?: string,
  categoryTiers?: AttributeEntry[],
) =>
  resolveAttributeSlug(tier, categoryTiers) ??
  resolveAttributeSlug(tier, Array.from(getAllowedTierSetForCategory(categorySlug))) ??
  trimToUndefined(tier)

const normalizeBaseValue = (
  base: string | undefined,
  categorySlug?: string,
  categoryBases?: AttributeEntry[],
) => {
  const derivedAllowedBases = getAllowedBaseSetForCategory(categorySlug)
  return (
    resolveAttributeSlug(base, categoryBases) ??
    resolveAttributeSlug(
      base,
      derivedAllowedBases ? Array.from(derivedAllowedBases) : undefined,
    ) ??
    trimToUndefined(base)
  )
}

const normalizeCategoryAttributeValue = (
  value: string | undefined,
  entries?: AttributeEntry[],
) => resolveAttributeSlug(value, entries) ?? trimToUndefined(value)

const normalizeBrandsForCategory = (
  brands: string[] | undefined,
  categoryBrands?: AttributeEntry[],
) => {
  const sanitized = sanitizeArray(brands)
  return resolveAttributeSlugs(sanitized, categoryBrands) ?? sanitized
}

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

async function buildProductDoc(
  ctx: MutationCtx,
  args: ProductType,
  currentProductId?: Id<'products'>,
): Promise<{slug: string; doc: Record<string, unknown>}> {
  if (!args.name) {
    throw new Error('Product name is required')
  }
  const slug = ensureSlug(args.slug ?? '', args.name)

  const existing = await ctx.db
    .query('products')
    .withIndex('by_slug', (q) => q.eq('slug', slug))
    .unique()

  if (existing && existing._id !== currentProductId) {
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

  const categorySlugForNormalization = category.slug ?? args.categorySlug
  const tier = normalizeTierValue(
    args.tier,
    categorySlugForNormalization,
    category.tiers,
  )
  const base = normalizeBaseValue(
    args.base,
    categorySlugForNormalization,
    category.bases,
  )
  const brand = normalizeBrandsForCategory(args.brand, category.brands)
  const strainType = normalizeCategoryAttributeValue(
    args.strainType,
    category.strainTypes,
  )
  const subcategory = normalizeCategoryAttributeValue(
    args.subcategory,
    category.subcategories,
  )

  validateTierForCategory(
    tier,
    categorySlugForNormalization,
    category.tiers,
  )
  validateBaseForCategory(
    base,
    categorySlugForNormalization,
    category.bases,
  )
  validateBrandForCategory(brand, category.brands)

  const doc = {
    name: args.name ?? '',
    slug,
    base,
    categoryId: category._id,
    categorySlug: category.slug ?? '',
    shortDescription: args.shortDescription?.trim() || undefined,
    description: args.description?.trim() || undefined,
    priceCents: args.priceCents,
    batchId: args.batchId?.trim() || undefined,
    unit: args.unit?.trim() || undefined,
    availableDenominations: numericArray(args.availableDenominations),
    popularDenomination: numericArray(args.popularDenomination),
    thcPercentage: args.thcPercentage,
    cbdPercentage: args.cbdPercentage,
    effects: sanitizeArray(args.effects),
    terpenes: sanitizeArray(args.terpenes),
    limited: args.limited,
    featured: args.featured,
    available: args.available,
    stock: args.stock,
    inventoryMode: args.inventoryMode,
    masterStockQuantity: args.masterStockQuantity,
    masterStockUnit: args.masterStockUnit?.trim() || undefined,
    stockByDenomination: args.stockByDenomination,
    rating: args.rating,
    image: args.image,
    gallery: args.gallery?.filter((value) => {
      if (typeof value === 'string') {
        return value.trim().length > 0
      }
      return true
    }),
    consumption: args.consumption?.trim() || undefined,
    flavorNotes: sanitizeArray(args.flavorNotes),
    potencyLevel: args.potencyLevel,
    potencyProfile: args.potencyProfile?.trim() || undefined,
    lineage: args.lineage?.trim() || undefined,
    brand,
    strainType,
    subcategory,
    productType: args.productType?.trim() || undefined,
    noseRating: args.noseRating,
    weightGrams: args.weightGrams,
    netWeight: args.netWeight,
    netWeightUnit: args.netWeightUnit?.trim() || undefined,
    packagingMode: args.packagingMode,
    stockUnit: args.stockUnit?.trim() || undefined,
    packSize: args.packSize,
    lowStockThreshold: args.lowStockThreshold,
    startingWeight: args.startingWeight,
    remainingWeight: args.remainingWeight,
    variants: args.variants,
    priceByDenomination: args.priceByDenomination,
    salePriceByDenomination: args.salePriceByDenomination,
    eligibleForRewards: args.eligibleForRewards,
    eligibleForDeals: args.eligibleForDeals,
    onSale: args.onSale,
    eligibleDenominationForDeals: numericArray(
      args.eligibleDenominationForDeals,
    ),
    dealType: args.dealType,
    tier,
    eligibleForUpgrade: args.eligibleForUpgrade,
    upgradePrice: args.upgradePrice,
    highMargins: sanitizeArray(args.highMargins),
    brandCollaborators: sanitizeArray(args.brandCollaborators),
    tags: sanitizeArray(args.tags),
    archived: args.archived ?? false,
  }
  return {slug, doc}
}

export const createProduct = mutation({
  args: productSchema,
  handler: async (ctx, args) => {
    const {slug, doc} = await buildProductDoc(ctx, args)

    const productId = await ctx.db.insert('products', doc)

    await ctx.scheduler.runAfter(0, internal.activities.m.logProductActivity, {
      type: 'product_created',
      productId,
      productName: args.name?.trim() ?? '',
      productSlug: slug,
    })
    await ctx.scheduler.runAfter(
      0,
      internal.lowStockAlerts.m.evaluateProductAlertState,
      {
        productId,
      },
    )

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
    const categoryForValidation = nextCategorySlug
      ? await ctx.db
          .query('categories')
          .withIndex('by_slug', (q) => q.eq('slug', nextCategorySlug))
          .unique()
      : null

    const nextBaseFromFields =
      fields.base !== undefined
        ? normalizeBaseValue(
            fields.base,
            nextCategorySlug,
            categoryForValidation?.bases,
          )
        : undefined
    const nextTierFromFields =
      fields.tier !== undefined
        ? normalizeTierValue(
            fields.tier,
            nextCategorySlug,
            categoryForValidation?.tiers,
          )
        : undefined
    const nextBrandFromFields =
      fields.brand !== undefined && fields.brand !== null
        ? normalizeBrandsForCategory(fields.brand, categoryForValidation?.brands)
        : undefined
    const nextSubcategoryFromFields =
      fields.subcategory !== undefined
        ? normalizeCategoryAttributeValue(
            fields.subcategory,
            categoryForValidation?.subcategories,
          )
        : undefined
    const nextStrainTypeFromFields =
      fields.strainType !== undefined
        ? normalizeCategoryAttributeValue(
            fields.strainType,
            categoryForValidation?.strainTypes,
          )
        : undefined
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
    if (fields.eligibleForRewards !== undefined) {
      updates.eligibleForRewards = fields.eligibleForRewards
    }
    if (fields.inventoryMode !== undefined) {
      updates.inventoryMode = fields.inventoryMode
    }
    if (fields.masterStockUnit !== undefined) {
      updates.masterStockUnit = fields.masterStockUnit.trim() || undefined
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
    if (fields.packSize !== undefined) {
      updates.packSize = fields.packSize
    }
    if (fields.lowStockThreshold !== undefined) {
      updates.lowStockThreshold = fields.lowStockThreshold
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
    if (fields.strainType !== undefined) {
      updates.strainType = nextStrainTypeFromFields
    }
    if (
      categoryChanged &&
      fields.strainType === undefined &&
      product.strainType !== undefined
    ) {
      updates.strainType = undefined
    }
    if (fields.brand !== undefined && fields.brand !== null) {
      updates.brand = nextBrandFromFields
    }
    if (
      categoryChanged &&
      fields.brand === undefined &&
      product.brand !== undefined
    ) {
      updates.brand = undefined
    }
    if (fields.subcategory !== undefined) {
      updates.subcategory = nextSubcategoryFromFields
    }
    if (
      categoryChanged &&
      fields.subcategory === undefined &&
      product.subcategory !== undefined
    ) {
      updates.subcategory = undefined
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
      fields.tier !== undefined && nextTierFromFields !== product.tier
    if (fields.tier !== undefined) {
      updates.tier = nextTierFromFields
    }

    if (
      categoryChanged &&
      fields.tier === undefined &&
      product.tier !== undefined
    ) {
      updates.tier = undefined
    }

    if (tierChanged || categoryChanged) {
      const nextTier =
        fields.tier !== undefined
          ? nextTierFromFields
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
        nextBrandFromFields,
        categoryForValidation?.brands,
      )
    }
    if (fields.eligibleForDeals !== undefined) {
      updates.eligibleForDeals = fields.eligibleForDeals
    }
    if (fields.onSale !== undefined) {
      updates.onSale = fields.onSale
    }
    if (fields.salePriceByDenomination !== undefined) {
      updates.salePriceByDenomination = fields.salePriceByDenomination
    }
    if (fields.eligibleForUpgrade !== undefined) {
      updates.eligibleForUpgrade = fields.eligibleForUpgrade
    }
    if (fields.upgradePrice !== undefined) {
      updates.upgradePrice = fields.upgradePrice
    }

    await ctx.db.patch(id, updates)
    await ctx.scheduler.runAfter(
      0,
      internal.lowStockAlerts.m.evaluateProductAlertState,
      {
        productId: id,
      },
    )
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

    await ctx.db.patch(product._id, {
      archived: true,
      available: false,
      slug: archivedSlug,
    })

    await ctx.scheduler.runAfter(
      0,
      internal.lowStockAlerts.m.evaluateProductAlertState,
      {
        productId: product._id,
      },
    )

    return product._id
  },
})

export const seedProductsFromCsv = mutation({
  args: {
    title: v.string(),
    uploadedBy: v.string(),
    products: v.array(productCsvImportRowSchema),
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

    const rowsToProcess = sortProductCsvImportRowsForProcessing(args.products)

    for (const {row, rowIndex} of rowsToProcess) {
      try {
        const {_id, ...fields} = row as ProductCsvImportRowType
        let productId: Id<'products'>
        let activityType: 'product_created' | 'product_updated'
        let activitySlug: string
        let activityProductName: string

        if (_id) {
          const existingProduct = await ctx.db.get(_id)
          if (!existingProduct) {
            throw new Error(`Product with id "${_id}" not found.`)
          }

          const {
            _creationTime,
            _id: _existingId,
            ...existingFields
          } = existingProduct
          const mergedFields = mergeDefinedCsvImportFields(
            existingFields,
            fields,
          )
          const {slug, doc} = await buildProductDoc(ctx, mergedFields, _id)

          await ctx.db.replace(_id, doc)
          productId = _id
          activityType = 'product_updated'
          activitySlug = slug
          activityProductName = String(doc.name ?? existingProduct.name ?? '')
        } else {
          const {slug, doc} = await buildProductDoc(ctx, fields)
          productId = await ctx.db.insert('products', doc)
          activityType = 'product_created'
          activitySlug = slug
          activityProductName = String(doc.name ?? row.name ?? '')
        }

        await ctx.scheduler.runAfter(
          0,
          internal.activities.m.logProductActivity,
          {
            type: activityType,
            productId,
            productName: activityProductName,
            productSlug: activitySlug,
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

import {paginationOptsValidator, type PaginationResult} from 'convex/server'
import {v} from 'convex/values'
import type {Doc, Id} from '../_generated/dataModel'
import {query} from '../_generated/server'
import {getCanonicalUserByFid} from '../users/lib'
import {safeGet} from '../utils/id_validation'

type ProductWithTierLabel = Doc<'products'> & {
  tierLabel?: string
}

const resolveTierLabel = (
  tier: string | undefined,
  category: Doc<'categories'> | null | undefined,
) => {
  const normalizedTier = tier?.trim()
  if (!normalizedTier) return undefined

  const match = category?.tiers?.find(
    (entry) => entry.slug === normalizedTier || entry.name === normalizedTier,
  )

  return match?.name ?? normalizedTier
}

const buildCategoriesBySlug = (categories: Doc<'categories'>[]) =>
  new Map(
    categories
      .filter((category) => !!category.slug)
      .map((category) => [category.slug as string, category]),
  )

const attachTierLabels = (
  products: Doc<'products'>[],
  categoriesBySlug: Map<string, Doc<'categories'>>,
): ProductWithTierLabel[] =>
  products.map((product) => ({
    ...product,
    tierLabel: resolveTierLabel(
      product.tier,
      categoriesBySlug.get(product.categorySlug ?? ''),
    ),
  }))

export const listProductSlugs = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query('products').collect()
    return products
      .filter((p) => p.archived !== true)
      .map((p) => p.slug)
      .filter((s): s is string => typeof s === 'string' && s.length > 0)
  },
})

export const listProductImportTargets = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query('products').collect()
    return products
      .filter((product) => typeof product.slug === 'string' && product.slug)
      .map((product) => ({
        _id: product._id,
        slug: product.slug as string,
      }))
  },
})

export const listProducts = query({
  args: {
    availableOnly: v.optional(v.boolean()),
    brand: v.optional(v.string()),
    categorySlug: v.optional(v.string()),
    limit: v.optional(v.number()),
    eligibleForDeals: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<ProductWithTierLabel[]> => {
    const limit = args.limit ?? 50
    const baseQuery = args.categorySlug
      ? ctx.db
          .query('products')
          .withIndex('by_category', (q) =>
            q.eq('categorySlug', args.categorySlug!),
          )
      : ctx.db.query('products')

    let products = await baseQuery.collect()
    products = products.filter((p) => p.archived !== true)
    if (args.availableOnly === true) {
      products = products.filter((p) => p.available === true)
    }
    if (args.brand) {
      const normalizedBrand = normalizeBrandValue(args.brand)
      products = products.filter((p) =>
        normalizeBrandValues(p.brand).includes(normalizedBrand),
      )
    }
    if (args.eligibleForDeals === true) {
      products = products.filter((p) => p.eligibleForDeals === true)
    }
    const categories = await ctx.db.query('categories').collect()
    return attachTierLabels(
      sortProducts(products).slice(0, limit),
      buildCategoriesBySlug(categories),
    )
  },
})

export const listProductsPaginated = query({
  args: {
    archived: v.optional(v.boolean()),
    categorySlug: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args): Promise<PaginationResult<Doc<'products'>>> => {
    const archived = args.archived === true
    const baseQuery = args.categorySlug
      ? ctx.db
          .query('products')
          .withIndex('by_category', (q) =>
            q.eq('categorySlug', args.categorySlug!),
          )
          .order('desc')
      : ctx.db.query('products').order('desc')

    return await baseQuery
      .filter((q) =>
        archived
          ? q.eq(q.field('archived'), true)
          : q.neq(q.field('archived'), true),
      )
      .paginate(args.paginationOpts)
  },
})

export const listCategoryProductsPaginated = query({
  args: {
    brand: v.optional(v.string()),
    categorySlug: v.string(),
    paginationOpts: paginationOptsValidator,
    productType: v.optional(v.string()),
    subcategory: v.optional(v.string()),
    tier: v.optional(v.string()),
  },
  handler: async (
    ctx,
    args,
  ): Promise<PaginationResult<ProductWithTierLabel>> => {
    const category = await ctx.db
      .query('categories')
      .withIndex('by_slug', (q) => q.eq('slug', args.categorySlug))
      .unique()

    const categoriesBySlug = buildCategoriesBySlug(category ? [category] : [])

    const buildProductsQuery = () => {
      let productsQuery = ctx.db
        .query('products')
        .withIndex('by_category', (q) =>
          q.eq('categorySlug', args.categorySlug),
        )
        .order('desc')
        .filter((q) => q.neq(q.field('archived'), true))

      if (args.productType) {
        productsQuery = productsQuery.filter((q) =>
          q.eq(q.field('productType'), args.productType),
        )
      }

      if (args.tier) {
        productsQuery = productsQuery.filter((q) =>
          q.eq(q.field('tier'), args.tier),
        )
      }

      if (args.subcategory) {
        productsQuery = productsQuery.filter((q) =>
          q.eq(q.field('subcategory'), args.subcategory),
        )
      }

      return productsQuery
    }

    if (!args.brand) {
      const result = await buildProductsQuery().paginate(args.paginationOpts)
      return {
        ...result,
        page: attachTierLabels(result.page, categoriesBySlug),
      }
    }

    const normalizedBrand = normalizeBrandValue(args.brand)
    const startOffset = decodeBrandPaginationCursor(args.paginationOpts.cursor)
    const page: Doc<'products'>[] = []
    let matchingOffset = 0
    let hasMore = false

    for await (const product of buildProductsQuery()) {
      if (!normalizeBrandValues(product.brand).includes(normalizedBrand)) {
        continue
      }

      if (matchingOffset < startOffset) {
        matchingOffset += 1
        continue
      }

      if (page.length >= args.paginationOpts.numItems) {
        hasMore = true
        break
      }

      page.push(product)
      matchingOffset += 1
    }

    return {
      continueCursor: hasMore
        ? encodeBrandPaginationCursor(startOffset + page.length)
        : '',
      isDone: !hasMore,
      page: attachTierLabels(page, categoriesBySlug),
    }
  },
})

export const listArchivedProducts = query({
  args: {
    categorySlug: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<Doc<'products'>[]> => {
    const limit = args.limit ?? 50
    const baseQuery = args.categorySlug
      ? ctx.db
          .query('products')
          .withIndex('by_category', (q) =>
            q.eq('categorySlug', args.categorySlug!),
          )
      : ctx.db.query('products')

    const products = await baseQuery.collect()
    return sortProducts(products.filter((p) => p.archived === true)).slice(
      0,
      limit,
    )
  },
})

export const getProductById = query({
  args: {
    productId: v.id('products'),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId)
    return product
  },
})

export const getProductsByIds = query({
  args: {
    // Accept string IDs from client-side localStorage history and sanitize server-side.
    // This prevents one malformed legacy entry from failing the whole query.
    productIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const products = await Promise.all(
      args.productIds.map((id) => safeGet(ctx.db, 'products', id)),
    )
    const categories = await ctx.db.query('categories').collect()
    return attachTierLabels(
      products.filter((p): p is NonNullable<typeof p> => p !== null),
      buildCategoriesBySlug(categories),
    )
  },
})

export const getProductBySlug = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db
      .query('products')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .unique()

    if (!product || !product.categoryId) {
      return null
    }

    // Validate categoryId from database before using in get()
    const category = await safeGet(ctx.db, 'categories', product.categoryId)
    const related = await ctx.db
      .query('products')
      .withIndex('by_category', (q) =>
        q.eq('categorySlug', product.categorySlug ?? ''),
      )
      .collect()

    const relatedProducts = sortProducts(
      related.filter((item) => item._id !== product._id),
    ).slice(0, 4)

    return {
      product: {
        ...product,
        tierLabel: resolveTierLabel(product.tier, category),
      },
      category,
      related: relatedProducts.map((item) => ({
        ...item,
        tierLabel: resolveTierLabel(item.tier, category),
      })),
    }
  },
})

export const getProductByName = query({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const products = await ctx.db.query('products').collect()
    const product = products.find((p) => p.name === args.name)
    return product ?? null
  },
})

const normalizeBrandValue = (brand?: string) =>
  (brand ?? '').trim().toLowerCase().replace(/\s+/g, '-')

const normalizeBrandValues = (brands?: string | string[]) =>
  (Array.isArray(brands) ? brands : brands ? [brands] : [])
    .map(normalizeBrandValue)
    .filter((brand) => brand.length > 0)

const decodeBrandPaginationCursor = (cursor: string | null): number => {
  if (!cursor) {
    return 0
  }

  const parsed = Number(cursor)
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0
  }

  return Math.floor(parsed)
}

const encodeBrandPaginationCursor = (offset: number): string => {
  if (!Number.isFinite(offset) || offset <= 0) {
    return ''
  }

  return String(Math.floor(offset))
}

const sortProducts = <T extends {featured?: boolean; name?: string}>(
  items: T[],
): T[] => {
  return [...items].sort((a, b) => {
    const aFeatured = a.featured ?? false
    const bFeatured = b.featured ?? false
    if (aFeatured === bFeatured) {
      const aName = a.name ?? ''
      const bName = b.name ?? ''
      return aName.localeCompare(bName)
    }
    return aFeatured ? -1 : 1
  })
}

export const listGallery = query({
  args: {id: v.id('products')},
  handler: async (ctx, {id}) => {
    const product = await ctx.db.get('products', id)
    if (!product) {
      console.warn(`[listGallery] Product not found: ${id}`)
      return []
    }
    const galleryItems = product.gallery ?? []
    if (galleryItems.length === 0) {
      return []
    }

    const gallery: Array<string | null> = []

    for (const item of galleryItems) {
      if (typeof item === 'string') {
        // Check if it's already a URL or a storage ID string
        if (item.startsWith('http') || item.startsWith('data:')) {
          gallery.push(item)
        } else {
          // Storage ID as string - convert to URL
          try {
            const image = await ctx.storage.getUrl(item as Id<'_storage'>)
            // getUrl can return null if storage ID is invalid
            if (image) {
              gallery.push(image)
              continue
            } else {
              console.warn(
                `[listGallery] getUrl returned null for storage ID: ${item}`,
              )
            }
            gallery.push(image ?? null)
          } catch (error) {
            console.error(
              `[listGallery] Failed to get URL for storage ID: ${item}`,
              error,
            )
            gallery.push(null)
          }
        }
      } else {
        // Storage ID (Id<'_storage'>) - convert to URL
        try {
          const image = await ctx.storage.getUrl(item)
          // getUrl can return null if storage ID is invalid
          if (image) {
            gallery.push(image)
            continue
          } else {
            console.warn(
              `[listGallery] getUrl returned null for storage ID: ${item}`,
            )
          }
          gallery.push(image ?? null)
        } catch (error) {
          console.error(
            `[listGallery] Failed to get URL for storage ID: ${item}`,
            error,
          )
          gallery.push(null)
        }
      }
    }

    return gallery
  },
})

export const getPrimaryImage = query({
  args: {id: v.id('products')},
  handler: async (ctx, {id}) => {
    const product = await ctx.db.get('products', id)
    if (!product || !product.image) {
      return null
    }
    const primaryImage = await ctx.storage.getUrl(product.image)
    return primaryImage
  },
})

export const getFeaturedProducts = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10
    const products = await ctx.db
      .query('products')
      .filter((q) => q.eq(q.field('featured'), true))
      .take(limit)

    const categories = await ctx.db.query('categories').collect()
    return attachTierLabels(
      sortProducts(products),
      buildCategoriesBySlug(categories),
    )
  },
})

export const getPreviouslyBoughtProducts = query({
  args: {
    fid: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (!args.fid) return []

    const user = await getCanonicalUserByFid(ctx, args.fid)

    if (!user) return []

    const orders = await ctx.db
      .query('orders')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .order('desc')
      .take(50)

    const productIds = new Set<Id<'products'>>()
    for (const order of orders) {
      for (const item of order.items) {
        productIds.add(item.productId)
      }
    }

    const limit = args.limit ?? 10
    const uniqueIds = Array.from(productIds).slice(0, limit)

    const products = await Promise.all(
      uniqueIds.map((id) => safeGet(ctx.db, 'products', id)),
    )
    const categories = await ctx.db.query('categories').collect()
    return attachTierLabels(
      products.filter((p): p is NonNullable<typeof p> => p !== null),
      buildCategoriesBySlug(categories),
    )
  },
})

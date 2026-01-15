import {v} from 'convex/values'
import {Id} from '../_generated/dataModel'
import {query} from '../_generated/server'

export const listProducts = query({
  args: {
    categorySlug: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50
    const baseQuery = args.categorySlug
      ? ctx.db
          .query('products')
          .withIndex('by_category', (q) =>
            q.eq('categorySlug', args.categorySlug!),
          )
      : ctx.db.query('products')

    const products = await baseQuery.collect()
    return sortProducts(products).slice(0, limit)
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
    productIds: v.array(v.id('products')),
  },
  handler: async (ctx, args) => {
    const products = await Promise.all(
      args.productIds.map((id) => ctx.db.get(id)),
    )
    return products.filter((p): p is NonNullable<typeof p> => p !== null)
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

    const category = await ctx.db.get(product.categoryId)
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
      product,
      category,
      related: relatedProducts,
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

const sortProducts = <T extends {featured?: boolean; name?: string}>(
  items: T[],
) => {
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
          // Already a URL string
          console.log(
            `[listGallery] Item is already a URL: ${item.substring(0, 50)}...`,
          )
          gallery.push(item)
        } else {
          // Storage ID as string - convert to URL
          try {
            const image = await ctx.storage.getUrl(item as Id<'_storage'>)
            // getUrl can return null if storage ID is invalid
            if (image) {
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

    return sortProducts(products)
  },
})

export const getPreviouslyBoughtProducts = query({
  args: {
    firebaseId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (!args.firebaseId) return []

    const user = await ctx.db
      .query('users')
      .withIndex('by_firebase_id', (q) => q.eq('firebaseId', args.firebaseId!))
      .unique()

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

    const products = await Promise.all(uniqueIds.map((id) => ctx.db.get(id)))

    return products.filter((p): p is NonNullable<typeof p> => p !== null)
  },
})

import {v} from 'convex/values'
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
      return null
    }
    const galleryItems = product.gallery ?? []
    const gallery: Array<string | null> = []

    for (const item of galleryItems) {
      if (typeof item === 'string') {
        // Already a URL string
        gallery.push(item)
      } else {
        // Storage ID - convert to URL
        const image = await ctx.storage.getUrl(item)
        gallery.push(image)
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

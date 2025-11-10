import {v} from 'convex/values'
import {query} from './_generated/server'

const sortProducts = <T extends {featured: boolean; name: string}>(
  items: T[],
) => {
  return [...items].sort((a, b) => {
    if (a.featured === b.featured) {
      return a.name.localeCompare(b.name)
    }
    return a.featured ? -1 : 1
  })
}

export const listCategories = query({
  args: {},
  handler: async (ctx) => {
    const categories = await ctx.db.query('categories').collect()
    return categories.sort((a, b) => a.name.localeCompare(b.name))
  },
})

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

export const getProductBySlug = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db
      .query('products')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .unique()

    if (!product) {
      return null
    }

    const category = await ctx.db.get(product.categoryId)
    const related = await ctx.db
      .query('products')
      .withIndex('by_category', (q) =>
        q.eq('categorySlug', product.categorySlug),
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

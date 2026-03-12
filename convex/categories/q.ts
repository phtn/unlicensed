import {v} from 'convex/values'
import {query} from '../_generated/server'

function compareCategoriesByOrderThenName(
  a: {name: string; order?: number},
  b: {name: string; order?: number},
): number {
  const orderA = a.order ?? Number.MAX_SAFE_INTEGER
  const orderB = b.order ?? Number.MAX_SAFE_INTEGER
  if (orderA !== orderB) return orderA - orderB
  return a.name.localeCompare(b.name)
}

export const listCategories = query({
  args: {},
  handler: async (ctx) => {
    const categories = await ctx.db
      .query('categories')
      .filter((f) => f.neq(f.field('visible'), false))
      .collect()
    return categories.sort(compareCategoriesByOrderThenName)
  },
})

export const listCategoriesForAdmin = query({
  args: {},
  handler: async (ctx) => {
    const categories = await ctx.db.query('categories').collect()

    const categoriesWithStats = await Promise.all(
      categories.map(async (category) => {
        const categorySlug = category.slug
        const productCount = categorySlug
          ? (
              await ctx.db
                .query('products')
                .withIndex('by_category', (q) =>
                  q.eq('categorySlug', categorySlug),
                )
                .collect()
            ).filter((product) => product.archived !== true).length
          : 0

        return {
          ...category,
          productCount,
        }
      }),
    )

    return categoriesWithStats.sort(compareCategoriesByOrderThenName)
  },
})

export const getCategoryById = query({
  args: {
    id: v.id('categories'),
  },
  handler: async (ctx, {id}) => {
    const category = await ctx.db.get('categories', id)
    return category ?? null
  },
})

export const getCategoryBySlug = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const category = await ctx.db
      .query('categories')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .unique()
    return category ?? null
  },
})

export const getHeroImage = query({
  args: {id: v.id('categories')},
  handler: async (ctx, {id}) => {
    const category = await ctx.db.get(id)
    if (!category || !category.heroImage) {
      return null
    }
    const primaryImage = await ctx.storage.getUrl(category.heroImage)
    return primaryImage
  },
})

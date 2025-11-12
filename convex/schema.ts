import {defineSchema, defineTable} from 'convex/server'
import {categorySchema} from './categories/d'
import {productSchema} from './products/d'

export default defineSchema({
  categories: defineTable(categorySchema).index('by_slug', ['slug']),
  products: defineTable(productSchema)
    .index('by_slug', ['slug'])
    .index('by_category', ['categorySlug'])
    .searchIndex('search_name', {
      searchField: 'name',
      filterFields: ['categorySlug'],
    }),
})

import {defineSchema, defineTable} from 'convex/server'
import {v} from 'convex/values'

export default defineSchema({
  categories: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    heroImage: v.string(),
    highlight: v.optional(v.string()),
    benefits: v.optional(v.array(v.string())),
  }).index('by_slug', ['slug']),
  products: defineTable({
    name: v.string(),
    slug: v.string(),
    categoryId: v.id('categories'),
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
    potencyProfile: v.optional(v.string()),
    weightGrams: v.optional(v.number()),
  })
    .index('by_slug', ['slug'])
    .index('by_category', ['categorySlug'])
    .searchIndex('search_name', {
      searchField: 'name',
      filterFields: ['categorySlug'],
    }),
})

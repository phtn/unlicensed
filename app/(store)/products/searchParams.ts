import {
  createSearchParamsCache,
  parseAsString,
  parseAsStringEnum,
} from 'nuqs/server'
import {PotencyLevel} from '@/convex/products/d'

export const searchParamsCache = createSearchParamsCache({
  brand: parseAsString,
  category: parseAsString,
  potency: parseAsStringEnum<PotencyLevel>(['mild', 'medium', 'high']),
  minThc: parseAsString,
  maxThc: parseAsString,
  effects: parseAsString, // Comma-separated
  terpenes: parseAsString, // Comma-separated
  flavorNotes: parseAsString, // Comma-separated
  search: parseAsString,
  sort: parseAsStringEnum<'name' | 'price' | 'thc' | 'rating'>(['name', 'price', 'thc', 'rating']),
  order: parseAsStringEnum<'asc' | 'desc'>(['asc', 'desc']),
})

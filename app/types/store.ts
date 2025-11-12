import {PotencyLevel} from '@/convex/products/d'

export interface StoreCategory {
  slug: string
  name: string
  description: string
  heroImage: string
  highlight?: string
  benefits?: string[]
}

export interface StoreProduct {
  slug: string
  name: string
  categorySlug: string
  shortDescription: string
  description: string
  priceCents: number
  unit: string
  availableDenominations: number[]
  popularDenomination: number
  thcPercentage: number
  cbdPercentage?: number
  effects: string[]
  terpenes: string[]
  featured: boolean
  available: boolean
  stock: number
  rating: number
  image: string
  gallery: string[]
  consumption: string
  flavorNotes: string[]
  potencyLevel: PotencyLevel
  potencyProfile?: string
  weightGrams?: number
  _id?: string
  _creationTime?: number
}

export interface StoreProductDetail {
  product: StoreProduct
  category?: StoreCategory | null
  related: StoreProduct[]
}

import {Id} from '@/convex/_generated/dataModel'
import {PotencyLevel} from '@/convex/products/d'

export interface IAttribute {
  name?: string
  slug?: string
}
export interface StoreCategory {
  slug: string
  name: string
  tiers: IAttribute[]
  strainTypes?: IAttribute[]
  subcategories?: IAttribute[]
  productTypes?: IAttribute[]
  brands?: IAttribute[]
  bases?: IAttribute[]
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
  popularDenomination: number[]
  thcPercentage: number
  cbdPercentage?: number
  lineage?: string
  noseRating?: number
  effects: string[]
  terpenes: string[]
  featured: boolean
  limited: boolean
  onSale: boolean
  available: boolean
  stock: number
  inventoryMode?: 'by_denomination' | 'shared' | 'shared_weight'
  masterStockQuantity?: number
  masterStockUnit?: string
  /** Per-denomination inventory counts. Key = denomination as string (e.g. "0.125", "1", "3.5"). */
  stockByDenomination?: Record<string, number>
  /** Per-denomination price in cents. Key = denomination as string (e.g. "0.125", "1", "3.5"). */
  priceByDenomination?: Record<string, number>
  rating: number
  image: string | null
  gallery: string[]
  consumption: string
  flavorNotes: string[]
  potencyLevel: PotencyLevel
  potencyProfile?: string
  base?: string
  productType?: string
  strainType?: string
  productTier?: string
  productTierLabel?: string
  subcategory?: string
  weightGrams?: number
  brand?: string[]
  grower?: string
  _id?: Id<'products'>
  _creationTime?: number
  netWeight?: number
  netWeightUnit?: string
  packagingMode?: 'bulk' | 'prepack'
  stockUnit?: string
  startingWeight?: number
  remainingWeight?: number
  batchId?: string
  archived?: boolean
  packSize?: number
}

export interface StoreProductDetail {
  product: StoreProduct
  category?: StoreCategory | null
  related: StoreProduct[]
}

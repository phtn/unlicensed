import type {StoreCategory, StoreProduct, StoreProductDetail} from '@/app/types'
import type {IAttribute} from '@/app/types/store'
import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {categoriesSeed, productsSeed} from '@/convex/init'
import {PotencyLevel} from '@/convex/products/d'
import {getTotalStock} from '@/lib/productStock'
import {ConvexHttpClient} from 'convex/browser'
import {cache} from 'react'

export type RawCategory = {
  slug?: string
  name: string
  tiers?: IAttribute[]
  subcategories?: IAttribute[]
  productTypes?: IAttribute[]
  brands?: IAttribute[]
  bases?: IAttribute[]
  description?: string
  heroImage?: string
  highlight?: string | null
  benefits?: string[] | null
}

export type RawProduct = {
  slug?: string
  name?: string
  categorySlug?: string
  shortDescription?: string
  description?: string
  priceCents?: number
  unit?: string
  availableDenominations?: number[]
  popularDenomination?: number[]
  thcPercentage?: number
  cbdPercentage?: number
  effects?: string[]
  terpenes?: string[]
  featured?: boolean
  limited?: boolean
  onSale?: boolean
  available?: boolean
  stock?: number
  stockByDenomination?: Record<string, number>
  /** Per-denomination price in cents. */
  priceByDenomination?: Record<string, number>
  rating?: number
  image?: string
  gallery?: string[]
  consumption?: string
  flavorNotes?: string[]
  potencyLevel?: PotencyLevel
  potencyProfile?: string
  weightGrams?: number
  base?: string
  productType?: string
  brand?: string | string[]
  grower?: string
  tier?: string
  tierLabel?: string
  subcategory?: string
  netWeight?: number
  netWeightUnit?: string
  batchId?: string
  _id?: Id<'products'>
  _creationTime?: number
}

export type RawProductDetail = {
  product: RawProduct
  category: RawCategory | null
  related: RawProduct[]
}

let cachedClient: ConvexHttpClient | null = null

export const getConvexUrl = () =>
  process.env.NEXT_PUBLIC_CONVEX_URL ?? process.env.CONVEX_URL ?? null

const getClient = () => {
  const url = getConvexUrl()
  if (!url) {
    return null
  }

  if (!cachedClient) {
    cachedClient = new ConvexHttpClient(url)
  }
  return cachedClient
}

export const adaptCategory = (category: RawCategory): StoreCategory => ({
  slug: category.slug ?? '',
  name: category.name ?? '',
  tiers: category.tiers ?? [],
  subcategories: category.subcategories ?? [],
  productTypes: category.productTypes ?? [],
  brands: category.brands ?? [],
  bases: category.bases ?? [],
  description: category.description ?? '',
  heroImage: category.heroImage ?? '',
  highlight: category.highlight ?? undefined,
  benefits: category.benefits ?? undefined,
})

const resolveAttributeLabel = (
  value: string | undefined,
  options?: IAttribute[],
) => {
  const normalizedValue = value?.trim()
  if (!normalizedValue) return undefined

  const match = options?.find(
    (option) =>
      option.slug === normalizedValue || option.name === normalizedValue,
  )

  return match?.name ?? normalizedValue
}

export const adaptProduct = (
  product: RawProduct,
  category?: RawCategory | StoreCategory | null,
): StoreProduct => ({
  slug: product.slug ?? '',
  name: product.name ?? '',
  categorySlug: product.categorySlug ?? '',
  shortDescription: product.shortDescription ?? '',
  description: product.description ?? '',
  priceCents: product.priceCents ?? 0,
  unit: product.unit ?? '',
  availableDenominations: product.availableDenominations ?? [1],
  popularDenomination:
    product.popularDenomination ??
    (product.availableDenominations && product.availableDenominations.length > 0
      ? [product.availableDenominations[0]]
      : [1]),
  thcPercentage: product.thcPercentage ?? 0,
  cbdPercentage: product.cbdPercentage,
  effects: product.effects ?? [],
  terpenes: product.terpenes ?? [],
  featured: product.featured ?? false,
  limited: product.limited ?? false,
  onSale: product.onSale ?? false,
  available: product.available ?? true,
  stock: getTotalStock(product),
  stockByDenomination: product.stockByDenomination,
  priceByDenomination: product.priceByDenomination,
  rating: product.rating ?? 0,
  image: product.image ?? '',
  gallery: product.gallery ?? [],
  consumption: product.consumption ?? '',
  flavorNotes: product.flavorNotes ?? [],
  potencyLevel: product.potencyLevel ?? 'mild',
  potencyProfile: product.potencyProfile,
  base: product.base,
  productType: product.productType,
  weightGrams: product.weightGrams,
  netWeight: product.netWeight,
  netWeightUnit: product.netWeightUnit,
  batchId: product.batchId,
  brand: Array.isArray(product.brand)
    ? product.brand
    : product.brand
      ? [product.brand]
      : undefined,
  productTier: product.tier,
  productTierLabel:
    product.tierLabel ?? resolveAttributeLabel(product.tier, category?.tiers),
  subcategory: product.subcategory,
  _id: product._id,
  _creationTime: product._creationTime,
})

export const adaptProductDetail = (
  detail: RawProductDetail,
): StoreProductDetail => ({
  product: adaptProduct(detail.product, detail.category),
  category: detail.category ? adaptCategory(detail.category) : null,
  related: detail.related.map((product) =>
    adaptProduct(product, detail.category),
  ),
})

export const fallbackCategories = (): StoreCategory[] => {
  return categoriesSeed.map((category) => adaptCategory(category))
}

export const fallbackProducts = (categorySlug?: string): StoreProduct[] => {
  const filtered = categorySlug
    ? productsSeed.filter((item) => item.categorySlug === categorySlug)
    : productsSeed

  return filtered.map((product, index) =>
    adaptProduct(
      {
        ...product,
        // _id: `seed_${product.slug}`,
        _creationTime: Date.now() - index * 1000,
      },
      categoriesSeed.find((category) => category.slug === product.categorySlug),
    ),
  )
}

export const fallbackProductDetail = (
  slug: string,
): StoreProductDetail | null => {
  const product = productsSeed.find((item) => item.slug === slug)
  if (!product) {
    return null
  }

  const rawProduct: RawProduct = {
    ...product,
    // _id: `seed_${product.slug}`,
    _creationTime: Date.now(),
  }
  const related = productsSeed
    .filter(
      (item) =>
        item.categorySlug === product.categorySlug && item.slug !== slug,
    )
    .map(
      (item, index): RawProduct => ({
        ...item,
        // _id: `seed_${item.slug}`,
        _creationTime: Date.now() - index * 1000,
      }),
    )
  const category = categoriesSeed.find(
    (item) => item.slug === product.categorySlug,
  )
  return adaptProductDetail({
    product: rawProduct,
    category: category ? {...category} : null,
    related,
  })
}

const _fetchCategories = async (): Promise<StoreCategory[]> => {
  const client = getClient()
  if (!client) {
    return fallbackCategories()
  }

  try {
    const categories = (await client.query(
      api.categories.q.listCategories,
      {},
    )) as RawCategory[]
    return categories.map(adaptCategory)
  } catch (error) {
    console.warn('Falling back to seed categories', error)
    return fallbackCategories()
  }
}

export const fetchCategories = cache(_fetchCategories)

const _fetchProducts = async (options?: {
  categorySlug?: string
  limit?: number
  eligibleForDeals?: boolean
}): Promise<StoreProduct[]> => {
  const client = getClient()
  if (!client) {
    const fallback = fallbackProducts(options?.categorySlug)
    return options?.limit ? fallback.slice(0, options.limit) : fallback
  }

  try {
    const [products, categories] = await Promise.all([
      client.query(api.products.q.listProducts, {
        categorySlug: options?.categorySlug,
        limit: options?.limit,
        eligibleForDeals: options?.eligibleForDeals,
      }) as Promise<RawProduct[]>,
      fetchCategories(),
    ])
    const categoriesBySlug = new Map(
      categories.map((category) => [category.slug, category]),
    )
    return products.map((product) =>
      adaptProduct(product, categoriesBySlug.get(product.categorySlug ?? '')),
    )
  } catch (error) {
    console.warn('Falling back to seed products', error)
    const fallback = fallbackProducts(options?.categorySlug)
    return options?.limit ? fallback.slice(0, options.limit) : fallback
  }
}

// React.cache() uses Object.is() for cache keys
// For per-request deduplication, we cache the function but note that different object references
// will cause cache misses (which is expected for different parameters)
export const fetchProducts = cache(_fetchProducts)

const _fetchProductDetail = async (
  slug: string,
): Promise<StoreProductDetail | null> => {
  const client = getClient()
  if (!client) {
    return fallbackProductDetail(slug)
  }

  try {
    const detail = (await client.query(api.products.q.getProductBySlug, {
      slug,
    })) as RawProductDetail | null
    if (!detail) {
      return fallbackProductDetail(slug)
    }
    return adaptProductDetail(detail)
  } catch (error) {
    console.warn('Falling back to seed product detail', error)
    return fallbackProductDetail(slug)
  }
}

export const fetchProductDetail = cache(_fetchProductDetail)

interface RawFireCollectionConfig {
  id: string
  title: string
  enabled: boolean
  order: number
  productIds: string[]
}

interface StoreCollectionSection {
  id: string
  title: string
  products: StoreProduct[]
}

const _fetchFireCollections = async (): Promise<StoreCollectionSection[]> => {
  const client = getClient()
  if (!client) {
    return []
  }

  try {
    const collections = (await client.query(
      api.admin.q.getFireCollectionsConfig,
      {},
    )) as RawFireCollectionConfig[] | null
    const enabledCollections = (collections ?? []).filter(
      (collection) => collection.enabled && collection.productIds.length > 0,
    )

    if (enabledCollections.length === 0) {
      return []
    }

    const productIds = Array.from(
      new Set(
        enabledCollections.flatMap((collection) => collection.productIds),
      ),
    )
    const [products, categories] = await Promise.all([
      client.query(api.products.q.getProductsByIds, {
        productIds,
      }) as Promise<RawProduct[]>,
      fetchCategories(),
    ])
    const categoriesBySlug = new Map(
      categories.map((category) => [category.slug, category]),
    )
    const productsById = new Map(
      products.map((product) => [
        String(product._id),
        adaptProduct(product, categoriesBySlug.get(product.categorySlug ?? '')),
      ]),
    )

    return enabledCollections
      .map((collection) => ({
        id: collection.id,
        title: collection.title,
        products: collection.productIds
          .map((productId) => productsById.get(productId))
          .filter((product): product is StoreProduct => product != null),
      }))
      .filter((collection) => collection.products.length > 0)
  } catch (error) {
    console.warn('Falling back to empty fire collections', error)
    return []
  }
}

export const fetchFireCollections = cache(_fetchFireCollections)

// const MOCK_SUB_ITEMS_BY_SLUG: Partial<Record<string, NavMenuSubItem[]>> = {
//   flower: [
//     {id: 'b', label: 'B', href: '/lobby/category/flower?tier=B'},
//     {id: 'a', label: 'A', href: '/lobby/category/flower?tier=A'},
//     {id: 'aa', label: 'AA', href: '/lobby/category/flower?tier=AA'},
//     {id: 'aaa', label: 'AAA', href: '/lobby/category/flower?tier=AAA'},
//     {id: 'aaaa', label: 'AAAA', href: '/lobby/category/flower?tier=AAAA'},
//     {id: 'rare', label: 'RARE', href: '/lobby/category/flower?tier=RARE'},
//   ],
//   extracts: [
//     {
//       id: 'cured_resin',
//       label: 'Cured Resin',
//       href: '/lobby/category/extracts?tier=cured_resin',
//     },
//     {
//       id: 'fresh_frozen',
//       label: 'Fresh Frozen',
//       href: '/lobby/category/extracts?tier=fresh_frozen',
//     },
//     {
//       id: 'solventless',
//       label: 'Solventless',
//       href: '/lobby/category/extracts?tier=solventless',
//     },
//   ],
//   vapes: [
//     {
//       id: 'distillate',
//       label: 'Distillate',
//       href: '/lobby/category/vapes?tier=distillate',
//     },
//     {
//       id: 'cured_resin',
//       label: 'Cured Resin',
//       href: '/lobby/category/vapes?tier=cured_resin',
//     },
//     {
//       id: 'fresh_frozen',
//       label: 'Fresh Frozen',
//       href: '/lobby/category/vapes?tier=fresh_frozen',
//     },
//     {
//       id: 'solventless',
//       label: 'Solventless',
//       href: '/lobby/category/vapes?tier=solventless',
//     },
//   ],
//   'pre-rolls': [
//     {
//       id: 'flower',
//       label: 'Flower',
//       href: '/lobby/category/pre-rolls?tier=flower',
//     },
//     {
//       id: 'infused',
//       label: 'Infused',
//       href: '/lobby/category/pre-rolls?tier=infused',
//     },
//   ],
// }

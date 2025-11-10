import {ConvexHttpClient} from 'convex/browser'
import {api} from '@/convex/_generated/api'
import type {StoreCategory, StoreProduct, StoreProductDetail} from '@/app/types'
import {categoriesSeed, productsSeed} from '@/convex/init'

type RawCategory = {
  slug: string
  name: string
  description: string
  heroImage: string
  highlight?: string | null
  benefits?: string[] | null
}

type RawProduct = {
  slug: string
  name: string
  categorySlug: string
  shortDescription: string
  description: string
  priceCents: number
  unit: string
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
  potencyProfile?: string
  weightGrams?: number
  _id?: string
  _creationTime?: number
}

type RawProductDetail = {
  product: RawProduct
  category: RawCategory | null
  related: RawProduct[]
}

let cachedClient: ConvexHttpClient | null = null

const convexUrl = () =>
  process.env.NEXT_PUBLIC_CONVEX_URL ?? process.env.CONVEX_URL ?? null

const getClient = () => {
  const url = convexUrl()
  if (!url) {
    return null
  }

  if (!cachedClient) {
    cachedClient = new ConvexHttpClient(url)
  }
  return cachedClient
}

const adaptCategory = (category: RawCategory): StoreCategory => ({
  slug: category.slug,
  name: category.name,
  description: category.description,
  heroImage: category.heroImage,
  highlight: category.highlight ?? undefined,
  benefits: category.benefits ?? undefined,
})

const adaptProduct = (product: RawProduct): StoreProduct => ({
  slug: product.slug,
  name: product.name,
  categorySlug: product.categorySlug,
  shortDescription: product.shortDescription,
  description: product.description,
  priceCents: product.priceCents,
  unit: product.unit,
  thcPercentage: product.thcPercentage,
  cbdPercentage: product.cbdPercentage,
  effects: product.effects,
  terpenes: product.terpenes,
  featured: product.featured,
  available: product.available,
  stock: product.stock,
  rating: product.rating,
  image: product.image,
  gallery: product.gallery,
  consumption: product.consumption,
  flavorNotes: product.flavorNotes,
  potencyProfile: product.potencyProfile,
  weightGrams: product.weightGrams,
  _id: product._id,
  _creationTime: product._creationTime,
})

const fallbackCategories = (): StoreCategory[] => {
  return categoriesSeed.map((category) => adaptCategory(category))
}

const fallbackProducts = (categorySlug?: string): StoreProduct[] => {
  const filtered = categorySlug
    ? productsSeed.filter((item) => item.categorySlug === categorySlug)
    : productsSeed

  return filtered.map((product, index) =>
    adaptProduct({
      ...product,
      _id: `seed_${product.slug}`,
      _creationTime: Date.now() - index * 1000,
    }),
  )
}

const fallbackProductDetail = (slug: string): StoreProductDetail | null => {
  const product = productsSeed.find((item) => item.slug === slug)
  if (!product) {
    return null
  }
  const related = productsSeed
    .filter(
      (item) => item.categorySlug === product.categorySlug && item.slug !== slug,
    )
    .map((item, index) =>
      adaptProduct({
        ...item,
        _id: `seed_${item.slug}`,
        _creationTime: Date.now() - index * 1000,
      }),
    )
  const category = categoriesSeed.find(
    (item) => item.slug === product.categorySlug,
  )
  return {
    product: adaptProduct({
      ...product,
      _id: `seed_${product.slug}`,
      _creationTime: Date.now(),
    }),
    category: category ? adaptCategory(category) : undefined,
    related,
  }
}

export const fetchCategories = async (): Promise<StoreCategory[]> => {
  const client = getClient()
  if (!client) {
    return fallbackCategories()
  }

  try {
    const categories = (await client.query(
      api.products.listCategories,
      {},
    )) as RawCategory[]
    return categories.map(adaptCategory)
  } catch (error) {
    console.warn('Falling back to seed categories', error)
    return fallbackCategories()
  }
}

export const fetchProducts = async (options?: {
  categorySlug?: string
  limit?: number
}): Promise<StoreProduct[]> => {
  const client = getClient()
  if (!client) {
    const fallback = fallbackProducts(options?.categorySlug)
    return options?.limit ? fallback.slice(0, options.limit) : fallback
  }

  try {
    const products = (await client.query(api.products.listProducts, {
      categorySlug: options?.categorySlug,
      limit: options?.limit,
    })) as RawProduct[]
    return products.map(adaptProduct)
  } catch (error) {
    console.warn('Falling back to seed products', error)
    const fallback = fallbackProducts(options?.categorySlug)
    return options?.limit ? fallback.slice(0, options.limit) : fallback
  }
}

export const fetchProductDetail = async (
  slug: string,
): Promise<StoreProductDetail | null> => {
  const client = getClient()
  if (!client) {
    return fallbackProductDetail(slug)
  }

  try {
    const detail = (await client.query(api.products.getProductBySlug, {
      slug,
    })) as RawProductDetail | null
    if (!detail) {
      return fallbackProductDetail(slug)
    }
    return {
      product: adaptProduct(detail.product),
      category: detail.category ? adaptCategory(detail.category) : null,
      related: detail.related.map(adaptProduct),
    }
  } catch (error) {
    console.warn('Falling back to seed product detail', error)
    return fallbackProductDetail(slug)
  }
}


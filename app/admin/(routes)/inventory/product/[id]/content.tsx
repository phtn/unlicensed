'use client'

import {ProductForm} from '@/app/admin/(routes)/inventory/product/product-form'
import {ProductFormValues} from '@/app/admin/_components/product-schema'
import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {useQuery} from 'convex/react'
import {useRouter} from 'next/navigation'

interface EditProductContentProps {
  id: string
}

export const EditProductContent = ({id}: EditProductContentProps) => {
  const router = useRouter()
  const product = useQuery(
    api.products.q.getProductById,
    id
      ? {
          productId: id as Id<'products'>,
        }
      : 'skip',
  )
  const categories = useQuery(api.categories.q.listCategories)

  if (product === undefined) {
    return (
      <div className='flex items-center justify-center h-[calc(100vh-6rem)]'>
        <p className='text-neutral-500'>Loading product...</p>
      </div>
    )
  }

  if (product === null) {
    return (
      <div className='flex items-center justify-center h-[calc(100vh-6rem)]'>
        <p className='text-neutral-500'>Product not found</p>
      </div>
    )
  }

  // Convert product data to form values
  const initialValues: ProductFormValues = {
    name: product.name ?? '',
    slug: product.slug ?? '',
    categorySlug: product.categorySlug ?? '',
    shortDescription: product.shortDescription ?? '',
    description: product.description ?? '',
    priceCents: (product.priceCents ?? 0) / 100, // Convert from cents to dollars
    unit: product.unit ?? '',
    availableDenominationsRaw: product.availableDenominations?.join(', ') ?? '',
    popularDenomination: product.popularDenomination ?? [],
    thcPercentage: product.thcPercentage ?? 0,
    cbdPercentage: product.cbdPercentage?.toString() ?? '',
    effects: product.effects ?? [],
    terpenes: product.terpenes ?? [],
    flavors: product.flavorNotes ?? [],
    featured: product.featured ?? false,
    available: product.available ?? false,
    eligibleForRewards: product.eligibleForRewards ?? true,
    eligibleForDeals: product.eligibleForDeals ?? false,
    onSale: product.onSale ?? false,
    stock: product.stock ?? 0,
    stockByDenomination: product.stockByDenomination ?? {},
    rating: product.rating ?? 0,
    image: product.image ?? '',
    gallery: product.gallery ?? [],
    consumption: product.consumption ?? '',
    potencyLevel: product.potencyLevel ?? 'medium',
    potencyProfile: product.potencyProfile ?? '',
    lineage: product.lineage ?? '',
    noseRating: product.noseRating ?? 0,
    variants: product.variants?.map((v) => ({
      label: v.label,
      price: v.price / 100,
    })),
    priceByDenomination:
      product.priceByDenomination &&
      Object.keys(product.priceByDenomination).length > 0
        ? Object.fromEntries(
            Object.entries(product.priceByDenomination).map(([k, v]) => [
              k,
              Number(v) / 100,
            ]),
          )
        : product.variants?.length
          ? Object.fromEntries(
              product.variants.map((v) => {
                const match = v.label.match(/^(\d+\.?\d*)/)
                const key = match?.[1] ?? v.label
                return [key, (v.price ?? 0) / 100]
              }),
            )
          : {},
    tier: product.tier,
    eligibleForUpgrade: product.eligibleForUpgrade ?? false,
    upgradePrice:
      product.upgradePrice != null ? product.upgradePrice / 100 : undefined,
  }

  const handleUpdated = () => {
    // Navigate back to the product list after successful update
    router.push('/admin/inventory/product')
  }

  return (
    <ProductForm
      key={product._id}
      productId={product._id}
      categories={categories}
      initialValues={initialValues}
      onUpdated={handleUpdated}
    />
  )
}

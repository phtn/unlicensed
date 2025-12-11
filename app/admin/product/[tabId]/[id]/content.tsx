'use client'

import {ProductFormValues} from '@/app/admin/_components/product-schema'
import {ProductForm} from '@/app/admin/product/product-form'
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
    name: product.name,
    slug: product.slug,
    categorySlug: product.categorySlug,
    shortDescription: product.shortDescription,
    description: product.description,
    priceCents: product.priceCents / 100, // Convert from cents to dollars
    unit: product.unit,
    availableDenominationsRaw: product.availableDenominations?.join(', ') ?? '',
    popularDenomination: product.popularDenomination?.toString() ?? '',
    thcPercentage: product.thcPercentage,
    cbdPercentage: product.cbdPercentage?.toString() ?? '',
    effects: product.effects ?? [],
    terpenes: product.terpenes ?? [],
    flavors: product.flavorNotes ?? [],
    featured: product.featured,
    available: product.available,
    stock: product.stock,
    rating: product.rating,
    image: product.image,
    gallery: product.gallery ?? [],
    consumption: product.consumption,
    potencyLevel: product.potencyLevel,
    potencyProfile: product.potencyProfile ?? '',
    variants: product.variants?.map((v) => ({
      label: v.label,
      price: v.price / 100, // Convert from cents to dollars
    })),
  }

  const handleUpdated = () => {
    // Navigate back to the product list after successful update
    router.push('/admin/product')
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

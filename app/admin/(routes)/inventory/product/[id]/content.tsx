'use client'

import {ProductForm} from '@/app/admin/(routes)/inventory/product/product-form'
import {
  getProductBaseOptionsByCategory,
  getProductBrandOptionsByCategory,
  getProductTierOptionsByCategory,
  ProductFormValues,
  resolveAttributeValue,
  resolveAttributeValues,
} from '@/app/admin/(routes)/inventory/product/product-schema'
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

  const categoriesList = categories ?? []
  const selectedCat = categoriesList.find(
    (c) => c.slug === (product.categorySlug ?? ''),
  )
  const legacySelectedCat = selectedCat as
    | (typeof selectedCat & {
        productTypes?: {name: string; slug: string}[] | string[]
      })
    | undefined
  const selectedCatStrainTypes =
    selectedCat?.strainTypes ?? legacySelectedCat?.productTypes
  const tierOptions = getProductTierOptionsByCategory(
    product.categorySlug ?? '',
    categoriesList,
  )
  const baseOptions = getProductBaseOptionsByCategory(
    product.categorySlug ?? '',
    categoriesList,
  )
  const brandOptions = getProductBrandOptionsByCategory(
    product.categorySlug ?? '',
    categoriesList,
  )
  const subcategoryOptions =
    selectedCat?.subcategories?.length &&
    typeof selectedCat.subcategories[0] === 'object'
      ? (selectedCat.subcategories as {name: string; slug: string}[]).map(
          (e) => ({value: e.slug, label: e.name}),
        )
      : ((selectedCat?.subcategories as string[] | undefined)?.map((s) => ({
          value: s,
          label: s,
        })) ?? [])
  const strainTypeOptions =
    selectedCatStrainTypes?.length &&
    typeof selectedCatStrainTypes[0] === 'object'
      ? (selectedCatStrainTypes as {name: string; slug: string}[]).map((e) => ({
          value: e.slug,
          label: e.name,
        }))
      : ((selectedCatStrainTypes as string[] | undefined)?.map((s) => ({
          value: s,
          label: s,
        })) ?? [])

  // Convert product data to form values (resolve tier/base/brand to slug when category uses attribute entries)
  const initialValues: ProductFormValues = {
    name: product.name ?? '',
    slug: product.slug ?? '',
    base:
      resolveAttributeValue(product.base ?? '', baseOptions) ??
      product.base ??
      '',
    categorySlug: product.categorySlug ?? '',
    brand: resolveAttributeValues(product.brand ?? [], brandOptions),
    shortDescription: product.shortDescription ?? '',
    description: product.description ?? '',
    priceCents: (product.priceCents ?? 0) / 100, // Convert from cents to dollars
    batchId: product.batchId ?? '',
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
    inventoryMode: product.inventoryMode ?? 'by_denomination',
    stock: product.stock ?? 0,
    masterStockQuantity: product.masterStockQuantity,
    masterStockUnit: product.masterStockUnit ?? '',
    lowStockThreshold: product.lowStockThreshold?.toString() ?? '',
    stockByDenomination: product.stockByDenomination ?? {},
    rating: product.rating ?? 0,
    image: product.image ?? '',
    gallery: product.gallery ?? [],
    consumption: product.consumption ?? '',
    potencyLevel: product.potencyLevel ?? 'medium',
    potencyProfile: product.potencyProfile ?? '',
    lineage: product.lineage ?? '',
    subcategory:
      resolveAttributeValue(product.subcategory ?? '', subcategoryOptions) ??
      product.subcategory ??
      '',
    productType: product.productType ?? '',
    strainType:
      resolveAttributeValue(product.strainType ?? '', strainTypeOptions) ??
      product.strainType ??
      '',
    noseRating: product.noseRating ?? 0,
    netWeight: product.netWeight?.toString() ?? '',
    netWeightUnit: product.netWeightUnit ?? '',
    packagingMode: product.packagingMode,
    stockUnit: product.stockUnit ?? '',
    packSize: product.packSize?.toString() ?? '',
    startingWeight: product.startingWeight?.toString() ?? '',
    remainingWeight: product.remainingWeight?.toString() ?? '',
    variants: product.variants?.map((v: {label: string; price: number}) => ({
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
              product.variants.map((v: {label: string; price: number}) => {
                const match = v.label.match(/^(\d+\.?\d*)/)
                const key = match?.[1] ?? v.label
                return [key, (v.price ?? 0) / 100]
              }),
            )
          : {},
    tier:
      resolveAttributeValue(product.tier ?? '', tierOptions) ??
      product.tier ??
      undefined,
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
      product={product}
      productId={product._id}
      categories={categories}
      initialValues={initialValues}
      onUpdated={handleUpdated}
    />
  )
}

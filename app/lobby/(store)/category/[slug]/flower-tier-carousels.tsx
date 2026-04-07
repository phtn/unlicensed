'use client'

import {StoreProduct} from '@/app/types'
import {ProductCarousel} from '@/components/store/product-carousel'
import {api} from '@/convex/_generated/api'
import {adaptProduct, type RawCategory} from '@/lib/convexClient'
import {usePaginatedQuery} from 'convex/react'
import {useMemo} from 'react'

const TIER_CAROUSEL_PAGE_SIZE = 20

interface TierCarouselSectionProps {
  categorySlug: string
  tierSlug: string
  tierName: string
  category?: RawCategory | null
  brand?: string
}

const TierCarouselSection = ({
  categorySlug,
  tierSlug,
  tierName,
  category,
  brand,
}: TierCarouselSectionProps) => {
  const {results, status} = usePaginatedQuery(
    api.products.q.listCategoryProductsPaginated,
    {categorySlug, tier: tierSlug, brand: brand || undefined},
    {initialNumItems: TIER_CAROUSEL_PAGE_SIZE},
  )

  const products = useMemo(
    () => results.map((product) => adaptProduct(product, category)),
    [results, category],
  )

  if (status === 'LoadingFirstPage' || products.length === 0) {
    return null
  }

  return (
    <div className='space-y-3'>
      <h3 className='font-clash font-bold text-xl md:text-2xl uppercase tracking-tight'>
        {tierName}
      </h3>
      <ProductCarousel products={products} productCount={products.length} />
    </div>
  )
}

interface FlowerTierCarouselsProps {
  slug: string
  category?: RawCategory | null
  brand?: string
  initialProducts: StoreProduct[]
}

export const FlowerTierCarousels = ({
  slug,
  category,
  brand,
}: FlowerTierCarouselsProps) => {
  const tiers = category?.tiers ?? []

  if (tiers.length === 0) {
    return null
  }

  return (
    <section className='px-4 sm:px-6 py-8 sm:py-12'>
      <div className='max-w-7xl mx-auto flex flex-col gap-12'>
        {tiers.map((tier) => (
          <TierCarouselSection
            key={tier.slug}
            categorySlug={slug}
            tierSlug={tier.slug ?? ''}
            tierName={tier.name ?? ''}
            category={category}
            brand={brand}
          />
        ))}
      </div>
    </section>
  )
}

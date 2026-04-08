'use client'

import {StoreProduct} from '@/app/types'
import {ProductCarousel} from '@/components/store/product-carousel'
import {api} from '@/convex/_generated/api'
import {adaptProduct, type RawCategory} from '@/lib/convexClient'
import {usePaginatedQuery, useQuery} from 'convex/react'
import {useMemo} from 'react'

const TIER_CAROUSEL_PAGE_SIZE = 20

interface TierCarouselSectionProps {
  categorySlug: string
  tierSlug: string
  tierName: string
  count?: number
  category?: RawCategory | null
  brand?: string
}

const TierCarouselSection = ({
  categorySlug,
  tierSlug,
  tierName,
  count,
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
      <h3 className='font-clash font-bold text-xl md:text-2xl uppercase tracking-tight flex items-baseline gap-2'>
        {tierName}
        {count !== undefined && (
          <span className='text-sm font-medium font-clash opacity-40 normal-case tracking-normal'>
            {count} {count === 1 ? 'product' : 'products'}
          </span>
        )}
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

  const tierSlugs = useMemo(
    () => tiers.map((t) => t.slug ?? '').filter(Boolean),
    [tiers],
  )

  const counts = useQuery(
    api.products.q.countCategoryProductsByTiers,
    tierSlugs.length > 0
      ? {categorySlug: slug, tierSlugs, brand: brand || undefined}
      : 'skip',
  )

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
            count={counts?.[tier.slug ?? '']}
            category={category}
            brand={brand}
          />
        ))}
      </div>
    </section>
  )
}

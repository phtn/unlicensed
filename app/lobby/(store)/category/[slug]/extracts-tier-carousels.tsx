'use client'

import {StoreProduct} from '@/app/types'
import {ProductCarousel} from '@/components/store/product-carousel'
import {api} from '@/convex/_generated/api'
import {adaptProduct, type RawCategory} from '@/lib/convexClient'
import {usePaginatedQuery, useQuery} from 'convex/react'
import {Activity, useMemo} from 'react'

const TIER_CAROUSEL_PAGE_SIZE = 20

interface TierCarouselSectionProps {
  categorySlug: string
  tierSlug: string
  tierName: string
  count?: number
  category?: RawCategory | null
  brand?: string
}

const tierDescription: Record<string, string> = {
  a: 'Everyday-value flower, typically entry-level greenhouse',
  aa: 'Greenhouse and mixed-light flower with improved aroma, structure, and consistency.',
  aaa: 'Licensed indoor flower with strong terpene expression, trim quality, and bag appeal.',
  aaaa: 'Premium licensed indoor flower selected for potency, freshness, structure, and finish.',
  rare: 'Limited, exclusive  small-batch drops from boutique farms and elite breeders, bulk-sourced and packed fresh for premium value.',
  'rare-jars':
    'Factory-sealed branded eighth jars from elite California cultivators and breeders.',
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
      <div className='flex items-center justify-between w-full'>
        <h3 className='flex items-center font-bone font-bold text-xl md:text-2xl uppercase tracking-widest gap-5'>
          {tierName}
          <Activity mode={count === undefined ? 'hidden' : 'visible'}>
            <span className='flex items-center text-base md:text-lg uppercase tracking-[0.15em] text-color-muted transition-opacity hover:opacity-70'>
              <span className='text-foreground/20 font-ios font-thin text-3xl'>
                (
              </span>
              <span className='font-clash text-light-brand'>{count}</span>
              <span className='text-foreground/20 font-ios font-thin text-3xl'>
                )
              </span>
            </span>
          </Activity>
          <span className='font-clash font-medium text-base opacity-80 normal-case tracking-normal'>
            {tierDescription[tierSlug]}
          </span>
        </h3>
      </div>
      <ProductCarousel products={products} productCount={products.length} />
    </div>
  )
}

interface ExtractsTierCarouselsProps {
  slug: string
  category?: RawCategory | null
  brand?: string
  initialProducts: StoreProduct[]
}

export const ExtractsTierCarousels = ({
  slug,
  category,
  brand,
}: ExtractsTierCarouselsProps) => {
  const tiers = useMemo(() => category?.tiers ?? [], [category])

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

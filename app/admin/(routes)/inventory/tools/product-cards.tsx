'use client'

import type {StoreProduct} from '@/app/types'
import {ProductCard} from '@/components/store/product-card'
import {ProductCardGlass} from '@/components/store/product-card-glass'
import {ProductCardGlassRound} from '@/components/store/product-card-glass-round'
import {ProductCardTest} from '@/components/store/product-card-test'
import {api} from '@/convex/_generated/api'
import {adaptProduct} from '@/lib/convexClient'
import {cn} from '@/lib/utils'
import {useQuery} from 'convex/react'
import {type ReactNode, useMemo, useState} from 'react'

const RECOVERY_COMMIT = 'ee9f509'
const STUDIO_FALLBACK_IMAGE = '/blade_alpha.jpg'

const FALLBACK_PRODUCT: StoreProduct = {
  slug: 'studio-neon-biscotti',
  name: 'Neon Biscotti',
  categorySlug: 'flower',
  shortDescription: 'Studio fallback product for product card previews.',
  description: 'Studio fallback product for product card previews.',
  priceCents: 11000,
  unit: 'g',
  availableDenominations: [0.5, 1, 3.5, 7],
  popularDenomination: [3.5],
  thcPercentage: 27,
  effects: ['uplifted', 'relaxed'],
  terpenes: ['myrcene', 'limonene'],
  featured: false,
  limited: false,
  onSale: true,
  available: true,
  stock: 24,
  priceByDenomination: {
    '0.5': 2200,
    '1': 3900,
    '3.5': 11000,
    '7': 20500,
  },
  salePriceByDenomination: {
    '3.5': 9900,
  },
  rating: 4.8,
  image: STUDIO_FALLBACK_IMAGE,
  gallery: [STUDIO_FALLBACK_IMAGE],
  consumption: 'Smoke',
  flavorNotes: ['citrus', 'cream'],
  potencyLevel: 'high',
  productType: 'Flower',
  productTier: 'top-shelf',
  productTierLabel: 'Top Shelf',
  subcategory: 'hybrid',
  brand: ['Rapid Fire'],
  netWeight: 3.5,
  netWeightUnit: 'g',
  packSize: 1,
}

const isRenderableImageSrc = (value: string | null | undefined) =>
  typeof value === 'string' &&
  (value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('/') ||
    value.startsWith('data:') ||
    value.startsWith('blob:'))

const SourcePill = ({
  tone = 'default',
  children,
}: {
  tone?: 'default' | 'current' | 'recovered'
  children: ReactNode
}) => (
  <span
    className={cn(
      'inline-flex items-center rounded-full border px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.18em]',
      tone === 'current' &&
        'border-emerald-400/35 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300',
      tone === 'recovered' &&
        'border-orange-300/35 bg-orange-500/12 text-orange-700 dark:text-orange-300',
      tone === 'default' &&
        'border-foreground/10 bg-foreground/4 text-muted-foreground',
    )}>
    {children}
  </span>
)

const StudioPanel = ({
  badge,
  children,
  title,
}: {
  badge: ReactNode
  children: ReactNode
  description: string
  source: string
  title: string
}) => (
  <section className='overflow-hidden rounded-3xl border border-foreground/10 bg-background/90 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-sm'>
    <div className='border-b border-foreground/10 p-5'>
      <div className='flex items-start justify-between gap-3'>
        <div className='space-y-2'>
          <p className='font-clash text-xl leading-none'>{title}</p>
        </div>
        {badge}
      </div>
    </div>

    <div className='overflow-x-auto p-5'>
      <div className='flex min-h-112 min-w-[18rem] items-center justify-center bg-background/50 px-4 py-6 dark:bg-black/10'>
        {children}
      </div>
    </div>
  </section>
)

export const ProductCards = () => {
  const liveProducts = useQuery(api.products.q.listProducts, {
    limit: 18,
    availableOnly: true,
  })
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)

  const studioProducts = useMemo(
    () => (liveProducts ?? []).map((product) => adaptProduct(product)),
    [liveProducts],
  )

  const selectedProduct = useMemo(() => {
    if (studioProducts.length === 0) {
      return FALLBACK_PRODUCT
    }

    return (
      studioProducts.find((product) => product.slug === selectedSlug) ??
      studioProducts[0]
    )
  }, [selectedSlug, studioProducts])

  const resolvedImageUrl = useMemo(
    (): string =>
      selectedProduct.image && isRenderableImageSrc(selectedProduct.image)
        ? selectedProduct.image
        : STUDIO_FALLBACK_IMAGE,
    [selectedProduct.image],
  )

  const previewProduct = useMemo(
    (): StoreProduct => ({
      ...selectedProduct,
      image: resolvedImageUrl,
      gallery:
        selectedProduct.gallery.length > 0
          ? selectedProduct.gallery
          : [resolvedImageUrl],
    }),
    [resolvedImageUrl, selectedProduct],
  )

  return (
    <div className='flex min-h-0 flex-1 flex-col gap-6 pb-6'>
      <section className='overflow-hidden p-4'>
        <div className='flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between'>
          <div className='space-y-3'>Product Cards Studio</div>
        </div>

        <div className='mt-5 flex flex-wrap gap-2'>
          {(studioProducts.length > 0 ? studioProducts : [FALLBACK_PRODUCT])
            .slice(0, 12)
            .map((product) => {
              const isSelected = selectedProduct.slug === product.slug

              return (
                <button
                  key={product.slug}
                  type='button'
                  onClick={() => {
                    setSelectedSlug(product.slug)
                  }}
                  className={cn(
                    'rounded-sm border px-3 py-2 text-left transition-colors',
                    'border-foreground/10 bg-background/70 hover:border-foreground/20 hover:bg-background',
                    isSelected &&
                      'border-emerald-500/45 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
                  )}>
                  <p className='font-okxs text-[8px] uppercase tracking-[0.18em] opacity-70'>
                    {product.categorySlug || 'studio'}
                  </p>
                  <p className='font-clash text-sm leading-none'>
                    {product.name}
                  </p>
                </button>
              )
            })}
        </div>
      </section>

      <div className='grid gap-6 xl:grid-cols-4'>
        <StudioPanel
          title='Solid 2D'
          description='The live storefront card that is currently used across the lobby product grids and carousels.'
          source='components/store/product-card.tsx'
          badge={<SourcePill tone='current'>Current</SourcePill>}>
          <ProductCard product={previewProduct} imageUrl={resolvedImageUrl} />
        </StudioPanel>

        <StudioPanel
          title='Tinted'
          description='Recovered from the historical glass-card file. Frosted shell, glossy highlights, and lighter chrome treatment.'
          source={`Recovered from components/store/product-card-glass.tsx @ ${RECOVERY_COMMIT}`}
          badge={<SourcePill tone='recovered'>NEW</SourcePill>}>
          <ProductCardGlass
            product={previewProduct}
            imageUrl={resolvedImageUrl}
          />
        </StudioPanel>

        <StudioPanel
          title='South Beach'
          description='Recovered from the temporary test-treatment branch, then cleaned up into a real storefront-ready card variant.'
          source={`Recovered from components/store/product-card.tsx test styling @ ${RECOVERY_COMMIT}`}
          badge={<SourcePill tone='recovered'>NEW</SourcePill>}>
          <ProductCardTest
            product={previewProduct}
            imageUrl={resolvedImageUrl}
          />
        </StudioPanel>
        <StudioPanel
          title='Glass'
          description='Recovered from the temporary test-treatment branch, then cleaned up into a real storefront-ready card variant.'
          source={`Recovered from components/store/product-card.tsx test styling @ ${RECOVERY_COMMIT}`}
          badge={<SourcePill tone='recovered'>NEW</SourcePill>}>
          <ProductCardGlassRound
            product={previewProduct}
            imageUrl={resolvedImageUrl}
          />
        </StudioPanel>
      </div>
    </div>
  )
}

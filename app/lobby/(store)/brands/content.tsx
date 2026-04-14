'use client'

import {Products} from '@/app/lobby/(store)/category/[slug]/products'
import {Tag} from '@/components/base44/tag'
import {Title} from '@/components/base44/title'
import {api} from '@/convex/_generated/api'
import {adaptProduct} from '@/lib/convexClient'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Button} from '@heroui/react'
import {usePaginatedQuery, useQuery} from 'convex/react'
import Link from 'next/link'
import {
  Activity,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {type IEnhancedBrand, brands} from './all-brands'

const BRAND_PRODUCTS_PAGE_SIZE = 20
const BRAND_SLUGS = brands.map((brand) => brand.slug)

const formatProductCount = (count: number) =>
  `${count} ${count === 1 ? 'product' : 'products'}`

interface BrandCardProps {
  brand: IEnhancedBrand
  isCountLoading: boolean
  isSelected: boolean
  onSelect: (brandSlug: string) => void
}

const BrandCard = ({
  brand,
  isCountLoading,
  isSelected,
  onSelect,
}: BrandCardProps) => (
  <button
    type='button'
    onClick={() => onSelect(brand.slug)}
    aria-pressed={isSelected}
    aria-label={`Browse ${brand.name}`}
    className={cn(
      'group relative isolate min-h-28 overflow-hidden rounded-xs border text-left transition-all duration-300',
      'border-foreground/10 bg-[#141414] text-white shadow-sm hover:-translate-y-0.5 hover:border-brand/60 hover:shadow-xl',
      'dark:border-white/10 dark:bg-white dark:text-dark-table dark:hover:border-brand',
      isSelected &&
        'border-brand shadow-xl shadow-brand/10 dark:border-brand dark:shadow-brand/15',
    )}>
    <div className='absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_38%),linear-gradient(135deg,rgba(255,255,255,0.08),transparent_55%)] opacity-70 transition-opacity duration-300 group-hover:opacity-100 dark:bg-[radial-gradient(circle_at_top_right,rgba(0,0,0,0.16),transparent_40%),linear-gradient(135deg,rgba(0,0,0,0.05),transparent_55%)]' />
    <div className='flex h-full flex-col justify-between p-5 sm:p-6'>
      <div className='flex items-center justify-between gap-4'>
        <Icon
          name={brand.icon}
          className='size-18 opacity-95 transition-transform duration-300 group-hover:scale-105 sm:size-24'
        />
        <span className='font-okxs text-sm text-white/60 dark:text-dark-table/60'>
          {isCountLoading
            ? 'Counting products'
            : formatProductCount(brand.productCount)}
        </span>
      </div>

      <div className='hidden space-y-3'>
        <div>
          <h3 className='font-clash text-xl font-semibold tracking-tight sm:text-2xl'>
            {brand.name}
          </h3>
          {brand.description && (
            <p className='mt-1 line-clamp-2 max-w-xs text-xs leading-relaxed text-white/55 dark:text-dark-table/60'>
              {brand.description}
            </p>
          )}
        </div>
      </div>
    </div>
  </button>
)

interface SelectedBrandPanelProps {
  brand: IEnhancedBrand
  isCountLoading: boolean
  onClear: VoidFunction
  onViewProducts: VoidFunction
}

const SelectedBrandPanel = ({
  brand,
  isCountLoading,
  onClear,
  onViewProducts,
}: SelectedBrandPanelProps) => (
  <section className='px-4 pb-4 sm:px-6 sm:pb-8'>
    <div className='mx-auto max-w-7xl'>
      <div className='relative overflow-hidden rounded-xs border border-foreground/10 bg-sidebar/60 p-5 shadow-sm dark:border-white/10 dark:bg-dark-table/60 sm:p-7'>
        <div className='absolute right-0 top-0 h-48 w-48 translate-x-12 -translate-y-16 rounded-full bg-brand/10 blur-3xl' />
        <div className='relative z-10 grid gap-6 md:grid-cols-[auto_1fr_auto] md:items-center'>
          <div className='flex size-24 items-center justify-center rounded-xs bg-foreground text-white dark:bg-white dark:text-dark-table sm:size-28'>
            <Icon name={brand.icon} className='size-18 sm:size-22' />
          </div>
          <div className='space-y-2'>
            <Tag text='Selected Brand' />
            <h2 className='font-clash text-4xl font-semibold tracking-tight sm:text-5xl'>
              {brand.name}
            </h2>
            <p className='max-w-2xl text-sm leading-relaxed text-foreground/60 dark:text-white/60 sm:text-base'>
              {brand.description ??
                'Browse this partner collection using the same product grid as categories.'}
            </p>
            <p className='font-okxs text-sm uppercase tracking-[0.22em] text-light-brand'>
              {isCountLoading
                ? 'Counting products'
                : formatProductCount(brand.productCount)}
            </p>
          </div>
          <div className='flex flex-wrap items-center gap-3 md:justify-end'>
            <Button
              size='md'
              onPress={onViewProducts}
              className='rounded-xs bg-foreground px-5 py-3 font-clash text-sm font-medium text-white transition-colors hover:bg-brand dark:bg-white dark:text-dark-table dark:hover:bg-brand dark:hover:text-white'>
              View all products
            </Button>
            <Button
              size='md'
              variant='tertiary'
              onPress={onClear}
              className='rounded-xs border border-foreground/10 bg-background/70 font-clash dark:border-white/10 dark:bg-background/20'>
              Clear
            </Button>
          </div>
        </div>
      </div>
    </div>
  </section>
)

interface BrandProductsSectionProps {
  brand: IEnhancedBrand
}

const BrandProductsSection = ({brand}: BrandProductsSectionProps) => {
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const {
    results,
    status,
    loadMore: loadMoreProducts,
  } = usePaginatedQuery(
    api.products.q.listBrandProductsPaginated,
    {availableOnly: true, brand: brand.slug},
    {initialNumItems: BRAND_PRODUCTS_PAGE_SIZE},
  )

  const products = useMemo(
    () => results.map((product) => adaptProduct(product)),
    [results],
  )

  const canLoadMoreProducts = status === 'CanLoadMore'
  const isLoadingMoreProducts = status === 'LoadingMore'
  const isLoadingInitialProducts =
    status === 'LoadingFirstPage' && products.length === 0
  const isRefreshingProducts =
    status === 'LoadingFirstPage' && products.length > 0

  useEffect(() => {
    if (!canLoadMoreProducts) return

    const currentTarget = loadMoreRef.current
    if (!currentTarget) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadMoreProducts(BRAND_PRODUCTS_PAGE_SIZE)
        }
      },
      {rootMargin: '640px 0px'},
    )

    observer.observe(currentTarget)

    return () => {
      observer.disconnect()
    }
  }, [canLoadMoreProducts, loadMoreProducts])

  return (
    <div id='brand-products' className='scroll-mt-24'>
      <Products
        products={products}
        isLoading={isLoadingInitialProducts}
        isRefreshing={isRefreshingProducts}
        footer={
          (canLoadMoreProducts || isLoadingMoreProducts) && (
            <div className='flex h-96 justify-center pt-6'>
              <div
                ref={loadMoreRef}
                aria-hidden
                className='flex h-10 w-full items-center justify-center'>
                <Icon
                  name='spinners-ring'
                  className={cn(
                    'size-4 transition-opacity',
                    isLoadingMoreProducts ? 'opacity-60' : 'opacity-25',
                  )}
                />
              </div>
            </div>
          )
        }
      />
    </div>
  )
}

export const Content = () => {
  const [selectedBrandId, setSelectedBrandId] = useState('')
  const brandCounts = useQuery(api.products.q.countProductsByBrands, {
    availableOnly: true,
    brandSlugs: BRAND_SLUGS,
  })
  const isCountLoading = brandCounts === undefined

  const enhancedBrands = useMemo<IEnhancedBrand[]>(() => {
    return brands.map((brand) => ({
      ...brand,
      productCount: brandCounts?.[brand.slug] ?? 0,
    }))
  }, [brandCounts])

  const selectedBrand =
    enhancedBrands.find((brand) => brand.slug === selectedBrandId) ?? null
  const featuredBrands = useMemo(
    () => enhancedBrands.filter((brand) => brand.featured),
    [enhancedBrands],
  )
  const activeBrandCount = enhancedBrands.filter(
    (brand) => brand.productCount > 0,
  ).length
  const totalProductCount = enhancedBrands.reduce(
    (total, brand) => total + brand.productCount,
    0,
  )

  const scrollToBrandProducts = useCallback(() => {
    window.requestAnimationFrame(() => {
      document.getElementById('brand-products')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    })
  }, [])

  const toggleBrand = useCallback(
    (brandSlug: string) => {
      const nextBrandSlug = selectedBrandId === brandSlug ? '' : brandSlug

      setSelectedBrandId(nextBrandSlug)

      if (nextBrandSlug) {
        scrollToBrandProducts()
      }
    },
    [scrollToBrandProducts, selectedBrandId],
  )

  const clearBrand = useCallback(() => {
    setSelectedBrandId('')
  }, [])

  return (
    <div className='min-h-screen overflow-x-hidden bg-background pb-16 pt-16 sm:pt-20 md:pt-24 lg:pt-28'>
      <section className='relative px-4 pb-8 sm:px-6 sm:pb-12'>
        <div className='mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-end'>
          <div className='space-y-6'>
            <Tag text='Brands' />
            <Title title='Brand Wall' subtitle='Browse by maker' />
            <p className='max-w-2xl text-sm leading-relaxed text-foreground/60 dark:text-white/60 sm:text-base'>
              Pick a partner, then shop its live product shelf with the same
              grid, loading states, and pagination used across category pages.
            </p>
            <div className='grid max-w-lg grid-cols-2 gap-3 sm:grid-cols-3'>
              <div className='rounded-xs border border-foreground/10 bg-sidebar/50 p-4 dark:border-white/10 dark:bg-dark-table/50'>
                <div className='font-clash text-3xl font-semibold'>
                  {isCountLoading ? '...' : activeBrandCount}
                </div>
                <div className='font-okxs text-xs uppercase tracking-[0.2em] text-foreground/50'>
                  Active brands
                </div>
              </div>
              <div className='rounded-xs border border-foreground/10 bg-sidebar/50 p-4 dark:border-white/10 dark:bg-dark-table/50'>
                <div className='font-clash text-3xl font-semibold'>
                  {isCountLoading ? '...' : totalProductCount}
                </div>
                <div className='font-okxs text-xs uppercase tracking-[0.2em] text-foreground/50'>
                  Products
                </div>
              </div>
              <Link
                href='/lobby/products'
                className='col-span-2 flex items-center justify-between rounded-xs bg-foreground p-4 font-clash text-white transition-colors hover:bg-brand dark:bg-white dark:text-dark-table dark:hover:bg-brand dark:hover:text-white sm:col-span-1'>
                <span>Search all</span>
                <Icon name='arrow-right' className='size-4' />
              </Link>
            </div>
          </div>

          <div className='rounded-xs border border-foreground/10 bg-[#111] p-4 text-white shadow-sm dark:border-white/10 dark:bg-white dark:text-dark-table sm:p-5'>
            <div className='mb-4 flex items-center justify-between'>
              <span className='font-okxs text-xs uppercase tracking-[0.24em] opacity-60'>
                Featured
              </span>
              <span className='text-xs opacity-50'>
                {featuredBrands.length} partners
              </span>
            </div>
            <div className='grid grid-cols-2 gap-3'>
              {featuredBrands.map((brand) => (
                <button
                  key={brand.slug}
                  type='button'
                  onClick={() => toggleBrand(brand.slug)}
                  className={cn(
                    'group flex min-h-32 flex-col justify-between rounded-xs border border-white/10 bg-white/5 p-4 text-left transition-colors hover:border-brand/70 hover:bg-white/10',
                    'dark:border-dark-table/10 dark:bg-dark-table/4 dark:hover:bg-dark-table/8',
                    selectedBrandId === brand.slug && 'border-brand',
                  )}>
                  <Icon name={brand.icon} className='size-16' />
                  <div>
                    <div className='font-clash text-lg font-semibold'>
                      {brand.name}
                    </div>
                    <div className='font-okxs text-xs uppercase tracking-[0.16em] opacity-55'>
                      {isCountLoading
                        ? 'Counting'
                        : formatProductCount(brand.productCount)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className='px-4 py-8 sm:px-6 sm:py-10'>
        <div className='mx-auto max-w-7xl'>
          <div className='mb-6 flex flex-col gap-2 sm:mb-8 sm:flex-row sm:items-end sm:justify-between'>
            <div>
              <h2 className='font-clash text-2xl font-semibold tracking-tight sm:text-3xl'>
                All Brands
              </h2>
              <p className='text-sm text-foreground/55 dark:text-white/55'>
                Select a brand to load its available products.
              </p>
            </div>
            {selectedBrand && (
              <a
                href='#brand-products'
                className='font-okxs text-xs uppercase tracking-[0.22em] text-light-brand'>
                Jump to products
              </a>
            )}
          </div>

          <Activity mode={enhancedBrands.length === 0 ? 'visible' : 'hidden'}>
            <div className='flex flex-col items-center justify-center gap-4 px-6 py-24 text-center'>
              <Title
                titleStyle='lowercase'
                title='Nothing here yet.'
                subtitle={
                  <div className='flex items-center relative'>
                    <Icon
                      name='chevron-double-left'
                      className='rotate-90 size-12 text-featured opacity-100 relative z-30'
                    />
                    <span>check back soon</span>
                  </div>
                }
              />
            </div>
          </Activity>

          <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
            {enhancedBrands.map((brand) => (
              <BrandCard
                key={brand.slug}
                brand={brand}
                isCountLoading={isCountLoading}
                isSelected={selectedBrandId === brand.slug}
                onSelect={toggleBrand}
              />
            ))}
          </div>
        </div>
      </section>
      {selectedBrand && (
        <SelectedBrandPanel
          brand={selectedBrand}
          isCountLoading={isCountLoading}
          onClear={clearBrand}
          onViewProducts={scrollToBrandProducts}
        />
      )}
      {selectedBrand ? (
        <BrandProductsSection key={selectedBrand.slug} brand={selectedBrand} />
      ) : (
        <section className='px-4 py-8 sm:px-6 sm:py-12'>
          <div className='mx-auto max-w-7xl rounded-xs border border-dashed border-foreground/15 bg-sidebar/30 p-8 text-center dark:border-white/10 dark:bg-dark-table/30'>
            <p className='font-clash text-2xl font-semibold tracking-tight'>
              Choose a brand to browse its product shelf.
            </p>
            <p className='mx-auto mt-2 max-w-xl text-sm text-foreground/55 dark:text-white/55'>
              Product cards will load below with the same layout used on
              category pages, including infinite loading.
            </p>
          </div>
        </section>
      )}

      <section className='px-4 py-12 sm:px-6 sm:py-16 lg:py-20'>
        <div className='mx-auto max-w-4xl text-center'>
          <div className='border border-foreground/10 bg-sidebar/40 p-8 dark:border-dark-gray/50 dark:bg-sidebar sm:p-12 lg:p-16'>
            <h2 className='mb-4 font-clash text-xl font-bold sm:mb-6 sm:text-3xl lg:text-4xl'>
              Looking for something specific?
            </h2>
            <p className='mx-auto mb-6 max-w-2xl text-sm opacity-70 sm:mb-8 sm:text-base lg:text-lg'>
              Try search, deals, or browse the full lobby when brand is not the
              only filter that matters.
            </p>
            <div className='flex flex-col items-center justify-center gap-4 sm:flex-row'>
              <Link
                prefetch
                href='/lobby'
                className='w-full bg-brand px-6 py-3 font-polysans text-base font-medium text-white sm:w-auto sm:px-12 sm:py-4'>
                Shop
              </Link>
              <Link
                prefetch
                href='/lobby/products'
                className='w-full bg-dark-table px-6 py-3 font-clash text-base font-medium text-white dark:bg-black sm:w-auto sm:px-8'>
                <span className='inline-flex items-center gap-2'>
                  <Icon name='search' className='size-4' />
                  Search
                </span>
              </Link>
              <Link
                prefetch
                href='/lobby/deals'
                className='w-full bg-terpenes px-6 py-3 font-clash text-base font-medium text-white sm:w-auto sm:px-8 sm:py-4'>
                <span className='inline-flex items-center gap-2'>
                  <Icon name='box-bold' className='size-4 text-white' />
                  Find Deals
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

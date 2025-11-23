'use client'
import type {StoreCategory, StoreProduct} from '@/app/types'
import {NewHome} from '@/components/base44/home'
import {QuickScroll} from '@/components/base44/quick-scroll'
import {Footer} from '@/components/ui/footer'
import {api} from '@/convex/_generated/api'
import {useMobile} from '@/hooks/use-mobile'
import {adaptCategory, adaptProduct} from '@/lib/convexClient'
import {useQuery} from 'convex/react'
import {useMemo} from 'react'
import {Brands} from './brands'
import {FullCollection} from './collection'
import {FeaturedProducts} from './featured'
import {StrainFinderMini} from './strain-finder'

interface StorefrontPageProps {
  initialCategories: StoreCategory[]
  initialProducts: StoreProduct[]
}

export const Content = ({
  initialCategories,
  initialProducts,
}: StorefrontPageProps) => {
  const categoriesQuery = useQuery(api.categories.q.listCategories, {})
  const productsQuery = useQuery(api.products.q.listProducts, {})
  const categories = useMemo(
    () => categoriesQuery?.map(adaptCategory) ?? initialCategories,
    [categoriesQuery, initialCategories],
  )
  const products = useMemo(
    () => productsQuery?.map(adaptProduct) ?? initialProducts,
    [productsQuery, initialProducts],
  )
  const isMobile = useMobile()
  const featuredProducts = useMemo(
    () => products.filter((item) => item.featured).slice(0, 4),
    [products],
  )

  return (
    <div className='space-y-24 bg-background'>
      <NewHome />
      {/*<section className='mx-auto w-full max-w-6xl px-4 pt-14 sm:px-6 lg:px-8'>
        <div className='relative overflow-hidden rounded-[44px] surface-hero p-8 transition-colors sm:p-12 lg:p-16'>
          <div
            className='pointer-events-none absolute -left-24 top-[-40%] h-[520px] w-[520px] rounded-full opacity-70'
            style={{background: 'var(--surface-hero-glow-left)'}}
          />
          <div
            className='pointer-events-none absolute right-[-18%] top-[-30%] h-[520px] w-[520px] rotate-12 opacity-80'
            style={{background: 'var(--surface-hero-glow-right)'}}
          />
          <div
            className='pointer-events-none absolute inset-x-0 bottom-0 h-2/5'
            style={{background: 'var(--surface-hero-bottom)'}}
          />
          <div className='relative grid gap-14 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center'>
            <div className='flex flex-col gap-10'>
              <div className='space-y-7'>
                <span className='inline-block text-xl font-semibold italic text-[#f5c468] sm:text-xl'>
                  Curated
                </span>
                <h1 className='text-balance text-4xl tracking-tight font-semibold leading-[1.05] text-foreground sm:text-6xl lg:text-7xl'>
                  <span className='block hero-gradient-text font-extrabold'>
                    Elevated:
                  </span>
                  <span className='block hero-gradient-text font-bold'>
                    For Modern Evenings
                  </span>
                </h1>
                <p className='max-w-2xl text-base text-color-muted sm:text-lg'>
                  Hyper-seasonal releases, terpene-rich cultivars, chef-crafted
                  edibles, and sparkling infusions—all sourced from boutique
                  growers and makers we know by name.
                </p>
              </div>
              <div className='flex flex-wrap items-center gap-4'>
                <Button
                  as={NextLink}
                  href='#menu'
                  radius='full'
                  size='lg'
                  className='cta-button px-8 py-6 text-lg font-semibold shadow-[0_20px_60px_-26px_rgba(245,166,65,0.7)] transition hover:brightness-110'>
                  Shop Featured Drops
                </Button>
                <Button
                  as={NextLink}
                  href='#finder'
                  radius='full'
                  size='lg'
                  variant='flat'
                  className='border border-(--surface-outline) bg-(--surface-highlight) px-8 py-6 text-lg font-semibold text-foreground shadow-[0_20px_60px_-30px_rgba(8,12,26,0.55)] transition hover:bg-[var(--surface-muted)]'>
                  Launch Strain Finder
                </Button>
              </div>
              <dl className='grid gap-5 sm:grid-cols-3'>
                {metrics.map((metric) => (
                  <div
                    key={metric.label}
                    className='surface-card rounded-3xl p-5 text-center'>
                    <dd className='text-3xl font-semibold text-foreground sm:text-4xl'>
                      {metric.value}
                    </dd>
                    <dt className='mt-2 text-[11px] uppercase tracking-[0.45em] text-color-muted'>
                      {metric.label}
                    </dt>
                  </div>
                ))}
              </dl>
            </div>
            {heroProduct ? (
              <div className='relative flex flex-col gap-6'>
                <div className='relative overflow-hidden rounded-[34px] surface-card-strong p-4 transition-colors'>
                  <div className='absolute inset-x-8 top-6 z-20 flex items-center justify-between rounded-full bg-(--surface-highlight) px-5 py-2 text-[10px] font-semibold uppercase tracking-[0.45em] text-color-muted backdrop-blur'>
                    <span>Featured Drop</span>
                    <span>{heroProduct.thcPercentage.toFixed(1)}% THC</span>
                  </div>
                  <Image
                    src={`https://images.unsplash.com/photo-1657918225993-93320b8533e0?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2787`}
                    alt={heroProduct.name}
                    width={640}
                    height={720}
                    className='h-[420px] w-full rounded-3xl object-cover'
                  />
                  <div className='mt-6 space-y-3 px-2 pb-2'>
                    <div className='flex items-center justify-between text-xs uppercase tracking-[0.4em] text-color-muted'>
                      <span>{heroProduct.unit}</span>
                      <span>{heroProduct.rating.toFixed(1)} rating</span>
                    </div>
                    <div className='flex items-start justify-between gap-5'>
                      <div>
                        <h2 className='text-xl font-semibold text-foreground'>
                          {heroProduct.name}
                        </h2>
                        <p className='text-sm text-color-muted'>
                          {heroProduct.shortDescription}
                        </p>
                      </div>
                      <span className='pill-surface rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.35em] text-foreground/80'>
                        Shop now
                      </span>
                    </div>
                  </div>
                </div>
                <div className='flex items-center justify-between rounded-3xl border border-dashed border-[var(--surface-outline)] bg-[var(--surface-highlight)] px-6 py-5 text-sm font-medium text-color-muted backdrop-blur-xl'>
                  <span className='uppercase tracking-[0.45em]'>Batch ID</span>
                  <span className='font-semibold text-foreground'>
                    {heroProduct.slug.toUpperCase()}
                  </span>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>*/}

      <FeaturedProducts featuredProducts={featuredProducts} />

      <Brands columnCount={isMobile ? 4 : 5} />

      <FullCollection products={products} categories={categories} />
      <QuickScroll
        className='bg-transparent border-b-[0.33px] border-dashed border-foreground/40'
        href='#finder'
      />
      <StrainFinderMini categories={categories.slice(0, 4)} />

      <Footer />
    </div>
  )
}

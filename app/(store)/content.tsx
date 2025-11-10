'use client'
import type {StoreCategory, StoreProduct} from '@/app/types'
import {ProductCard} from '@/components/store/product-card'
import {Button, Chip} from '@heroui/react'
import Image from 'next/image'
import NextLink from 'next/link'

interface StorefrontPageProps {
  categories: StoreCategory[]
  products: StoreProduct[]
}

const buildCategorySections = (
  categories: StoreCategory[],
  products: StoreProduct[],
) =>
  categories
    .map((category) => ({
      category,
      products: products
        .filter((product) => product.categorySlug === category.slug)
        .slice(0, 4),
    }))
    .filter((section) => section.products.length > 0)

const metrics = [
  {
    label: 'Small-batch SKUs',
    value: '24',
  },
  {
    label: 'Cultivars tasted this season',
    value: '56',
  },
  {
    label: 'Delivery radius (mi)',
    value: '12',
  },
]

export const Content = ({categories, products}: StorefrontPageProps) => {
  const featuredProducts = products.filter((item) => item.featured).slice(0, 4)
  const heroProduct = featuredProducts[0] ?? products[0] ?? null
  const sections = buildCategorySections(categories, products)

  return (
    <div className='space-y-24 pb-28'>
      <section className='mx-auto w-full max-w-6xl px-4 pt-14 sm:px-6 lg:px-8'>
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
                  className='border border-[var(--surface-outline)] bg-[var(--surface-highlight)] px-8 py-6 text-lg font-semibold text-foreground shadow-[0_20px_60px_-30px_rgba(8,12,26,0.55)] transition hover:bg-[var(--surface-muted)]'>
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
                  <div className='absolute inset-x-8 top-6 z-20 flex items-center justify-between rounded-full bg-[var(--surface-highlight)] px-5 py-2 text-[10px] font-semibold uppercase tracking-[0.45em] text-color-muted backdrop-blur'>
                    <span>Featured Drop</span>
                    <span>{heroProduct.thcPercentage.toFixed(1)}% THC</span>
                  </div>
                  <Image
                    src={`https://images.unsplash.com/photo-1657918225993-93320b8533e0?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2787`}
                    alt={heroProduct.name}
                    width={640}
                    height={720}
                    priority
                    className='h-[420px] w-full rounded-[24px] object-cover'
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
      </section>

      <section
        id='menu'
        className='mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8'>
        <div className='flex flex-col gap-6'>
          <div className='flex flex-wrap items-center justify-between gap-4'>
            <div>
              <h2 className='text-2xl font-semibold text-foreground sm:text-3xl'>
                Featured Drops
              </h2>
              <p className='text-sm text-color-muted'>
                Small-batch releases handpicked by our cultivation team.
              </p>
            </div>
            <Button
              as={NextLink}
              href='#finder'
              radius='full'
              variant='flat'
              className='border border-[var(--surface-outline)] bg-[var(--surface-highlight)] text-sm font-semibold text-foreground transition hover:bg-[var(--surface-muted)]'>
              Personalize with Strain Finder
            </Button>
          </div>
          <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
            {featuredProducts.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section
        id='finder'
        className='mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8'>
        <div className='rounded-[36px] surface-card-strong p-8 transition-colors sm:p-12'>
          <div className='grid gap-12 lg:grid-cols-2 lg:items-center'>
            <div className='space-y-6'>
              <Chip
                variant='flat'
                radius='sm'
                className='chip-surface w-fit rounded-full px-4 py-1 text-[11px] font-medium uppercase tracking-[0.4em] text-color-muted'>
                Strain Finder
              </Chip>
              <h2 className='text-3xl font-semibold text-foreground sm:text-4xl'>
                Tell us how you want to feel. We’ll build your tasting flight.
              </h2>
              <p className='text-base text-color-muted'>
                Dial in your desired experience, preferred flavor notes, and
                potency level. Our guided strain finder crafts a trio of
                recommendations matched to your vibe.
              </p>
              <div className='flex flex-wrap gap-3 text-sm text-color-muted'>
                <span className='pill-surface rounded-full px-4 py-2'>
                  Mood-based curation
                </span>
                <span className='pill-surface rounded-full px-4 py-2'>
                  Terpene-forward suggestions
                </span>
                <span className='pill-surface rounded-full px-4 py-2'>
                  Supports micro & macro dosing
                </span>
              </div>
              <Button
                as={NextLink}
                href='/quiz'
                radius='full'
                variant='solid'
                className='cta-button w-fit px-8 py-5 text-sm font-semibold uppercase tracking-[0.35em] hover:brightness-110'>
                Start the Finder
              </Button>
            </div>
            <div className='grid gap-4 sm:grid-cols-2'>
              {categories.slice(0, 4).map((category) => (
                <div
                  key={category.slug}
                  className='group relative overflow-hidden rounded-2xl border border-[var(--surface-outline)] bg-[var(--surface-highlight)] p-6 transition hover:-translate-y-1 hover:border-[var(--border-strong)] hover:bg-[var(--surface-muted)]'>
                  <div className='flex flex-col gap-3'>
                    <span className='text-xs uppercase tracking-[0.4em] text-color-muted'>
                      {category.slug}
                    </span>
                    <h3 className='text-lg font-semibold text-foreground'>
                      {category.name}
                    </h3>
                    <p className='text-sm text-color-muted'>
                      {category.description}
                    </p>
                  </div>
                  <span className='absolute right-4 top-4 text-xs font-semibold text-color-muted transition group-hover:text-foreground'>
                    Explore →
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {sections.map(({category, products: categoryProducts}) => (
        <section
          key={category.slug}
          id={`category-${category.slug}`}
          className='mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8'>
          <div className='flex flex-col gap-8 rounded-[32px] surface-card-strong p-8 transition-colors sm:p-10'>
            <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
              <div>
                <h3 className='text-2xl font-semibold text-foreground sm:text-3xl'>
                  {category.name}
                </h3>
                <p className='max-w-2xl text-sm text-color-muted'>
                  {category.description}
                </p>
              </div>
              <div className='flex items-center gap-3 text-xs uppercase tracking-[0.35em] text-color-muted'>
                <span>Curated selection</span>
                <span className='h-[1px] w-10 bg-foreground/30' />
                <span>{categoryProducts.length} picks</span>
              </div>
            </div>
            <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
              {categoryProducts.map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))}
            </div>
          </div>
        </section>
      ))}
    </div>
  )
}

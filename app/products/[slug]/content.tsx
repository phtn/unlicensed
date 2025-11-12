'use client'

import type {StoreProduct, StoreProductDetail} from '@/app/types'
import {ProductCard} from '@/components/store/product-card'
import {Lens} from '@/components/ui/lens'
import {api} from '@/convex/_generated/api'
import {useToggle} from '@/hooks/use-toggle'
import {adaptProductDetail} from '@/lib/convexClient'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {
  Badge,
  BreadcrumbItem,
  Breadcrumbs,
  Button,
  Chip,
  Divider,
  Image,
} from '@heroui/react'
import {useQuery} from 'convex/react'
import NextLink from 'next/link'
import {notFound} from 'next/navigation'
import {useMemo, useState} from 'react'

const formatPrice = (priceCents: number) => {
  const dollars = priceCents / 100
  return dollars % 1 === 0 ? `${dollars.toFixed(0)}` : `${dollars.toFixed(2)}`
}

const DetailList = ({label, items}: {label: string; items: string[]}) => (
  <div className='flex flex-col gap-3'>
    <h3 className='text-xs uppercase tracking-[0.4em] text-color-muted'>
      {label}
    </h3>
    <div className='flex flex-wrap gap-2'>
      {items.map((item) => (
        <span
          key={item}
          className='bg-secondary border border-foreground/10 rounded-full px-4 py-2 text-sm font-medium text-foreground/80'>
          {item}
        </span>
      ))}
    </div>
  </div>
)

const CompositionStat = ({
  title,
  value,
  accent,
}: {
  title: string
  value: string
  accent?: string
}) => (
  <div className='space-y-2 rounded-2xl border border-color-border/30 bg-background/50 p-3 backdrop-blur-md'>
    <p className='text-xs uppercase tracking-[0.4em] text-color-muted'>
      {title}
    </p>
    <div className='flex items-baseline gap-2'>
      <span className='text-2xl font-semibold text-foreground'>{value}</span>
      {accent ? (
        <span className='hidden text-xs font-medium uppercase tracking-widest text-color-muted'>
          {accent}
        </span>
      ) : null}
    </div>
  </div>
)

const Gallery = ({product}: {product: StoreProduct}) => {
  const {on, setOn} = useToggle()
  return (
    <div className='flex flex-col gap-4'>
      <div className='relative aspect-4/5 w-full overflow-hidden rounded-4xl border border-foreground/20 bg-background/60'>
        <Lens hovering={on} setHovering={setOn}>
          <Image
            src={product.image}
            alt={product.name}
            className='object-cover size-220 aspect-auto'
          />
        </Lens>
        <div className='absolute inset-x-6 top-6 flex items-center justify-between rounded-full bg-black/35 px-5 py-2 text-xs uppercase tracking-[0.45em] text-emerald-100 backdrop-blur-md'>
          <span>{product.categorySlug}</span>
          <span>{product.thcPercentage.toFixed(1)}% THC</span>
        </div>
      </div>
      <div className='grid grid-cols-3 gap-3'>
        {product.gallery.map((src) => (
          <div
            key={src}
            className='relative aspect-4/5 overflow-hidden rounded-4xl border border-foreground/10'>
            <Image
              src={src}
              alt={`${product.name} gallery`}
              className='object-cover aspect-auto size-64'
            />
          </div>
        ))}
      </div>
    </div>
  )
}

interface ProductDetailContentProps {
  initialDetail: StoreProductDetail | null
  slug: string
}

export const ProductDetailContent = ({
  initialDetail,
  slug,
}: ProductDetailContentProps) => {
  const [selectedDenomination, setSelectedDenomination] = useState<number>(0)

  const detailQuery = useQuery(api.products.q.getProductBySlug, {slug})

  const detail = useMemo<StoreProductDetail | null | undefined>(() => {
    if (detailQuery === undefined) {
      return initialDetail
    }
    if (!detailQuery) {
      return null
    }
    return detailQuery ? adaptProductDetail(detailQuery) : null
  }, [detailQuery, initialDetail])

  if (detail === null) {
    notFound()
  }

  if (!detail) {
    return null
  }

  const product = detail.product
  const category = detail.category
  const related = detail.related

  const handleDenominationChange = (denomination: number) => () => {
    setSelectedDenomination(denomination)
  }

  return (
    <div className='space-y-20 pb-24'>
      <section className='mx-auto w-full max-w-7xl px-4 pt-12 sm:px-6 lg:px-8'>
        <Breadcrumbs
          aria-label='Product breadcrumb'
          className='text-sm text-color-muted'
          itemClasses={{
            item: 'text-color-muted hover:text-foreground',
            separator: 'text-color-muted',
          }}>
          <BreadcrumbItem href='/'>
            <Icon name='hut' />
          </BreadcrumbItem>
          <BreadcrumbItem href={`/#category-${product.categorySlug}`}>
            {category?.name ?? product.categorySlug}
          </BreadcrumbItem>
          <BreadcrumbItem>{product.name}</BreadcrumbItem>
        </Breadcrumbs>
        <div className='mt-10 grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-start'>
          <Gallery product={product} />
          <div className='space-y-10 rounded-4xl border border-foreground/30 bg-accent p-6 backdrop-blur-xl sm:p-8'>
            <div className='flex flex-col gap-5'>
              <div className='flex items-center justify-between'>
                <Chip
                  size='sm'
                  radius='sm'
                  variant='flat'
                  className='w-fit rounded-full px-1.5 py-1 text-sm uppercase tracking-wide text-foreground/80'>
                  {category?.name ?? product.categorySlug}
                </Chip>
                <span className='text-xs uppercase text-color-muted'>
                  in stock
                </span>
              </div>

              <div className='space-y-4'>
                <h1 className='text-4xl capitalize font-semibold text-foreground sm:text-5xl'>
                  {product.name.split('-').join(' ')}
                </h1>
                <p className='text-base text-color-muted'>
                  {product.description}
                </p>
              </div>
              <div className='flex flex-wrap items-center gap-4 py-4'>
                <span className='font-space w-20 text-2xl font-semibold text-foreground'>
                  <span className='font-light opacity-80'>$</span>
                  {formatPrice(
                    product.availableDenominations[selectedDenomination] *
                      product.priceCents,
                  )}
                </span>
                {product.availableDenominations &&
                  product.availableDenominations.map((denomination, i) => (
                    <button
                      onClick={handleDenominationChange(i)}
                      className='cursor-pointer rounded-full ring-offset-1 ring-teal-400 outline-teal-400'
                      key={denomination}>
                      <Badge
                        isOneChar
                        size='lg'
                        content={
                          denomination === product.popularDenomination ? (
                            <Icon
                              name='lightning'
                              className='text-orange-300 size-5 rotate-12'
                            />
                          ) : null
                        }
                        placement='top-right'
                        shape='circle'
                        // {denomination === product.popularDenomination }
                        className={
                          denomination === product.popularDenomination
                            ? 'bg-foreground'
                            : 'hidden'
                        }>
                        <span
                          className={cn(
                            'relative font-space rounded-full border border-foreground px-3 py-1 text-xs font-semibold tracking-widest',
                            {
                              'bg-foreground text-background':
                                selectedDenomination === i,
                            },
                          )}>
                          {denomination}
                          {product.unit}
                        </span>
                      </Badge>
                    </button>
                  ))}
              </div>
              <div className='flex gap-3'>
                <Button
                  size='lg'
                  color='success'
                  variant='shadow'
                  className='w-full font-space font-semibold bg-linear-to-br from-emerald-300 via-emerald-400 to-sky-400 text-white'>
                  Add to Cart
                </Button>
                <Button
                  size='lg'
                  variant='solid'
                  className='w-full font-space font-semibold border border-foreground bg-foreground text-background hover:border-foreground'>
                  <span>Checkout</span>
                  <Icon name='arrow-down' className='ml-2 size-8 -rotate-90' />
                </Button>
              </div>
            </div>
            <Divider className='border-color-border/40' />
            <div className='grid gap-6 sm:grid-cols-2'>
              <CompositionStat
                title='THC Potency'
                value={`${product.thcPercentage.toFixed(1)}%`}
                accent='Primary cannabinoid'
              />
              <CompositionStat
                title='CBD'
                value={
                  typeof product.cbdPercentage === 'number'
                    ? `${product.cbdPercentage.toFixed(1)}%`
                    : '<0.5%'
                }
                accent='Secondary'
              />
            </div>
            <Divider className='border-color-border/40' />
            <div className='space-y-8'>
              <DetailList label='Effects' items={product.effects} />
              <DetailList label='Flavor Notes' items={product.flavorNotes} />
              <DetailList label='Terpene Profile' items={product.terpenes} />
            </div>
            <Divider className='border-color-border/40' />
            <div className='space-y-4'>
              <h3 className='text-xs uppercase tracking-[0.4em] text-color-muted'>
                Dosage
              </h3>
              <p className='text-sm text-color-muted'>{product.consumption}</p>
            </div>
          </div>
        </div>
      </section>

      {related.length > 0 ? (
        <section className='mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center justify-between gap-4'>
            <div>
              <h2 className='text-2xl font-semibold text-foreground sm:text-3xl'>
                Related selections
              </h2>
              <p className='text-sm text-color-muted'>
                More from the {category?.name ?? product.categorySlug} family
                curated for you.
              </p>
            </div>
            <Button
              as={NextLink}
              href={`/#category-${product.categorySlug}`}
              radius='full'
              variant='faded'
              className='border border-color-border/70 bg-background/30 text-sm font-semibold text-foreground/80'>
              Explore category
            </Button>
          </div>
          <div className='mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
            {related.map((item) => (
              <ProductCard key={item.slug} product={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}

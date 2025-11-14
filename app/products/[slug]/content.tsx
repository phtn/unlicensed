'use client'

import type {StoreProduct, StoreProductDetail} from '@/app/types'
import {AuthModal} from '@/components/auth/auth-modal'
import {ProductCard} from '@/components/store/product-card'
import {Lens} from '@/components/ui/lens'
import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {useCartAnimation} from '@/ctx/cart-animation'
import {useCart} from '@/hooks/use-cart'
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
  useDisclosure,
} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import NextLink from 'next/link'
import {notFound} from 'next/navigation'
import {useCallback, useMemo, useRef, useState} from 'react'

const formatPrice = (priceCents: number) => {
  const dollars = priceCents / 100
  return dollars % 1 === 0 ? `${dollars.toFixed(0)}` : `${dollars.toFixed(2)}`
}

const DetailList = ({label, items}: {label: string; items: string[]}) => (
  <div className='flex flex-col gap-2 sm:gap-3'>
    <h3 className='text-[10px] sm:text-xs uppercase tracking-[0.3em] sm:tracking-[0.4em] text-color-muted'>
      {label}
    </h3>
    <div className='flex flex-wrap gap-1.5 sm:gap-2'>
      {items.map((item) => (
        <span
          key={item}
          className='bg-secondary border border-foreground/10 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-foreground/80'>
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
  <div className='space-y-1.5 sm:space-y-2 rounded-xl sm:rounded-2xl border border-color-border/30 bg-background/50 p-2.5 sm:p-3 backdrop-blur-md'>
    <p className='text-[10px] sm:text-xs uppercase tracking-[0.3em] sm:tracking-[0.4em] text-color-muted'>
      {title}
    </p>
    <div className='flex items-baseline gap-2'>
      <span className='text-xl sm:text-2xl font-semibold text-foreground'>
        {value}
      </span>
      {accent ? (
        <span className='hidden text-xs font-medium uppercase tracking-widest text-color-muted'>
          {accent}
        </span>
      ) : null}
    </div>
  </div>
)

const Gallery = ({
  product,
  imageRef,
}: {
  product: StoreProduct
  imageRef?: React.RefObject<HTMLDivElement | null>
}) => {
  const {on, setOn} = useToggle()
  return (
    <div className='flex flex-col gap-3 sm:gap-4'>
      <div
        ref={imageRef}
        className='relative aspect-4/5 w-full overflow-hidden rounded-3xl sm:rounded-4xl border border-foreground/20 bg-background/60'>
        <Lens hovering={on} setHovering={setOn}>
          <Image
            src={product.image}
            alt={product.name}
            className='object-cover w-full h-full aspect-auto'
            loading='eager'
            sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 40vw'
          />
        </Lens>
        <div className='absolute inset-x-4 sm:inset-x-6 top-4 sm:top-6 flex items-center justify-between gap-2 rounded-full bg-black/35 px-3 sm:px-5 py-1.5 sm:py-2 text-[10px] sm:text-xs uppercase tracking-[0.35em] sm:tracking-[0.45em] text-emerald-100 backdrop-blur-md'>
          <span className='truncate'>{product.categorySlug}</span>
          <span className='whitespace-nowrap'>
            {product.thcPercentage.toFixed(1)}% THC
          </span>
        </div>
      </div>
      {product.gallery.length > 0 && (
        <div className='grid grid-cols-3 gap-2 sm:gap-3'>
          {product.gallery.map((src) => (
            <div
              key={src}
              className='relative aspect-4/5 overflow-hidden rounded-3xl sm:rounded-4xl border border-foreground/10'>
              <Image
                src={src}
                alt={`${product.name} gallery`}
                className='object-cover w-full h-full aspect-auto'
                loading='lazy'
                sizes='(max-width: 640px) 33vw, (max-width: 1024px) 16vw, 13vw'
              />
            </div>
          ))}
        </div>
      )}
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
  const {isOpen, onClose} = useDisclosure()
  const {addItem, isAuthenticated} = useCart()
  const [isAdding, setIsAdding] = useState(false)
  const {triggerAnimation} = useCartAnimation()
  const addToCartButtonRef = useRef<HTMLDivElement>(null)
  const galleryImageRef = useRef<HTMLDivElement>(null)

  const detailQuery = useQuery(api.products.q.getProductBySlug, {slug})
  //
  const purgeTestProduts = useMutation(api.products.m.purgeTestProducts)

  const purge = useCallback(async () => {
    await purgeTestProduts()
  }, [purgeTestProduts])

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

  const handleAddToCart = async () => {
    // Get product ID from detailQuery if available, otherwise use _id from product
    const productId: Id<'products'> | undefined =
      detailQuery?.product?._id || (product._id as Id<'products'> | undefined)
    if (!productId) {
      console.error('Product ID not available')
      return
    }

    setIsAdding(true)
    try {
      const denomination =
        product.availableDenominations?.[selectedDenomination]

      // Debug: Log before adding to cart
      if (process.env.NODE_ENV === 'development') {
        console.log('[ProductDetail] Adding to cart:', {
          productId,
          quantity: 1,
          denomination,
          isAuthenticated,
          timestamp: Date.now(),
        })
      }

      // Add item to cart - works for both authenticated and anonymous users
      // The cart queries will automatically update when this completes
      await addItem(productId, 1, denomination)

      // Debug: Log after adding to cart
      if (process.env.NODE_ENV === 'development') {
        console.log('[ProductDetail] Added to cart successfully:', {
          productId,
          timestamp: Date.now(),
        })
      }

      // Trigger animation from gallery image
      if (galleryImageRef.current && product.image) {
        const imageRect = galleryImageRef.current.getBoundingClientRect()
        const startX = imageRect.left + imageRect.width / 2
        const startY = imageRect.top + imageRect.height / 2
        console.log('Triggering animation', {
          image: product.image,
          startX,
          startY,
          imageRect,
        })
        triggerAnimation(product.image, {x: startX, y: startY})
      } else {
        console.warn('Cannot trigger animation', {
          hasRef: !!galleryImageRef.current,
          hasImage: !!product.image,
        })
      }
    } catch (error) {
      console.error('Failed to add to cart:', error)
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className='space-y-12 sm:space-y-16 lg:space-y-20 pb-12 sm:pb-16 lg:pb-24 overflow-x-hidden'>
      <section className='mx-auto w-full max-w-7xl px-4 pt-6 sm:pt-8 lg:pt-10 sm:px-6 lg:px-8'>
        <Breadcrumbs
          aria-label='Product breadcrumb'
          className='text-xs sm:text-sm text-color-muted'
          itemClasses={{
            item: 'text-foreground/85',
            separator: 'opacity-80',
          }}>
          <BreadcrumbItem href='/'>
            <Icon name='mushrooms' className='size-3 sm:size-4 opacity-60' />
          </BreadcrumbItem>
          <BreadcrumbItem href={`/#category-${product.categorySlug}`}>
            {category?.name ?? product.categorySlug}
          </BreadcrumbItem>
          <BreadcrumbItem>{product.name}</BreadcrumbItem>
        </Breadcrumbs>
        <div className='mt-6 sm:mt-8 lg:mt-10 grid gap-6 sm:gap-8 lg:gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-start'>
          <Gallery product={product} imageRef={galleryImageRef} />
          <div className='space-y-6 sm:space-y-8 lg:space-y-10 rounded-3xl sm:rounded-4xl border border-foreground/30 bg-accent p-4 sm:p-6 lg:p-8 backdrop-blur-xl'>
            <div className='flex flex-col gap-4 sm:gap-5'>
              <div className='flex items-center justify-between gap-2'>
                <Chip
                  size='sm'
                  radius='sm'
                  variant='flat'
                  className='w-fit rounded-full px-1.5 py-1 text-xs sm:text-sm uppercase tracking-wide text-foreground/80'>
                  {category?.name ?? product.categorySlug}
                </Chip>
                <span className='text-[10px] sm:text-xs uppercase text-color-muted whitespace-nowrap'>
                  in stock
                </span>
              </div>

              <div className='space-y-3 sm:space-y-4'>
                <h1 className='text-2xl sm:text-3xl lg:text-4xl xl:text-5xl capitalize font-semibold text-foreground leading-tight'>
                  {product.name.split('-').join(' ')}
                </h1>
                <p className='text-sm sm:text-base text-color-muted leading-relaxed'>
                  {product.description}
                </p>
              </div>
              <div className='flex flex-wrap items-center gap-3 sm:gap-4 py-3 sm:py-4'>
                <span className='font-space text-xl sm:text-2xl font-semibold text-foreground'>
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
                            'relative font-space rounded-full border border-foreground px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-semibold tracking-wide sm:tracking-widest whitespace-nowrap',
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
              <div className='flex flex-col sm:flex-row gap-3'>
                <div ref={addToCartButtonRef} className='w-full sm:flex-1'>
                  <Button
                    size='lg'
                    color='success'
                    variant='shadow'
                    className='w-full font-space font-semibold text-sm sm:text-base bg-linear-to-br from-emerald-300 via-emerald-400 to-sky-400 text-white'
                    onPress={handleAddToCart}
                    isLoading={isAdding}>
                    Add to Cart
                  </Button>
                </div>
                <Button
                  size='lg'
                  variant='solid'
                  // as={NextLink}
                  // href='/cart'
                  onPress={purge}
                  className='w-full sm:flex-1 font-space font-semibold text-sm sm:text-base border border-foreground bg-foreground text-background hover:border-foreground'>
                  <span>Checkout</span>
                  <Icon
                    name='arrow-down'
                    className='ml-2 size-6 sm:size-8 -rotate-90'
                  />
                </Button>
              </div>
              <AuthModal isOpen={isOpen} onClose={onClose} mode='login' />
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
            <div className='space-y-2 sm:space-y-4'>
              <h3 className='text-[10px] sm:text-xs uppercase tracking-[0.3em] sm:tracking-[0.4em] text-color-muted'>
                Dosage
              </h3>
              <p className='text-xs sm:text-sm text-color-muted leading-relaxed'>
                {product.consumption}
              </p>
            </div>
          </div>
        </div>
      </section>

      {related.length > 0 ? (
        <section className='mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8'>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4'>
            <div>
              <h2 className='text-xl sm:text-2xl lg:text-3xl font-semibold text-foreground'>
                Related selections
              </h2>
              <p className='text-xs sm:text-sm text-color-muted mt-1'>
                More from the {category?.name ?? product.categorySlug} family
                curated for you.
              </p>
            </div>
            <Button
              as={NextLink}
              href={`/#category-${product.categorySlug}`}
              radius='full'
              variant='faded'
              size='sm'
              className='self-start sm:self-auto border border-color-border/70 bg-background/30 text-xs sm:text-sm font-semibold text-foreground/80'>
              Explore category
            </Button>
          </div>
          <div className='mt-6 sm:mt-8 grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3'>
            {related.map((item) => (
              <ProductCard key={item.slug} product={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}

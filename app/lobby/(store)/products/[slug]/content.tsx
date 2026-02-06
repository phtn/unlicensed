'use client'

import {mapFractions} from '@/app/admin/_components/product-schema'
import type {StoreProductDetail} from '@/app/types'
import {AuthModal} from '@/components/auth/auth-modal'
import {QuickScroll} from '@/components/base44/quick-scroll'
import {ProductProfile} from '@/components/ui/product-profile'
import {StatChip} from '@/components/ui/terpene'
import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {useCart} from '@/hooks/use-cart'
import {useMobile} from '@/hooks/use-mobile'
import {adaptProductDetail, type RawProductDetail} from '@/lib/convexClient'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {
  Badge,
  BreadcrumbItem,
  Breadcrumbs,
  Button,
  Tooltip,
  useDisclosure,
} from '@heroui/react'
import {useQuery} from 'convex/react'
import NextLink from 'next/link'
import {notFound} from 'next/navigation'
import {useMemo, useOptimistic, useRef, useState, useTransition} from 'react'
import {Gallery} from './gallery'
import {RelatedProducts} from './related-products'

const formatPrice = (priceCents: number) => {
  const dollars = priceCents / 100
  return dollars % 1 === 0 ? `${dollars.toFixed(0)}` : `${dollars.toFixed(2)}`
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
  const {cart, addItem} = useCart()
  const [isPending, startTransition] = useTransition()
  const addToCartButtonRef = useRef<HTMLDivElement>(null)
  const galleryImageRef = useRef<HTMLDivElement>(null)

  const isMobile = useMobile()

  // Optimistic state for add-to-cart operations
  const [optimisticAdding, setOptimisticAdding] = useOptimistic(
    false,
    (current, isAdding: boolean) => isAdding,
  )

  const detailQuery = useQuery(api.products.q.getProductBySlug, {slug})

  // Get primary image URL for the product
  const primaryImageUrl = useQuery(
    api.products.q.getPrimaryImage,
    detailQuery?.product?._id ? {id: detailQuery.product._id} : 'skip',
  )

  // Get gallery images
  const galleryUrls = useQuery(
    api.products.q.listGallery,
    detailQuery?.product?._id ? {id: detailQuery.product._id} : 'skip',
  )

  const detail = useMemo<StoreProductDetail | null | undefined>(() => {
    if (detailQuery === undefined) {
      return initialDetail
    }
    if (!detailQuery) {
      return null
    }
    const adapted = adaptProductDetail(detailQuery as RawProductDetail)
    // Override image URLs with resolved URLs if available
    if (primaryImageUrl) {
      adapted.product.image = primaryImageUrl
    }
    if (galleryUrls) {
      adapted.product.gallery = galleryUrls.filter(
        (url): url is string => !!url,
      )
    }
    return adapted
  }, [detailQuery, initialDetail, primaryImageUrl, galleryUrls])

  const productId = detailQuery?.product?._id
  const quantityInCart = useMemo(() => {
    if (!productId || !cart?.items) return 0
    return cart.items
      .filter((item) => item.product._id === productId)
      .reduce((sum, item) => sum + item.quantity, 0)
  }, [cart?.items, productId])

  if (detail === null) {
    notFound()
  }

  if (!detail) {
    return null
  }

  const product = detail.product
  const category = detail.category
  const related = detail.related

  // Selected denomination value (e.g. 0.125, 1, 3.5) for priceByDenomination/stockByDenomination lookups; keyed by string in store
  const currentDenominationValue =
    product.availableDenominations?.[selectedDenomination] ?? 0
  const currentDenominationKey = String(currentDenominationValue)

  const handleDenominationChange = (index: number) => () => {
    setSelectedDenomination(index)
  }

  const handleAddToCart = async () => {
    // Get product ID from detailQuery if available, otherwise use _id from product
    const productId: Id<'products'> | undefined =
      detailQuery?.product?._id || (product._id as Id<'products'> | undefined)
    if (!productId) {
      console.error('Product ID not available')
      return
    }

    const denomination = currentDenominationValue

    startTransition(async () => {
      // Set optimistic state immediately
      setOptimisticAdding(true)

      try {
        // Add item to cart - works for both authenticated and anonymous users
        // The cart queries will automatically update when this completes
        await addItem(productId, 1, denomination)
      } catch (error) {
        console.error('Failed to add to cart:', error)
      } finally {
        setOptimisticAdding(false)
      }
    })
  }

  const isAdding = optimisticAdding || isPending

  return (
    <div className='space-y-12 sm:space-y-16 lg:space-y-20 py-12 sm:py-8 lg:py-20 overflow-x-hidden w-full'>
      <section className='md:mx-auto lg:max-w-7xl max-w-screen p-2 sm:pt-8 lg:pt-10 sm:px-6 lg:px-0'>
        <Breadcrumbs
          aria-label='Product breadcrumb'
          className='text-xs sm:text-sm text-color-muted'
          itemClasses={{
            item: 'text-foreground/85 capitalize',
            separator: 'opacity-80',
          }}>
          <BreadcrumbItem href='/lobby/category'>
            <Icon name='home' className='size-4 sm:size-4 opacity-60' />
          </BreadcrumbItem>
          <BreadcrumbItem href={`/lobby/category/${product.categorySlug}`}>
            {category?.name ?? product.categorySlug}
          </BreadcrumbItem>
          <BreadcrumbItem>{product.name}</BreadcrumbItem>
        </Breadcrumbs>
        <div className='mt-2 sm:mt-8 lg:mt-6 grid gap-6 sm:gap-8 lg:gap-0 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-start'>
          <Gallery
            product={product}
            imageRef={galleryImageRef}
            productId={detailQuery?.product?._id ?? product._id}
            isMobile={isMobile}
          />
          <div className='space-y-6 sm:space-y-8 lg:min-h-[78lvh] rounded-3xl rounded-tl-none border border-foreground/20 bg-hue dark:bg-dark-table/50 p-4 sm:p-5 lg:p-6 backdrop-blur-xl w-full'>
            <div className='flex flex-col gap-4 sm:gap-5'>
              <div className='flex items-center h-10 overflow-hidden justify-between gap-1 pb-2 md:w-full'>
                <StatChip
                  value={
                    category?.name.toUpperCase() ??
                    product.categorySlug.toUpperCase()
                  }
                />
                <div className='flex items-center space-x-2'>
                  <StatChip
                    value={
                      <span>
                        <span className='font-bold'>THC</span>{' '}
                        <span className='font-okxs font-bold text-brand'>
                          {product.thcPercentage}
                        </span>
                        <span className='text-foreground'>%</span>
                      </span>
                    }
                  />
                  <StatChip
                    label={''}
                    value={product.potencyLevel}
                    name={
                      product.potencyLevel === 'high'
                        ? 'strength-high'
                        : 'strength-medium'
                    }
                  />
                </div>
                {quantityInCart > 0 ? (
                  <Tooltip key='in-cart' content='In The Bag'>
                    <Badge
                      size='lg'
                      variant='shadow'
                      className='px-[0.5px]'
                      classNames={{
                        badge:
                          'aspect-square size-6 text-base translate-x-0.5 translate-y-0.5 rounded-xs flex items-center justify-center rounded-md border-1.5 dark:border-background/85 shadow-md backdrop-blur-2xl bg-brand/90',
                      }}
                      content={
                        <div
                          suppressHydrationWarning
                          className='flex items-center justify-center rounded-xs py-0.5 px-1 md:mx-0 size-5 aspect-square'>
                          <span className='font-okxs font-medium text-base text-white leading-none drop-shadow-xs'>
                            {quantityInCart}
                          </span>
                        </div>
                      }>
                      <div className='w-20 flex items-center justify-end'>
                        <Icon
                          name='shopping-bag-fill'
                          className='size-8 drop-shadow-xs mt-1 mr-3.25'
                        />
                      </div>
                    </Badge>
                  </Tooltip>
                ) : (
                  <span className='text-[9px] w-20 sm:text-xs uppercase text-color-muted whitespace-nowrap'>
                    <span className='text-brand font-okxs font-medium'>
                      {product.stockByDenomination?.[currentDenominationKey] ??
                        product.stock ??
                        0}
                    </span>{' '}
                    in-stock
                  </span>
                )}
              </div>

              <div className='space-y-3 sm:space-y-4'>
                <h1 className='text-3xl lg:text-4xl xl:text-5xl capitalize font-bone font-light text-foreground leading-tight tracking-tight'>
                  {product.name.split('-').join(' ')}
                </h1>
                <p className='text-sm opacity-70 leading-relaxed'>
                  {product.description}
                </p>
              </div>
              <div className='flex items-start justify-between py-3 sm:py-4'>
                <span className='font-space text-3xl sm:text-4xl font-semibold text-foreground w-40 md:w-28'>
                  <span className='font-light opacity-80 scale-90'>$</span>
                  {formatPrice(
                    product.priceByDenomination?.[currentDenominationKey] ??
                      product.priceCents ??
                      0,
                  )}
                </span>

                <div className='flex items-center justify-end md:w-95'>
                  <div className='flex flex-wrap items-start gap-3'>
                    {product.availableDenominations &&
                      product.availableDenominations.map((denomination, i) => (
                        <Tooltip
                          key={denomination}
                          size='sm'
                          content={
                            <div className='flex items-center gap-0.5 overflow-hidden whitespace-nowrap h-5 text-sm'>
                              <Icon
                                name='star-fill'
                                className='size-4 text-yellow-500'
                              />
                              <span>Top Picks</span>
                            </div>
                          }
                          classNames={{
                            content:
                              'font-okxs font-semibold overflow-hidden whitespace-nowrap',
                          }}
                          className=''>
                          <Badge
                            isOneChar
                            size={isMobile ? 'sm' : 'md'}
                            content={
                              product.popularDenomination?.includes(
                                denomination,
                              ) ? (
                                <Icon
                                  name='star-fill'
                                  className={cn(
                                    'size-4 transition-transform duration-300',
                                    {
                                      'scale-110 rotate-16':
                                        selectedDenomination === i,
                                    },
                                  )}
                                />
                              ) : null
                            }
                            placement='top-right'
                            shape='circle'
                            className={cn(
                              'flex items-center justify-center top-0',
                              {
                                hidden:
                                  !product.popularDenomination?.includes(
                                    denomination,
                                  ),
                              },
                            )}
                            classNames={{
                              badge: cn(
                                'rounded-full border-[0.5px] dark:border-sidebar/50 size-4 aspect-square',
                                'transition-transform duration-300',
                                {
                                  'bg-white text-brand':
                                    product.popularDenomination?.includes(
                                      denomination,
                                    ),
                                  'border-1 size-6 shadow-md':
                                    selectedDenomination === i,
                                },
                              ),
                            }}>
                            <Button
                              size='sm'
                              onPress={handleDenominationChange(i)}
                              className={cn(
                                'cursor-pointer bg-sidebar rounded-full border border-foreground/20 portrait:px-px',
                                {
                                  'bg-dark-gray dark:bg-white dark:border-foreground text-white dark:text-dark-gray md:hover:bg-black dark:md:hover:bg-brand dark:md:hover:text-white md:hover:text-featured':
                                    selectedDenomination === i,
                                },
                              )}>
                              <span
                                className={cn(
                                  'relative font-okxs text-lg font-medium whitespace-nowrap portrait:px-px',
                                )}>
                                {product.unit === 'oz'
                                  ? mapFractions[denomination + product.unit]
                                  : denomination + product.unit}
                              </span>
                            </Button>
                          </Badge>
                        </Tooltip>
                      ))}
                  </div>
                </div>
              </div>

              <div className='flex flex-col sm:flex-row gap-3'>
                <div ref={addToCartButtonRef} className='w-full sm:flex-1'>
                  <Button
                    size='lg'
                    color='primary'
                    variant='solid'
                    disableRipple
                    className='w-full h-14 font-polysans font-medium text-base md:text-lg bg-linear-to-r from-brand via-brand to-brand flex items-center'
                    onPress={handleAddToCart}
                    isDisabled={isPending}>
                    <span>Add to Cart</span>
                    <Icon
                      name={isAdding ? 'spinners-ring' : 'bag-solid'}
                      className='ml-2 size-6 sm:size-6 mb-1'
                    />
                  </Button>
                </div>
                <Button
                  as={NextLink}
                  size='lg'
                  variant='solid'
                  href='/lobby/cart'
                  className='w-full sm:flex-1 h-14 font-polysans font-medium text-lg bg-foreground/95 text-white dark:text-dark-gray'>
                  <span>Checkout</span>
                </Button>
              </div>
              <AuthModal isOpen={isOpen} onClose={onClose} mode='login' />
            </div>

            <div className='bg-background/30 rounded-3xl gap-4 p-3 md:p-4 space-y-3'>
              <span className='font-polysans font-normal text-xs uppercase opacity-80 mr-2'>
                Terpenes
              </span>
              <div className='flex flex-wrap items-center gap-2 py-3 border-b-[0.5px] border-dotted dark:border-light-gray/20'>
                {product.terpenes.map((terpene) => (
                  <ProductProfile
                    key={terpene}
                    name={terpene}
                    group='terpenes'
                  />
                ))}
              </div>
              <span className='font-polysans font-normal text-xs uppercase opacity-80 mr-2'>
                Flavor Notes
              </span>
              <div className='flex flex-wrap items-center gap-2 py-3 border-b-[0.5px] border-dotted dark:border-light-gray/20'>
                {product.flavorNotes.map((flavor) => (
                  <ProductProfile key={flavor} name={flavor} group='flavors' />
                ))}
              </div>
              <span className='font-polysans font-normal text-xs uppercase opacity-80 mr-2'>
                Effects
              </span>
              <div className='flex flex-wrap items-center gap-2 py-3'>
                {product.effects.map((effect) => (
                  <ProductProfile key={effect} name={effect} group='effects' />
                ))}
              </div>
            </div>
            <h3>
              <span className='font-sans font-semibold tracking-tight opacity-80 mr-2'>
                Experience:
              </span>
              <span className='text-xs sm:text-sm opacity-70 text-color-muted leading-relaxed'>
                {product.potencyProfile}
              </span>
            </h3>

            <h3>
              <span className='font-sans font-semibold tracking-tight opacity-80 mr-2'>
                Consumption:
              </span>
              <span className='text-xs sm:text-sm opacity-70 text-color-muted leading-relaxed'>
                {product.consumption}
              </span>
            </h3>
          </div>
        </div>
      </section>

      <QuickScroll
        href='#related-selections'
        className='border-b-[0.33px] border-foreground/20 border-dotted bg-transparent'
      />

      {related.length > 0 ? <RelatedProducts products={related} /> : null}
    </div>
  )
}

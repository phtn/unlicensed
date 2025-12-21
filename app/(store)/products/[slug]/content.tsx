'use client'

import {mapFractions} from '@/app/admin/_components/product-schema'
import type {StoreProduct, StoreProductDetail} from '@/app/types'
import {AuthModal} from '@/components/auth/auth-modal'
import {QuickScroll} from '@/components/base44/quick-scroll'
import {ProductCard} from '@/components/store/product-card'
import {Lens} from '@/components/ui/lens'
import {ProductProfile} from '@/components/ui/product-profile'
import {StatChip} from '@/components/ui/terpene'
import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {useCartAnimation} from '@/ctx/cart-animation'
import {useCart} from '@/hooks/use-cart'
import {useToggle} from '@/hooks/use-toggle'
import {adaptProductDetail, type RawProductDetail} from '@/lib/convexClient'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {
  Badge,
  BreadcrumbItem,
  Breadcrumbs,
  Button,
  Image,
  useDisclosure,
} from '@heroui/react'
import {useQuery} from 'convex/react'
import NextLink from 'next/link'
import {notFound, useRouter} from 'next/navigation'
import {
  startTransition,
  useCallback,
  useMemo,
  useOptimistic,
  useRef,
  useState,
  useTransition,
} from 'react'

const formatPrice = (priceCents: number) => {
  const dollars = priceCents / 100
  return dollars % 1 === 0 ? `${dollars.toFixed(0)}` : `${dollars.toFixed(2)}`
}

const Gallery = ({
  product,
  imageRef,
  productId,
}: {
  product: StoreProduct
  imageRef?: React.RefObject<HTMLDivElement | null>
  productId?: Id<'products'>
}) => {
  const {on, setOn} = useToggle()
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  // Get primary image URL
  const primaryImageUrl = useQuery(
    api.products.q.getPrimaryImage,
    productId ? {id: productId} : 'skip',
  )

  // Get gallery images - only query if we have a valid productId
  const galleryUrls = useQuery(
    api.products.q.listGallery,
    productId ? {id: productId} : 'skip',
  )

  const displayImage = useMemo(
    () => selectedImage ?? primaryImageUrl ?? undefined,
    [selectedImage, primaryImageUrl],
  )
  const handleSelectImage = useCallback(
    (src: string) => () => {
      startTransition(() => {
        setSelectedImage(src)
      })
    },
    [],
  )

  return (
    <div className='flex flex-col gap-3 sm:gap-0'>
      <div
        ref={imageRef}
        className='relative aspect-auto w-full overflow-hidden bg-background/60 min-h-168'>
        <Lens hovering={on} setHovering={setOn}>
          <Image
            radius='none'
            src={displayImage}
            alt={product.name}
            className='object-cover w-full h-full aspect-auto select-none'
            loading='eager'
          />
        </Lens>
      </div>
      <div className='grid grid-cols-5 gap-1'>
        {[primaryImageUrl, ...(galleryUrls ?? [])].map((src, index) => (
          <div
            key={`${src}-${index}`}
            onClick={() => src && handleSelectImage(src)()}
            className={cn(
              'cursor-pointer select-none relative aspect-square overflow-hidden rounded-md transition-colors size-32',
              selectedImage === src
                ? 'border-foreground/50 ring-2 ring-foreground/20'
                : 'border-foreground/10 hover:border-foreground/30',
            )}>
            {src && (
              <Image
                src={src}
                alt={`${product.name} gallery ${index + 1}`}
                className='object-cover size-32 aspect-auto'
                loading='lazy'
              />
            )}
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
  const {isOpen, onClose} = useDisclosure()
  const {addItem, isAuthenticated} = useCart()
  const [isPending, startTransition] = useTransition()
  const {triggerAnimation} = useCartAnimation()
  const addToCartButtonRef = useRef<HTMLDivElement>(null)
  const galleryImageRef = useRef<HTMLDivElement>(null)

  const router = useRouter()
  const prefetch = useCallback(() => {
    router.prefetch(`/category-${initialDetail?.category?.slug}`)
  }, [router, initialDetail?.category?.slug])

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

    const denomination = product.availableDenominations?.[selectedDenomination]

    startTransition(async () => {
      // Set optimistic state immediately
      setOptimisticAdding(true)

      try {
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
        const imageUrl = primaryImageUrl ?? product.image
        if (galleryImageRef.current && imageUrl) {
          const imageRect = galleryImageRef.current.getBoundingClientRect()
          const startX = imageRect.left + imageRect.width / 2
          const startY = imageRect.top + imageRect.height / 2
          console.log('Triggering animation', {
            image: imageUrl,
            startX,
            startY,
            imageRect,
          })
          triggerAnimation(imageUrl, {x: startX, y: startY})
        } else {
          console.warn('Cannot trigger animation', {
            hasRef: !!galleryImageRef.current,
            hasImage: !!imageUrl,
          })
        }
      } catch (error) {
        console.error('Failed to add to cart:', error)
      } finally {
        // Reset optimistic state
        setOptimisticAdding(false)
      }
    })
  }

  const isAdding = optimisticAdding || isPending

  return (
    <div className='space-y-12 sm:space-y-16 lg:space-y-20 py-10 sm:py-8 lg:py-20 overflow-x-hidden'>
      <section className='mx-auto w-full max-w-7xl px-4 pt-6 sm:pt-8 lg:pt-10 sm:px-6 lg:px-0'>
        <Breadcrumbs
          aria-label='Product breadcrumb'
          className='text-xs sm:text-sm text-color-muted'
          itemClasses={{
            item: 'text-foreground/85 capitalize',
            separator: 'opacity-80',
          }}>
          <BreadcrumbItem href='/'>
            <Icon name='grid' className='size-3 sm:size-4 opacity-60' />
          </BreadcrumbItem>
          <BreadcrumbItem href={`/#category-${product.categorySlug}`}>
            {category?.name ?? product.categorySlug}
          </BreadcrumbItem>
          <BreadcrumbItem>{product.name}</BreadcrumbItem>
        </Breadcrumbs>
        <div className='mt-6 sm:mt-8 lg:mt-6 grid gap-6 sm:gap-8 lg:gap-0 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-start'>
          <Gallery
            product={product}
            imageRef={galleryImageRef}
            productId={detailQuery?.product?._id ?? product._id}
          />
          <div className='space-y-6 sm:space-y-8 lg:min-h-[78lvh] rounded-3xl border border-foreground/20 bg-hue dark:bg-pink-100/10 p-4 sm:p-5 lg:p-6 backdrop-blur-xl'>
            <div className='flex flex-col gap-4 sm:gap-5'>
              <div className='flex items-center justify-between gap-2 pb-4'>
                <StatChip value={category?.name ?? product.categorySlug} />
                <div className='flex items-center space-x-4'>
                  <StatChip label='THC' value={product.thcPercentage + '%'} />
                  <StatChip
                    label='CBD'
                    value={product.potencyLevel}
                    name={
                      product.potencyLevel === 'high'
                        ? 'strength-high'
                        : 'strength-medium'
                    }
                  />
                </div>
                <span className='text-[9px] sm:text-xs uppercase text-color-muted whitespace-nowrap'>
                  in stock
                </span>
              </div>

              <div className='space-y-3 sm:space-y-4'>
                <h1 className='text-2xl sm:text-3xl lg:text-4xl xl:text-5xl capitalize font-fugaz font-light text-foreground leading-tight tracking-tight'>
                  {product.name.split('-').join(' ')}
                </h1>
                <p className='text-sm opacity-70 leading-relaxed'>
                  {product.description}
                </p>
              </div>
              <div className='flex flex-wrap items-center gap-3 sm:gap-2 py-3 sm:py-4'>
                <span className='font-space text-xl sm:text-4xl font-semibold text-foreground w-28'>
                  <span className='font-light opacity-80'>$</span>
                  {formatPrice(
                    product.availableDenominations[selectedDenomination] *
                      product.priceCents,
                  )}
                </span>
                {product.availableDenominations &&
                  product.availableDenominations.map((denomination, i) => (
                    <Badge
                      key={denomination}
                      isOneChar
                      size='md'
                      content={
                        product.popularDenomination?.includes(denomination) ? (
                          <Icon name='star-fill' className='size-4 rotate-12' />
                        ) : null
                      }
                      placement='top-right'
                      shape='circle'
                      className={cn(
                        'top-0 border-none border-hue dark:border-foreground/20',
                        {
                          hidden:
                            !product.popularDenomination?.includes(
                              denomination,
                            ),
                          'bg-brand text-background':
                            selectedDenomination === i,
                          'bg-hue dark:pink-100/10 text-brand':
                            product.popularDenomination?.includes(denomination),
                        },
                      )}>
                      <Button
                        size='sm'
                        onPress={handleDenominationChange(i)}
                        // selectedDenomination
                        className={cn(
                          'cursor-pointer rounded-full border border-foreground/20',
                          {
                            'bg-dark-gray dark:bg-white dark:border-foreground text-featured dark:text-background hover:bg-foreground hover:text-background':
                              selectedDenomination === i,
                          },
                        )}>
                        <span
                          className={cn(
                            'relative font-space text-[10px] sm:text-sm font-medium whitespace-nowrap',
                          )}>
                          {product.unit === 'oz'
                            ? mapFractions[denomination + product.unit]
                            : denomination + product.unit}
                        </span>
                      </Button>
                    </Badge>
                  ))}
              </div>
              <div className='flex flex-col sm:flex-row gap-3'>
                <div ref={addToCartButtonRef} className='w-full sm:flex-1'>
                  <Button
                    size='lg'
                    color='success'
                    variant='solid'
                    disableRipple
                    className='w-full font-semibold text-sm sm:text-base _lg:text-lg bg-linear-to-r from-featured via-featured to-featured dark:text-black font-sans'
                    onPress={handleAddToCart}
                    isDisabled={isPending}>
                    <span>Add to Cart</span>
                    <Icon
                      name={isAdding ? 'spinners-ring' : 'bag-solid'}
                      className='ml-2 size-6 sm:size-6'
                    />
                  </Button>
                </div>
                <Button
                  as={NextLink}
                  size='lg'
                  variant='solid'
                  href='/cart'
                  className='w-full sm:flex-1 font-space font-semibold text-sm sm:text-base bg-foreground/95 text-background'>
                  <span>Checkout</span>
                </Button>
              </div>
              <AuthModal isOpen={isOpen} onClose={onClose} mode='login' />
            </div>

            <div className='gap-4 py-2 md:py-4 space-y-4'>
              <span className='font-sans font-semibold tracking-tight opacity-80 mr-2'>
                Terpenes
              </span>
              <div className='flex flex-wrap items-center gap-2 py-2'>
                {product.terpenes.map((terpene) => (
                  <ProductProfile
                    key={terpene}
                    name={terpene}
                    group='terpenes'
                  />
                ))}
              </div>
              <span className='font-sans font-semibold tracking-tight opacity-80 mr-2'>
                Flavor Notes
              </span>
              <div className='flex flex-wrap items-center gap-2 py-2'>
                {product.flavorNotes.map((flavor) => (
                  <ProductProfile key={flavor} name={flavor} group='flavors' />
                ))}
              </div>
              <span className='font-sans font-semibold tracking-tight opacity-80 mr-2'>
                Effects
              </span>
              <div className='flex flex-wrap items-center gap-2 py-2'>
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
        className='border-b-[0.33px] border-foreground/40 border-dashed bg-transparent'
      />

      {related.length > 0 ? (
        <section
          onMouseEnter={prefetch}
          id='related-selections'
          className='mx-auto w-full max-w-6xl px-4 md:px-0'>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4'>
            <div>
              <h2 className='text-2xl font-semibold text-foreground sm:text-3xl'>
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

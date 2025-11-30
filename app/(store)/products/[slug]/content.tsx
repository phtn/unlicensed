'use client'

import type {StoreProduct, StoreProductDetail} from '@/app/types'
import {AuthModal} from '@/components/auth/auth-modal'
import {QuickScroll} from '@/components/base44/quick-scroll'
import {ProductCard} from '@/components/store/product-card'
import {Lens} from '@/components/ui/lens'
import {ProfilePill, StatChip, TerpeneGray} from '@/components/ui/terpene'
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
  Image,
  useDisclosure,
} from '@heroui/react'
import {useQuery} from 'convex/react'
import NextLink from 'next/link'
import {notFound} from 'next/navigation'
import {
  useCallback,
  useMemo,
  useOptimistic,
  useRef,
  useState,
  useTransition,
  startTransition,
  ViewTransition,
} from 'react'

const formatPrice = (priceCents: number) => {
  const dollars = priceCents / 100
  return dollars % 1 === 0 ? `${dollars.toFixed(0)}` : `${dollars.toFixed(2)}`
}

const Gallery = ({
  product,
  imageRef,
}: {
  product: StoreProduct
  imageRef?: React.RefObject<HTMLDivElement | null>
}) => {
  const {on, setOn} = useToggle()
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const handleSelectImage = useCallback(
    (src: string) => () => {
      startTransition(() => {
        setSelectedImage(src)
      })
    },
    [],
  )
  return (
    <div className='flex flex-col gap-3 sm:gap-4'>
      <div
        ref={imageRef}
        className='relative aspect-auto w-full overflow-hidden bg-background/60'>
        <ViewTransition>
          <Lens hovering={on} setHovering={setOn}>
            <Image
              src={selectedImage ?? product.image}
              alt={product.name}
              className='object-cover w-full h-full aspect-auto select-none'
              loading='eager'
            />
          </Lens>
        </ViewTransition>
        {product.gallery.length > 0 && (
          <div className='grid grid-cols-4 gap-2 sm:gap-3'>
            {product.gallery.map((src) => (
              <div
                key={src}
                onClick={handleSelectImage(src)}
                className='cursor-pointer select-none relative aspect-square overflow-hidden'>
                <Image
                  src={src}
                  alt={`${product.name} gallery`}
                  className='object-contain w-full h-full aspect-auto'
                  loading='lazy'
                />
              </div>
            ))}
          </div>
        )}
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

  // Optimistic state for add-to-cart operations
  const [optimisticAdding, setOptimisticAdding] = useOptimistic(
    false,
    (current, isAdding: boolean) => isAdding,
  )

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
        // Reset optimistic state
        setOptimisticAdding(false)
      }
    })
  }

  const isAdding = optimisticAdding || isPending

  return (
    <div className='space-y-12 sm:space-y-16 lg:space-y-20 py-10 sm:py-8 lg:py-12 overflow-x-hidden'>
      <section className='mx-auto w-full max-w-7xl px-4 pt-6 sm:pt-8 lg:pt-10 sm:px-6 lg:px-4'>
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
        <div className='mt-6 sm:mt-8 lg:mt-6 grid gap-6 sm:gap-8 lg:gap-0 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-start'>
          <Gallery product={product} imageRef={galleryImageRef} />
          <div className='space-y-6 sm:space-y-8 lg:space-y-10 lg:min-h-[78lvh] rounded-3xl border border-foreground/20 bg-hue dark:bg-pink-100/10 p-4 sm:p-5 lg:p-6 backdrop-blur-xl'>
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
              <div className='flex flex-wrap items-center gap-3 sm:gap-4 py-3 sm:py-4'>
                <span className='font-space text-xl sm:text-4xl font-semibold text-foreground w-28'>
                  <span className='font-light opacity-80'>$</span>
                  {formatPrice(
                    product.availableDenominations[selectedDenomination] *
                      product.priceCents,
                  )}
                </span>
                {product.availableDenominations &&
                  product.availableDenominations.map((denomination, i) => (
                    <Button
                      size='sm'
                      onPress={handleDenominationChange(i)}
                      // selectedDenomination
                      className={cn(
                        'cursor-pointer rounded-full border-[0.5px] border-foreground/40',
                        {
                          'bg-dark-gray dark:bg-foreground/70 text-featured dark:text-background hover:bg-foreground hover:text-background':
                            selectedDenomination === i,
                        },
                      )}
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
                        className={cn('hidden', {
                          'bg-foreground text-background':
                            selectedDenomination === i,
                          'bg-foreground':
                            denomination === product.popularDenomination,
                        })}>
                        <span
                          className={cn(
                            'relative font-space text-[10px] sm:text-sm font-medium whitespace-nowrap',
                          )}>
                          {denomination}
                          {product.unit}
                        </span>
                      </Badge>
                    </Button>
                  ))}
              </div>
              <div className='flex flex-col sm:flex-row gap-3'>
                <div ref={addToCartButtonRef} className='w-full sm:flex-1'>
                  <Button
                    size='lg'
                    color='success'
                    variant='solid'
                    className='w-full font-space font-medium text-sm sm:text-base _lg:text-lg bg-linear-to-r from-featured via-featured to-featured dark:text-white'
                    onPress={handleAddToCart}
                    isLoading={isAdding}
                    isDisabled={isPending}>
                    <span>Add to Cart</span>
                    <Icon name='bag-solid' className='ml-2 size-6 sm:size-6' />
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
            {/*<Divider className='border-color-border/40' />*/}

            <div className='flex flex-wrap items-center gap-4 py-2 md:py-6 lg:py-8'>
              <TerpeneGray name='pinene' id='pine' />
              <TerpeneGray name='hops' id='hops' />
              <TerpeneGray name='humulene' id='humulene' />
              <TerpeneGray name='linalool' id='linalool' />
              <ProfilePill name='Guava' group='flavors' />
              <ProfilePill name='Bright' group='effects' />
              <ProfilePill name='Humulene' group='terpenes' />
            </div>
            <h3 className='font-space'>
              <span className='font-fugaz font-thin opacity-80 mr-2'>
                Experience:
              </span>
              <span className='text-xs sm:text-sm opacity-70 text-color-muted leading-relaxed'>
                {product.potencyProfile}
              </span>
            </h3>

            <h3 className='font-space'>
              <span className='font-fugaz font-thin opacity-80 mr-2'>
                Dosage:
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

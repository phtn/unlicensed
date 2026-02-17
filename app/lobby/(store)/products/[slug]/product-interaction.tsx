'use client'

import {mapFractions} from '@/app/admin/(routes)/inventory/product/product-schema'
import {StoreCategory, StoreProduct} from '@/app/types'
import {AuthModal} from '@/components/auth/auth-modal'
import {ProductProfile} from '@/components/ui/product-profile'
import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {PotencyLevel} from '@/convex/products/d'
import {useAuthCtx} from '@/ctx/auth'
import {useCart} from '@/hooks/use-cart'
import {Icon, IconName} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Badge, Button, Tooltip, useDisclosure} from '@heroui/react'
import {useQuery} from 'convex/react'
import {useRouter} from 'next/navigation'
import {
  useMemo,
  useOptimistic,
  useRef,
  useState,
  useTransition,
  ViewTransition,
} from 'react'

const formatPrice = (priceCents: number) => {
  const dollars = priceCents / 100
  return dollars % 1 === 0 ? `${dollars.toFixed(0)}` : `${dollars.toFixed(2)}`
}

interface ProductInteractionProps {
  product: StoreProduct
  category?: StoreCategory | null
  productId?: Id<'products'>
  isMobile: boolean
}

export const ProductInteraction = ({
  product,
  productId,
  isMobile,
}: ProductInteractionProps) => {
  const [selectedDenomination, setSelectedDenomination] = useState<number>(0)
  const {isOpen, onOpen, onClose} = useDisclosure()
  const {user} = useAuthCtx()
  const router = useRouter()
  const {cart, addItem} = useCart()
  const [isPending, startTransition] = useTransition()
  const addToCartButtonRef = useRef<HTMLDivElement>(null)

  // Optimistic state for add-to-cart operations
  const [optimisticAdding, setOptimisticAdding] = useOptimistic(
    false,
    (_current, isAdding: boolean) => isAdding,
  )
  const [addToCartError, setAddToCartError] = useState<string | null>(null)

  const resolvedProductId =
    productId ?? (product._id as Id<'products'> | undefined)

  // Selected denomination value (e.g. 0.125, 1, 3.5) for price/stock lookups.
  const currentDenominationValue =
    product.availableDenominations?.[selectedDenomination] ?? 0
  const currentDenominationKey = String(currentDenominationValue)
  const denominationForQuery =
    product.availableDenominations?.[selectedDenomination]

  const availableQuantity = useQuery(
    api.productHolds.q.getAvailableQuantity,
    resolvedProductId != null && denominationForQuery !== undefined
      ? {productId: resolvedProductId, denomination: denominationForQuery}
      : 'skip',
  )

  const quantityInCart = useMemo(() => {
    if (!resolvedProductId || !cart?.items) return 0
    return cart.items
      .filter((item) => item.product._id === resolvedProductId)
      .reduce((sum, item) => sum + item.quantity, 0)
  }, [cart?.items, resolvedProductId])

  const handleDenominationChange = (index: number) => () => {
    setSelectedDenomination(index)
  }

  const requireAuthForInteraction = () => {
    if (user) return true
    onOpen()
    return false
  }

  const handleCheckoutPress = () => {
    if (!requireAuthForInteraction()) return

    router.push('/lobby/cart')
  }

  const handleAddToCart = async () => {
    if (!resolvedProductId) {
      console.error('Product ID not available')
      return
    }

    const denomination = currentDenominationValue
    setAddToCartError(null)

    startTransition(async () => {
      setOptimisticAdding(true)
      try {
        await addItem(resolvedProductId, 1, denomination)
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to add to cart'
        setAddToCartError(message)
      } finally {
        setOptimisticAdding(false)
      }
    })
  }

  const isAdding = optimisticAdding || isPending
  const priceByDenomination = formatPrice(
    product.priceByDenomination?.[currentDenominationKey] ??
      product.priceCents ??
      0,
  )

  return (
    <div className='space-y-0 lg:min-h-[78lvh] rounded-3xl md:rounded-tl-none border border-foreground/20 bg-hue dark:bg-dark-table/50 backdrop-blur-xl w-full overflow-hidden'>
      <ProductDetailStats
        product={product}
        quantityInCart={quantityInCart}
        denominationKey={currentDenominationKey}
      />
      <div className='flex flex-col gap-4 p-4 sm:p-5 lg:p-6'>
        <div className='space-y-4 sm:space-y-6'>
          <h1 className='text-3xl lg:text-4xl xl:text-5xl capitalize font-bone font-light text-foreground leading-tight tracking-tight'>
            {product.name.split('-').join(' ')}
          </h1>
          <p className='text-sm opacity-70 leading-relaxed'>
            {product.description}
          </p>
        </div>
        <div className='flex items-start justify-between py-3 sm:py-4'>
          <div className='flex items-center font-okxs text-3xl sm:text-4xl font-semibold text-foreground w-40 md:w-28'>
            <div className='font-light opacity-80 scale-95'>$</div>
            {priceByDenomination}
          </div>

          <div className='flex items-center justify-end md:w-95'>
            <div className='flex flex-wrap items-start gap-2 md:gap-3'>
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
                        product.popularDenomination?.includes(denomination) ? (
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
                      className={cn('flex items-center justify-center top-0', {
                        hidden:
                          !product.popularDenomination?.includes(denomination),
                      })}
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
                            'bg-dark-gray dark:bg-white dark:border-foreground text-white dark:text-dark-gray md:hover:bg-black dark:md:hover:bg-brand dark:md:hover:text-white md:hover:text-brand':
                              selectedDenomination === i,
                          },
                        )}>
                        <span
                          className={cn(
                            'relative font-okxs text-base md:text-lg font-medium whitespace-nowrap portrait:px-0',
                          )}>
                          {product.unit === 'oz'
                            ? (mapFractions[`${denomination}${product.unit}`] ??
                              `${denomination}${product.unit}`)
                            : `${denomination}${product.unit}`}
                        </span>
                      </Button>
                    </Badge>
                  </Tooltip>
                ))}
            </div>
          </div>
        </div>

        {addToCartError && (
          <p className='text-sm text-danger' role='alert'>
            {addToCartError}
          </p>
        )}

        <div className='flex flex-col sm:flex-row gap-3'>
          <div ref={addToCartButtonRef} className='w-full sm:flex-1'>
            <Button
              size='lg'
              color='primary'
              variant='solid'
              disableRipple
              className='w-full h-14 font-polysans font-medium text-base md:text-lg bg-linear-to-r from-brand via-brand to-brand flex items-center'
              onPress={handleAddToCart}
              isDisabled={
                isPending ||
                (availableQuantity !== undefined && availableQuantity < 1)
              }>
              <span>Add to Cart</span>
              <Icon
                name={isAdding ? 'spinners-ring' : 'bag-solid'}
                className='ml-2 size-6 sm:size-6 mb-1'
              />
            </Button>
          </div>
          <ViewTransition>
            {user ? (
              <Button
                size='lg'
                variant='solid'
                isDisabled={isPending || quantityInCart < 1}
                onPress={handleCheckoutPress}
                className='w-full sm:flex-1 h-14 font-polysans font-medium text-lg bg-foreground/95 text-white dark:text-dark-gray'>
                <span>Checkout</span>
              </Button>
            ) : (
              <Button
                size='lg'
                variant='solid'
                onPress={handleCheckoutPress}
                className='w-full sm:flex-1 h-14 font-polysans font-medium text-lg bg-foreground/95 text-white dark:text-dark-gray'>
                <span>Sign in</span>
              </Button>
            )}
          </ViewTransition>
        </div>
        <AuthModal isOpen={isOpen} onClose={onClose} mode='login' />
      </div>

      <div className='p-2 md:p-3'>
        <div className='bg-linear-to-r from-dark-gray/5 via-dark-gray/5 to-dark-gray/5 dark:bg-background/30 rounded-3xl gap-4 p-4 space-y-3'>
          <span className='font-polysans font-normal text-xs uppercase opacity-80 mr-2'>
            Terpenes
          </span>
          <div className='flex flex-wrap items-center gap-2 py-3 border-b-[0.5px] border-dotted dark:border-light-gray/20'>
            {product.terpenes.map((terpene) => (
              <ProductProfile key={terpene} name={terpene} group='terpenes' />
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
      </div>

      <div className='p-4 space-y-4'>
        <h3 className='min-h-14'>
          <span className='font-sans font-semibold tracking-tight opacity-80 mr-2'>
            Experience:
          </span>
          <span className='text-xs sm:text-sm opacity-70 text-color-muted leading-relaxed'>
            {product.potencyProfile}
          </span>
        </h3>

        <h3 className='min-h-14'>
          <span className='font-sans font-semibold tracking-tight opacity-80 mr-2'>
            Consumption:
          </span>
          <span className='text-xs sm:text-sm opacity-70 text-color-muted leading-relaxed'>
            {product.consumption}
          </span>
        </h3>
      </div>
    </div>
  )
}

interface ProductDetailStatsProps {
  product: StoreProduct
  quantityInCart: number
  denominationKey: string
}

const ProductDetailStats = ({
  product,
  quantityInCart,
  denominationKey,
}: ProductDetailStatsProps) => {
  return (
    <div className='flex items-center h-14 border-b border-background/20 bg-background/60 overflow-hidden justify-between gap-1 pl-4 md:w-full'>
      <span className='w-16 md:w-20 text-xs font-okxs'>
        {product.categorySlug.toUpperCase()}
      </span>
      <div className='flex items-center space-x-2'>
        <span>
          <span className='font-bold text-xs md:text-sm opacity-60'>THC</span>{' '}
          <span className='text-sm md:text-base font-polysans font-semibold'>
            {product.thcPercentage}
          </span>
          <span className='text-xs md:text-sm lowercase'>mg</span>
        </span>
        <span className='px-1 md:px-2 text-sm font-thin opacity-50'>|</span>
        <div className='flex items-center space-x-1'>
          <Icon
            name={pmap[product.potencyLevel]}
            className='size-3 md:size-5'
          />
          <span className='capitalize text-sm'>{product.potencyLevel}</span>
        </div>
      </div>

      {quantityInCart > 0 ? (
        <Tooltip key='in-cart' content='In The Bag'>
          <Badge
            size='lg'
            variant='shadow'
            className='px-[0.5px]'
            classNames={{
              badge:
                'aspect-square size-5 md:size-6 text-sm md:text-base translate-x-0 -translate-y-1 rounded-xs flex items-center justify-center rounded-md border-1.5 dark:border-background/85 shadow-md backdrop-blur-2xl bg-brand/90',
            }}
            content={
              <div
                suppressHydrationWarning
                className='flex items-center justify-center rounded-xs py-0.5 px-1 md:mx-0 size-4 aspect-square'>
                <span className='font-okxs font-medium text-xs md:text-sm text-white leading-none drop-shadow-xs'>
                  {quantityInCart}
                </span>
              </div>
            }>
            <div className='w-16 md:w-20 flex items-center justify-end pr-1'>
              <Icon
                name='shopping-bag-fill'
                className='size-4 md:size-5 drop-shadow-xs mt-0.5 md:mt-1 mr-4.5'
              />
            </div>
          </Badge>
        </Tooltip>
      ) : (
        <span className='text-[9px] w-16 md:w-20 text-sm whitespace-nowrap capitalize'>
          <span className='font-polysans font-semibold text-base'>
            {product.stockByDenomination?.[denominationKey] ??
              product.stock ??
              0}
          </span>{' '}
          left
        </span>
      )}
    </div>
  )
}

const pmap: Record<PotencyLevel, IconName> = {
  mild: 'low-bars',
  medium: 'medium-bars',
  high: 'high-bars',
}

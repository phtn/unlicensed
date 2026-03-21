'use client'

import {StoreProduct} from '@/app/types'
import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {useAuthCtx} from '@/ctx/auth'
import {useAddCartItem} from '@/hooks/use-add-cart-item'
import {useProductCartQuantity} from '@/hooks/use-product-cart-quantity'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {formatDenominationDisplay} from '@/utils/formatDenomination'
import {Button, Tooltip, useDisclosure} from '@heroui/react'
import {useQuery} from 'convex/react'
import dynamic from 'next/dynamic'
import {useRouter} from 'next/navigation'
import {memo, useMemo, useState, useTransition} from 'react'
import {ProductDetailStats} from './product-stats'

const AuthModal = dynamic(
  () =>
    import('@/components/auth/auth-modal').then((module) => module.AuthModal),
  {ssr: false},
)

const formatPrice = (priceCents: number) => {
  const dollars = priceCents / 100
  return dollars % 1 === 0 ? `${dollars.toFixed(0)}` : `${dollars.toFixed(2)}`
}

const formatProductDenominationLabel = (
  denomination: number,
  unit: string,
  categorySlug: string,
) => {
  if (categorySlug === 'vapes') {
    return `${denomination} units`
  }

  return formatDenominationDisplay(denomination, unit)
}

interface ProductInteractionProps {
  product: StoreProduct
  productId?: Id<'products'>
}

type DenominationOption = {
  label: string
  value: number
  isPopular: boolean
}

const ProductSummary = memo(({product}: {product: StoreProduct}) => (
  <div className='space-y-2'>
    {product.brand && (
      <p className='text-sm font-clash opacity-70 capitalize'>
        <span>{product.brand.join(', ')}</span>
        {product.productType && <span className='px-1'>&middot;</span>}
        {product.productType && (
          <span className='ml-2'>{product.productType}</span>
        )}
      </p>
    )}
    <h1 className='text-3xl lg:text-4xl xl:text-4xl capitalize font-clash text-foreground leading-tight tracking-tight'>
      {product.name.split('-').join(' ')}
    </h1>
    <p className='text-sm font-okxs opacity-70 leading-relaxed'>
      {product.description}
    </p>
  </div>
))

ProductSummary.displayName = 'ProductSummary'

const DenominationPicker = memo(
  ({
    options,
    selectedIndex,
    onSelect,
  }: {
    options: DenominationOption[]
    selectedIndex: number
    onSelect: (index: number) => void
  }) => (
    <div className='flex flex-wrap items-start gap-2 md:gap-3'>
      {options.map((option, index) => {
        const isSelected = selectedIndex === index

        return (
          <button
            type='button'
            key={option.value}
            onClick={() => onSelect(index)}
            aria-pressed={isSelected}
            className={cn(
              'relative inline-flex min-h-10 items-center justify-center border border-foreground/20 bg-sidebar px-3 text-base font-medium whitespace-nowrap transition-colors rounded-none font-okxs portrait:px-2',
              isSelected
                ? 'bg-dark-gray text-white md:hover:bg-black dark:bg-white dark:text-dark-gray dark:md:hover:bg-brand dark:md:hover:text-white'
                : 'text-foreground/85 hover:border-foreground/35',
            )}>
            <Tooltip
              content={
                <div className='flex items-center space-x-1'>
                  <Icon name='hot' className='size-3 text-yellow-500' />
                  <span className='font-medium'>Popular</span>
                </div>
              }>
              {option.isPopular ? (
                <div className='absolute -right-2 -top-2 inline-flex size-4.5 items-center justify-center rounded-sm rounded-ss-md rounded-ee-md bg-transparent text-yellow-500 -rotate-45'>
                  <Icon
                    name='hot'
                    className='absolute w-5 h-4 translate-y-[0.33px] text-dark-table rotate-25'
                  />
                  <Icon name='hot' className='size-3.5 rotate-25' />
                </div>
              ) : null}
            </Tooltip>
            <span>{option.label}</span>
          </button>
        )
      })}
    </div>
  ),
)

DenominationPicker.displayName = 'DenominationPicker'

export const ProductInteraction = ({
  product,
  productId,
}: ProductInteractionProps) => {
  const [selectedDenominationIndex, setSelectedDenominationIndex] = useState(0)
  const {isOpen, onOpen, onClose} = useDisclosure()
  const {user} = useAuthCtx()
  const router = useRouter()
  const addItem = useAddCartItem()
  const quantityInCart = useProductCartQuantity(
    productId ?? (product._id as Id<'products'> | undefined),
  )
  const [isNavigatingToCheckout, startCheckoutTransition] = useTransition()
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [addToCartError, setAddToCartError] = useState<string | null>(null)

  const resolvedProductId =
    productId ?? (product._id as Id<'products'> | undefined)
  const denominationOptions = useMemo<DenominationOption[]>(() => {
    const popularOptions = new Set(product.popularDenomination ?? [])

    return (product.availableDenominations ?? []).map((denomination) => ({
      value: denomination,
      isPopular: popularOptions.has(denomination),
      label: formatProductDenominationLabel(
        denomination,
        product.unit ?? '',
        product.categorySlug ?? '',
      ),
    }))
  }, [
    product.availableDenominations,
    product.categorySlug,
    product.popularDenomination,
    product.unit,
  ])

  // Selected denomination value (e.g. 0.125, 1, 3.5) for price/stock lookups.
  const currentDenominationValue =
    denominationOptions[
      Math.min(selectedDenominationIndex, denominationOptions.length - 1)
    ]?.value ?? 0
  const currentDenominationKey = String(currentDenominationValue)
  const denominationForQuery =
    denominationOptions[
      Math.min(selectedDenominationIndex, denominationOptions.length - 1)
    ]?.value

  const availableQuantity = useQuery(
    api.productHolds.q.getAvailableQuantity,
    resolvedProductId != null && denominationForQuery !== undefined
      ? {productId: resolvedProductId, denomination: denominationForQuery}
      : 'skip',
  )

  const requireAuthForInteraction = () => {
    if (user) return true
    onOpen()
    return false
  }

  const handleCheckoutPress = () => {
    if (!requireAuthForInteraction()) return

    startCheckoutTransition(() => {
      router.push('/lobby/cart')
    })
  }

  const handleAddToCart = async () => {
    if (!resolvedProductId || denominationForQuery === undefined) {
      console.error('Product ID not available')
      return
    }

    setAddToCartError(null)
    setIsAddingToCart(true)

    try {
      await addItem(resolvedProductId, 1, denominationForQuery)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to add to cart'
      setAddToCartError(message)
    } finally {
      setIsAddingToCart(false)
    }
  }

  const priceByDenomination = formatPrice(
    product.priceByDenomination?.[currentDenominationKey] ??
      product.priceCents ??
      0,
  )
  const isCheckoutDisabled = isNavigatingToCheckout || quantityInCart < 1
  const isAddToCartDisabled =
    isAddingToCart ||
    denominationForQuery === undefined ||
    (availableQuantity !== undefined && availableQuantity < 1)

  return (
    <>
      <ProductDetailStats
        product={product}
        quantityInCart={quantityInCart}
        denominationKey={currentDenominationKey}
        availableQuantity={availableQuantity}
      />
      <div className='flex flex-col gap-4 p-4 sm:p-5 lg:p-6 border-t border-foreground/20'>
        <ProductSummary product={product} />

        <div className='flex items-start justify-between gap-4 py-3 sm:py-4'>
          <div className='flex items-center font-okxs text-3xl sm:text-4xl font-semibold text-foreground w-40 md:w-28'>
            <div className='font-light opacity-80 scale-95'>$</div>
            {priceByDenomination}
          </div>

          <div className='flex items-center justify-end md:w-95'>
            <DenominationPicker
              options={denominationOptions}
              selectedIndex={selectedDenominationIndex}
              onSelect={setSelectedDenominationIndex}
            />
          </div>
        </div>

        {addToCartError && (
          <p className='text-sm text-danger' role='alert'>
            {addToCartError}
          </p>
        )}

        <div className='flex flex-col sm:flex-row gap-3'>
          <Button
            size='lg'
            color='primary'
            variant='solid'
            radius='none'
            disableRipple
            className='flex h-14 md:h-13 w-full items-center bg-linear-to-r from-brand via-brand to-brand font-clash text-base font-medium md:text-lg sm:flex-1'
            onPress={() => void handleAddToCart()}
            isDisabled={isAddToCartDisabled}>
            <span>Add to Cart</span>
            <Icon
              name={isAddingToCart ? 'spinners-ring' : 'bag-solid'}
              className='ml-2 mb-1 size-6'
            />
          </Button>
          <Button
            size='lg'
            variant='solid'
            onPress={handleCheckoutPress}
            radius='none'
            isDisabled={user ? isCheckoutDisabled : false}
            className='h-14 md:h-13 w-full bg-foreground/95 font-clash text-lg font-medium text-white dark:text-dark-gray sm:flex-1'>
            <span>{user ? 'Checkout' : 'Sign in'}</span>
          </Button>
        </div>
      </div>
      {isOpen ? (
        <AuthModal isOpen={isOpen} onClose={onClose} mode='login' />
      ) : null}
    </>
  )
}

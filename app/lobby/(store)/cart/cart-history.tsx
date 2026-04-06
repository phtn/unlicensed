'use client'

import FuzzyText from '@/components/FuzzyText'
import {Id} from '@/convex/_generated/dataModel'
import {useCart} from '@/hooks/use-cart'
import {
  CartHistoryItemWithProduct,
  useCartHistory,
} from '@/hooks/use-cart-history'
import {useStorageUrls} from '@/hooks/use-storage-urls'
import {Icon} from '@/lib/icons'
import {formatDenominationDisplay} from '@/utils/formatDenomination'
import {formatPrice} from '@/utils/formatPrice'
import {Button, Card} from '@heroui/react'
import {memo, useCallback, useMemo, useState, useTransition} from 'react'

import {LegacyImage} from '@/components/ui/legacy-image'

interface CartHistoryItemCardProps {
  item: CartHistoryItemWithProduct
  onAddToCart: (
    productId: Id<'products'>,
    denomination?: number,
  ) => Promise<void>
  onRemove: (productId: Id<'products'>, denomination?: number) => void
}

const CartHistoryItemCard = memo(
  ({item, onAddToCart, onRemove}: CartHistoryItemCardProps) => {
    const [isAdding, setIsAdding] = useState(false)

    const handleAddToCart = async () => {
      setIsAdding(true)
      try {
        await onAddToCart(item.productId, item.denomination)
      } finally {
        setIsAdding(false)
      }
    }

    const handleRemove = () => onRemove(item.productId, item.denomination)
    // Resolve product image URL
    const resolveUrl = useStorageUrls(
      item.product.image ? [item.product.image] : [],
    )
    const productImageUrl = useMemo(
      () => (item.product.image ? resolveUrl(item.product.image) : ''),
      [resolveUrl, item.product.image],
    )

    const displayPrice = useMemo(() => {
      const denomination = item.denomination ?? 1
      const denomKey = String(denomination)
      const byDenom = item.product.priceByDenomination
      const priceFromDenom =
        byDenom &&
        Object.keys(byDenom).length > 0 &&
        typeof byDenom[denomKey] === 'number'
          ? byDenom[denomKey]
          : null
      return priceFromDenom != null && priceFromDenom >= 0
        ? priceFromDenom
        : (item.product.priceCents ?? 0) * denomination
    }, [item])

    return (
      <Card className='relative bg-linear-to-r from-foreground/5 via-transparent to-transparent border border-foreground/10 overflow-visible rounded-xs'>
        <Card.Content className='relative overflow-visible'>
          <div className='flex gap-3 items-center'>
            <div className='relative size-14 shrink-0 overflow-hidden'>
              {productImageUrl ? (
                <LegacyImage
                  src={productImageUrl}
                  alt={item.product.name}
                  className='w-full h-full object-cover'
                  loading='lazy'
                />
              ) : (
                <div className='w-full h-full bg-foreground/10 flex items-center justify-center'>
                  <Icon name='bag-solid' className='size-6 opacity-30' />
                </div>
              )}
            </div>

            <div className='flex-1 min-w-0 gap-1'>
              <h4 className='font-medium truncate text-base md:text-lg'>
                {item.product.name}
              </h4>
              <div className='flex items-center gap-2 opacity-60 font-okxs text-sm md:text-base'>
                {item.denomination && item.product.unit && (
                  <span>
                    {formatDenominationDisplay(
                      item.denomination,
                      item.product.unit,
                    )}
                  </span>
                )}
                <span className=''>${formatPrice(displayPrice)}</span>
              </div>
            </div>

            <div className='flex items-end'>
              <Button
                size='sm'
                variant='primary'
                isDisabled={isAdding}
                onPress={handleAddToCart}
                className='font-clash bg-brand dark:bg-white dark:text-dark-gray font-medium text-base mt-4 rounded-xs'>
                <span className='flex items-center gap-1'>
                  <Icon
                    name={isAdding ? 'spinners-ring' : 'plus'}
                    className='size-4 m-auto'
                  />
                  <span>Add</span>
                </span>
              </Button>
            </div>
          </div>
          <Button
            size='sm'
            isIconOnly
            variant='tertiary'
            onPress={handleRemove}
            className='border absolute -right-8 -top-8 hover:opacity-100'>
            <Icon name='x' className='size-3.5 m-auto' />
          </Button>
        </Card.Content>
      </Card>
    )
  },
)
CartHistoryItemCard.displayName = 'CartHistoryItemCard'

interface CartHistoryProps {
  onItemAdded?: VoidFunction
}

export const CartHistory = ({onItemAdded}: CartHistoryProps) => {
  const {historyItems, removeFromHistory, clearHistory, isLoading} =
    useCartHistory()
  const {addItem} = useCart()
  const [, startTransition] = useTransition()

  const handleAddToCart = useCallback(
    async (productId: Id<'products'>, denomination?: number) => {
      try {
        await addItem(productId, 1, denomination)
        removeFromHistory(productId, denomination)
        startTransition(() => {
          onItemAdded?.()
        })
      } catch (error) {
        console.error('Failed to add item to cart:', error)
      }
    },
    [addItem, removeFromHistory, onItemAdded],
  )

  const handleRemoveFromHistory = useCallback(
    (productId: Id<'products'>, denomination?: number) => {
      removeFromHistory(productId, denomination)
    },
    [removeFromHistory],
  )

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-8'>
        <Icon name='spinners-ring' className='size-8 text-limited' />
      </div>
    )
  }

  if (historyItems.length === 0) {
    return null
  }

  return (
    <div className='w-full max-w-2xl px-6 mx-autopy-6'>
      <div className='flex items-center justify-between mb-4 md:mb-8'>
        <h2 className='font-polysans'>Your cart history</h2>
        <Button
          size='sm'
          variant='tertiary'
          onPress={clearHistory}
          className='group text-sm font-brk opacity-60 hover:opacity-100'>
          <span>Clear</span>
          <span className='relative inline-block leading-none'>
            <span className='invisible'>history</span>
            <span className='absolute inset-0 transition-opacity duration-150 group-hover:opacity-0'>
              history
            </span>
            <FuzzyText
              className='pointer-events-none absolute -left-0.5 top-2 -translate-y-1/2 opacity-0 transition-opacity duration-150 group-hover:opacity-100'
              compact
              enableHover={false}
              fuzzRange={6}
              baseIntensity={0.22}
              fontSize='11px'
              fontFamily='inherit'>
              history
            </FuzzyText>
          </span>
        </Button>
      </div>
      <div className='space-y-4 md:space-y-3'>
        {historyItems.map((item) => {
          const itemKey = `${item.productId}-${item.denomination ?? 'default'}`
          return (
            <CartHistoryItemCard
              key={itemKey}
              item={item}
              onAddToCart={handleAddToCart}
              onRemove={handleRemoveFromHistory}
            />
          )
        })}
      </div>
    </div>
  )
}

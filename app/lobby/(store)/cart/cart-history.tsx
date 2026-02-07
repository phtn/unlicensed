'use client'

import {HyperBadge} from '@/components/main/badge'
import {Id} from '@/convex/_generated/dataModel'
import {useCart} from '@/hooks/use-cart'
import {
  CartHistoryItemWithProduct,
  useCartHistory,
} from '@/hooks/use-cart-history'
import {useStorageUrls} from '@/hooks/use-storage-urls'
import {Icon} from '@/lib/icons'
import {formatPrice} from '@/utils/formatPrice'
import {Button, Card, CardBody, Image} from '@heroui/react'
import {useMemo, useState, useTransition} from 'react'

interface CartHistoryItemCardProps {
  item: CartHistoryItemWithProduct
  onAddToCart: () => Promise<void>
  onRemove: () => void
  isAdding: boolean
}

const CartHistoryItemCard = ({
  item,
  onAddToCart,
  onRemove,
  isAdding,
}: CartHistoryItemCardProps) => {
  // Resolve product image URL
  const resolveUrl = useStorageUrls(
    item.product.image ? [item.product.image] : [],
  )
  const productImageUrl = useMemo(
    () => (item.product.image ? resolveUrl(item.product.image) : ''),
    [resolveUrl, item.product.image],
  )

  const displayPrice = useMemo(() => {
    const price = item.product.priceCents ?? 0
    const denomination = item.denomination ?? 1
    return price * denomination
  }, [item.product.priceCents, item.denomination])

  return (
    <Card
      shadow='none'
      className='bg-linear-to-r from-foreground/5 via-transparent to-transparent border border-foreground/10 rounded-xl overflow-visible'>
      <CardBody className='p-3 relative overflow-visible'>
        <div className='flex gap-3 items-center'>
          <div className='relative size-14 shrink-0 rounded-lg overflow-hidden'>
            {productImageUrl ? (
              <Image
                radius='none'
                src={productImageUrl}
                alt={item.product.name}
                className='w-full h-full object-cover'
              />
            ) : (
              <div className='w-full h-full bg-foreground/10 flex items-center justify-center'>
                <Icon name='bag-solid' className='size-6 opacity-30' />
              </div>
            )}
          </div>

          <div className='flex-1 min-w-0'>
            <h4 className='font-medium text-sm truncate'>
              {item.product.name}
            </h4>
            <div className='flex items-center gap-2 text-xs opacity-60'>
              {item.denomination && item.product.unit && (
                <span>
                  {item.denomination}
                  {item.product.unit}
                </span>
              )}
              <span className='font-space'>${formatPrice(displayPrice)}</span>
            </div>
          </div>

          <div className='flex items-end'>
            <Button
              size='sm'
              variant='solid'
              color='primary'
              isDisabled={isAdding}
              onPress={onAddToCart}
              startContent={
                <Icon
                  name={isAdding ? 'spinners-ring' : 'plus'}
                  className='size-4 -mr-2'
                />
              }
              className='font-polysans dark:bg-white dark:text-dark-gray font-medium text-sm'>
              Add
            </Button>
            <Button
              size='sm'
              isIconOnly
              radius='full'
              variant='solid'
              onPress={onRemove}
              className='border absolute -right-4 -top-4 hover:opacity-100'>
              <Icon name='x' className='size-3.5' />
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}

interface CartHistoryProps {
  onItemAdded?: VoidFunction
}

export const CartHistory = ({onItemAdded}: CartHistoryProps) => {
  const {historyItems, removeFromHistory, clearHistory, isLoading} =
    useCartHistory()
  const {addItem} = useCart()
  const [addingItems, setAddingItems] = useState<Set<string>>(new Set())
  const [, startTransition] = useTransition()

  const handleAddToCart = async (item: CartHistoryItemWithProduct) => {
    const itemKey = `${item.productId}-${item.denomination ?? 'default'}`
    setAddingItems((prev) => new Set(prev).add(itemKey))

    try {
      await addItem(item.productId, 1, item.denomination)
      // Remove from history after successfully adding to cart
      removeFromHistory(item.productId, item.denomination)
      startTransition(() => {
        onItemAdded?.()
      })
    } catch (error) {
      console.error('Failed to add item to cart:', error)
    } finally {
      setAddingItems((prev) => {
        const next = new Set(prev)
        next.delete(itemKey)
        return next
      })
    }
  }

  const handleRemoveFromHistory = (
    productId: Id<'products'>,
    denomination?: number,
  ) => {
    removeFromHistory(productId, denomination)
  }

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
    <div className='w-full max-w-xl mx-auto py-6'>
      <div className='flex items-center justify-between mb-8'>
        <HyperBadge variant='limited' title='Previously in cart'>
          <h2 className='font-polysans'>Previously in cart</h2>
        </HyperBadge>
        <Button
          size='sm'
          variant='light'
          onPress={clearHistory}
          className='text-xs font-brk opacity-50 hover:opacity-100'>
          Clear history
        </Button>
      </div>
      <div className='space-y-2'>
        {historyItems.map((item) => {
          const itemKey = `${item.productId}-${item.denomination ?? 'default'}`
          return (
            <CartHistoryItemCard
              key={itemKey}
              item={item}
              onAddToCart={() => handleAddToCart(item)}
              onRemove={() =>
                handleRemoveFromHistory(item.productId, item.denomination)
              }
              isAdding={addingItems.has(itemKey)}
            />
          )
        })}
      </div>
    </div>
  )
}

import {ClassName} from '@/app/types'
import {HyperBadge} from '@/components/main/badge'
import {AnimatedNumber} from '@/components/ui/animated-number'
import {Id} from '@/convex/_generated/dataModel'
import {ProductType} from '@/convex/products/d'
import {useDisclosure} from '@/hooks/use-disclosure'
import {useStorageUrls} from '@/hooks/use-storage-urls'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {getUnitPriceBreakdown} from '@/utils/cartPrice'
import {formatDenominationDisplay} from '@/utils/formatDenomination'
import {formatPrice} from '@/utils/formatPrice'
import {
  Button,
  Card,
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalContainer,
  ModalDialog,
  ModalFooter,
  ModalHeader,
} from '@heroui/react'
import {memo, useEffect, useMemo, useState, useTransition} from 'react'

import {LegacyImage} from '@/components/ui/legacy-image'

interface CartItemProps {
  item: {
    product: ProductType & {
      _id: Id<'products'>
    }
    quantity: number
    denomination?: number
    bundleCartItemIndex?: number
    bundleLineIndex?: number
  }
  itemPrice: number
  onUpdate: (
    productId: Id<'products'>,
    quantity: number,
    denomination?: number,
  ) => Promise<void>
  onRemove: (
    productId: Id<'products'>,
    denomination?: number,
    bundleCartItemIndex?: number,
    bundleLineIndex?: number,
  ) => Promise<void>
  className?: ClassName
}

export const CartItem = memo(
  ({item, itemPrice, onUpdate, onRemove, className}: CartItemProps) => {
    const [quantity, setQuantity] = useState(item.quantity)
    const [, startTransition] = useTransition()

    // Sync local quantity with prop when it changes externally
    useEffect(() => {
      startTransition(() => {
        setQuantity(item.quantity)
      })
    }, [item.quantity])

    // Resolve product image URL
    const resolveUrl = useStorageUrls(
      item.product.image ? [item.product.image] : [],
    )
    const productImageUrl = useMemo(
      () => (item.product.image ? resolveUrl(item.product.image) : ''),
      [resolveUrl, item.product.image],
    )

    const isBundleLine = item.bundleCartItemIndex !== undefined
    const priceBreakdown = useMemo(
      () =>
        isBundleLine
          ? null
          : getUnitPriceBreakdown(item.product, item.denomination),
      [isBundleLine, item.denomination, item.product],
    )
    const isOnSale = priceBreakdown?.isOnSale === true
    const regularItemPrice = priceBreakdown?.regularCents ?? itemPrice
    const regularLinePrice = regularItemPrice * quantity

    const handleQuantityChange = async (newQuantity: number) => {
      if (newQuantity < 1) {
        startTransition(async () => {
          await onRemove(
            item.product._id,
            item.denomination,
            item.bundleCartItemIndex,
            item.bundleLineIndex,
          )
        })
      } else if (!isBundleLine) {
        setQuantity(newQuantity) // Optimistic update
        startTransition(async () => {
          await onUpdate(item.product._id, newQuantity, item.denomination)
        })
      }
    }

    const {isOpen, onOpen, onClose} = useDisclosure()

    const handleRemoveConfirmation = () => {
      onOpen()
    }

    const handleConfirmRemove = () => {
      startTransition(async () => {
        await onRemove(
          item.product._id,
          item.denomination,
          item.bundleCartItemIndex,
          item.bundleLineIndex,
        )
        onClose()
      })
    }

    return (
      <>
        <Card
          className={cn(
            'border border-b-0 last:border-b border-foreground/50 bg-white dark:bg-background dark:border-foreground/50 border-dashed rounded-none first:rounded-t-xs! last:rounded-b-xs!',
            className,
          )}>
          <Card.Content>
            <div className='flex min-w-0 gap-3 md:gap-4'>
              <div className='relative size-24 md:w-28 md:h-28 shrink-0 overflow-hidden'>
                <LegacyImage
                  src={productImageUrl ?? undefined}
                  alt={item.product.name}
                  className='w-full h-full object-cover'
                />
              </div>
              <div className='flex-1 min-w-0 flex flex-col gap-1 md:gap-3 py-1'>
                <div className='flex min-w-0 justify-between items-start'>
                  <div className='min-w-0'>
                    <h3 className='font-okxs font-semibold text-base md:text-xl truncate'>
                      {item.product.name}
                    </h3>
                    <div
                      id='price-per-denom'
                      className='flex items-center gap-2 flex-wrap mt-3'>
                      {item.denomination != null && (
                        <div className='flex items-baseline gap-2'>
                          <p className='font-okxs font-medium text-base md:text-lg text-foreground'>
                            ${formatPrice(itemPrice)}
                          </p>
                          {isOnSale ? (
                            <p className='font-okxs text-xs text-foreground/45 line-through md:text-sm'>
                              ${formatPrice(regularItemPrice)}
                            </p>
                          ) : null}
                        </div>
                      )}
                      <span className='opacity-60 font-thin italic'>per</span>
                      {item.denomination != null && (
                        <p className='font-okxs text-sm md:text-base text-foreground/80 tracking-wide'>
                          {formatDenominationDisplay(
                            item.denomination,
                            item.product.unit ?? '',
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className='mr-1 text-right font-okxs'>
                    <p className='font-medium text-xl'>
                      $
                      <AnimatedNumber
                        mass={1.2}
                        stiffness={60}
                        value={(itemPrice * quantity) / 100}
                      />
                    </p>
                    {isOnSale ? (
                      <p className='text-xs text-foreground/45 line-through md:text-sm'>
                        ${formatPrice(regularLinePrice)}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-x-1'>
                    {!isBundleLine ? (
                      <>
                        <Button
                          isIconOnly
                          variant='ghost'
                          className='h-7 w-8 rounded-xs text-foreground/60 hover:text-foreground'
                          onPress={() => handleQuantityChange(quantity - 1)}>
                          <Icon name='minus' className='size-5 mb-2 mx-auto' />
                        </Button>

                        <p className='font-okxs font-medium text-lg w-10 h-7 text-center'>
                          <AnimatedNumber value={quantity} />
                        </p>

                        <Button
                          isIconOnly
                          variant='ghost'
                          className='h-7 w-8 rounded-xs text-foreground/60 hover:text-foreground'
                          onPress={() => handleQuantityChange(quantity + 1)}>
                          <Icon name='plus' className='size-5 mb-2 mx-auto' />
                        </Button>
                      </>
                    ) : (
                      <p className='font-okxs font-medium text-lg w-10 text-center'>
                        <AnimatedNumber value={quantity} />
                      </p>
                    )}
                    {isBundleLine && (
                      <HyperBadge variant='deal' size='sm'>
                        Bundle
                      </HyperBadge>
                    )}
                  </div>
                  <Button
                    size='sm'
                    isIconOnly
                    variant='ghost'
                    className='h-7 w-8 flex items-center rounded-sm opacity-60 hover:opacity-100 justify-center hover:bg-transparent'
                    onPress={handleRemoveConfirmation}>
                    <Icon
                      name='trash'
                      className='size-5 md:size-6 mb-2 ml-[0.20px]'
                    />
                  </Button>
                </div>
              </div>
            </div>
          </Card.Content>
        </Card>

        <Modal isOpen={isOpen}>
          <ModalBackdrop>
            <ModalContainer size='sm' placement='center'>
              <ModalDialog className='mt-28 bg-linear-to-b dark:from-slate-500 dark:to-slate-700 rounded-xs border border-slate-700'>
                <ModalHeader className='font-bone font-semibold text-lg tracking-wide'>
                  Remove item?
                </ModalHeader>
                <ModalBody>
                  <p className='text-foreground text-sm'>
                    Remove <strong>{item.product.name}</strong>
                    {item.denomination != null ? (
                      <span className='ml-1 dark:text-pink-300 text-brand font-semibold'>
                        <span className='font-ios text-xs text-foreground/50'>
                          (
                        </span>
                        {formatDenominationDisplay(
                          item.denomination,
                          item.product.unit ?? '',
                        )}
                        <span className='font-ios text-xs text-foreground/50'>
                          )
                        </span>
                      </span>
                    ) : (
                      ''
                    )}{' '}
                    from your cart?
                  </p>
                </ModalBody>
                <ModalFooter className='gap-4 dark:bg-background/20 bg-sidebar font-clash p-4 flex items-center'>
                  <Button
                    size='sm'
                    variant='ghost'
                    onPress={onClose}
                    className='dark:hover:bg-black/8 rounded-xs px-4 _border dark:border-transparent hover:border-foreground/10'>
                    Cancel
                  </Button>
                  <Button
                    size='sm'
                    variant='primary'
                    onPress={handleConfirmRemove}
                    className='bg-red-500/80 rounded-xs px-4 border-0 shadow-none'>
                    Remove
                  </Button>
                </ModalFooter>
              </ModalDialog>
            </ModalContainer>
          </ModalBackdrop>
        </Modal>
      </>
    )
  },
)

CartItem.displayName = 'CartItem'

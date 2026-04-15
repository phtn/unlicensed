'use client'

import {
  type CartItemWithProduct,
  isProductCartItemWithProduct,
} from '@/hooks/use-cart'
import {Icon} from '@/lib/icons'
import {getUnitPriceBreakdown} from '@/utils/cartPrice'
import {formatDenominationDisplay} from '@/utils/formatDenomination'
import {formatPrice} from '@/utils/formatPrice'
import type {Id} from '@/convex/_generated/dataModel'
import {Button} from '@heroui/react'
import Image from 'next/image'
import Link from 'next/link'
import type {TransitionStartFunction} from 'react'
import {BundleCartItem} from './bundle-cart-item'

export type CartDrawerItemsOptimisticAction =
  | {
      type: 'update'
      productId: Id<'products'>
      quantity: number
      denomination?: number
    }
  | {type: 'remove'; productId: Id<'products'>; denomination?: number}
  | {type: 'removeBundle'; itemIndex: number}

interface CartDrawerItemsProps {
  cartItems: CartItemWithProduct[]
  resolveUrl: (url: string) => string | null
  isPending: boolean
  startTransition: TransitionStartFunction
  applyOptimisticCartAction: (
    action: CartDrawerItemsOptimisticAction,
  ) => void
  updateItem: (
    productId: Id<'products'>,
    quantity: number,
    denomination?: number,
  ) => Promise<void>
  removeItem: (
    productId: Id<'products'>,
    denomination?: number,
  ) => Promise<void>
  removeBundle: (itemIndex: number) => Promise<void>
}

export const CartDrawerItems = ({
  cartItems,
  resolveUrl,
  isPending,
  startTransition,
  applyOptimisticCartAction,
  updateItem,
  removeItem,
  removeBundle,
}: CartDrawerItemsProps) => {
  const removeBundleItem = async (itemIndex: number) => {
    applyOptimisticCartAction({
      type: 'removeBundle',
      itemIndex,
    })
    await removeBundle(itemIndex)
  }

  return (
    <div className='px-4 mb-6'>
      {cartItems.map((item, index) => {
        if (isProductCartItemWithProduct(item)) {
          const product = item.product
          const denomination = item.denomination
          const priceBreakdown = getUnitPriceBreakdown(product, denomination)
          const itemPrice = priceBreakdown.unitCents
          const totalPrice = itemPrice * item.quantity
          const regularTotalPrice =
            priceBreakdown.regularCents * item.quantity
          const productImageUrl = resolveUrl(product.image ?? '')
          const hasImage = Boolean(product.image && productImageUrl)

          return (
            <div
              key={`${product._id}-${item.denomination ?? 'default'}`}
              className='flex gap-3 p-1 md:p-3 first:rounded-t-lg last:rounded-b-lg border border-b-0 last:border-b border-foreground/15 bg-card/50'>
              <div className='relative w-21 h-21 shrink-0 rounded-xs overflow-hidden bg-muted'>
                {hasImage ? (
                  <Image
                    width={1000}
                    height={1000}
                    src={productImageUrl ?? ''}
                    alt={product.name ?? 'Product'}
                    className='w-full h-full object-cover'
                  />
                ) : (
                  <div className='w-full h-full flex items-center justify-center'>
                    <Icon
                      name='bag-solid'
                      className='size-6 text-muted-foreground'
                    />
                  </div>
                )}
              </div>
              <div className='flex-1 min-w-0 flex flex-col justify-between gap-1'>
                <div className='flex items-start justify-between gap-2'>
                  <div className='min-w-0'>
                    <Link href={`/lobby/products/${product.slug}`}>
                      <h3 className='font-medium font-okxs md:text-lg truncate'>
                        {product.name ?? 'Product'}
                      </h3>
                    </Link>
                    {item.denomination != null && (
                      <p className='text-base text-muted-foreground font-okxs'>
                        {formatDenominationDisplay(
                          item.denomination,
                          product.unit ?? '',
                        )}
                      </p>
                    )}
                  </div>
                  <div className='shrink-0 text-right font-okxs'>
                    <p className='font-medium text-lg'>
                      ${formatPrice(totalPrice)}
                    </p>
                    {priceBreakdown.isOnSale ? (
                      <p className='text-xs text-muted-foreground line-through'>
                        ${formatPrice(regularTotalPrice)}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-1'>
                    <Button
                      isIconOnly
                      size='sm'
                      variant='ghost'
                      isDisabled={isPending}
                      className='h-7 w-8 rounded-xs'
                      onPress={() => {
                        const newQty = item.quantity - 1
                        startTransition(async () => {
                          if (newQty < 1) {
                            applyOptimisticCartAction({
                              type: 'remove',
                              productId: product._id,
                              denomination: item.denomination,
                            })
                            await removeItem(product._id, item.denomination)
                          } else {
                            applyOptimisticCartAction({
                              type: 'update',
                              productId: product._id,
                              quantity: newQty,
                              denomination: item.denomination,
                            })
                            await updateItem(
                              product._id,
                              newQty,
                              item.denomination,
                            )
                          }
                        })
                      }}>
                      <Icon name='minus' className='size-4 m-auto' />
                    </Button>
                    <span className='font-okxs text-base font-medium w-8 text-center'>
                      {item.quantity}
                    </span>
                    <Button
                      isIconOnly
                      size='sm'
                      variant='ghost'
                      isDisabled={isPending}
                      className='h-7 w-8 rounded-xs'
                      onPress={() => {
                        const newQty = item.quantity + 1
                        startTransition(async () => {
                          applyOptimisticCartAction({
                            type: 'update',
                            productId: product._id,
                            quantity: newQty,
                            denomination: item.denomination,
                          })
                          await updateItem(
                            product._id,
                            newQty,
                            item.denomination,
                          )
                        })
                      }}>
                      <Icon name='plus' className='size-4 m-auto' />
                    </Button>
                  </div>
                  <Button
                    size='sm'
                    isIconOnly
                    variant='ghost'
                    className='w-8 h-7 rounded-xs text-muted-foreground opacity-80 hover:opacity-100'
                    isDisabled={isPending}
                    onPress={() => {
                      startTransition(async () => {
                        applyOptimisticCartAction({
                          type: 'remove',
                          productId: product._id,
                          denomination: item.denomination,
                        })
                        await removeItem(product._id, item.denomination)
                      })
                    }}>
                    <Icon name='trash' className='size-5 m-auto' />
                  </Button>
                </div>
              </div>
            </div>
          )
        }

        return (
          <BundleCartItem
            key={`bundle-${item.bundleType}-${index}`}
            item={item}
            itemIndex={index}
            onRemove={async (idx) => {
              startTransition(async () => {
                await removeBundleItem(idx)
              })
            }}
            onEdit={removeBundleItem}
            isPending={isPending}
          />
        )
      })}
    </div>
  )
}

'use client'

import Image from '@/components/ui/app-image'
import type {Id} from '@/convex/_generated/dataModel'
import {
  type CartItemWithProduct,
  isProductCartItemWithProduct,
  type ProductCartItemWithProduct,
} from '@/hooks/use-cart'
import {Icon} from '@/lib/icons'
import {getUnitPriceBreakdown} from '@/utils/cartPrice'
import {formatDenominationDisplay} from '@/utils/formatDenomination'
import {formatPrice} from '@/utils/formatPrice'
import {Button} from '@heroui/react'
import Link from 'next/link'
import {
  memo,
  type TransitionStartFunction,
  useCallback,
  useMemo,
  useState,
  ViewTransition,
} from 'react'
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
  applyOptimisticCartAction: (action: CartDrawerItemsOptimisticAction) => void
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

type BundleCartDrawerItem = Extract<CartItemWithProduct, {bundleType: string}>

const CART_DRAWER_ITEM_VIEW_TRANSITION = 'cart-drawer-item'
const CART_DRAWER_ITEM_SHIFT_VIEW_TRANSITION = 'cart-drawer-item-shift'

const getProductCartItemKey = (
  productId: Id<'products'>,
  denomination?: number,
) => `product:${productId}:${denomination ?? 'default'}`

const getBundleCartItemSignature = (item: BundleCartDrawerItem) =>
  [
    item.bundleType,
    item.variationIndex,
    item.bundleItemsWithProducts
      .map(
        (bundleItem) =>
          `${bundleItem.productId}:${bundleItem.denomination}:${bundleItem.quantity}`,
      )
      .join('|'),
  ].join('::')

const getBundleCartItemKey = (signature: string, occurrence: number) =>
  `bundle:${signature}:${occurrence}`

interface ProductCartDrawerRowProps {
  item: ProductCartItemWithProduct
  isPending: boolean
  resolveUrl: (url: string) => string | null
  onDecrement: (item: ProductCartItemWithProduct) => void
  onIncrement: (item: ProductCartItemWithProduct) => void
  onRemove: (item: ProductCartItemWithProduct) => void
}

const ProductCartDrawerRow = memo(function ProductCartDrawerRow({
  item,
  isPending,
  resolveUrl,
  onDecrement,
  onIncrement,
  onRemove,
}: ProductCartDrawerRowProps) {
  const product = item.product
  const denomination = item.denomination
  const priceBreakdown = getUnitPriceBreakdown(product, denomination)
  const itemPrice = priceBreakdown.unitCents
  const totalPrice = itemPrice * item.quantity
  const regularTotalPrice = priceBreakdown.regularCents * item.quantity
  const productImageUrl = useMemo(
    () =>
      resolveUrl(product.image ?? '') ??
      '/assets/kg2btwcj2qjkcayvh1exxk3svh84e4c1.webp',
    [product.image, resolveUrl],
  )
  // const hasImage = useMemo(
  //   () => Boolean(product.image && productImageUrl),
  //   [product.image, productImageUrl],
  // )

  return (
    <ViewTransition
      enter={CART_DRAWER_ITEM_VIEW_TRANSITION}
      exit={CART_DRAWER_ITEM_VIEW_TRANSITION}
      update={CART_DRAWER_ITEM_SHIFT_VIEW_TRANSITION}
      default='none'>
      <div className='flex gap-3 p-1 md:p-3 first:rounded-t-md md:first:rounded-t-lg last:rounded-b-md md:last:rounded-b-lg border border-b-0 last:border-b border-foreground/15 bg-card/50'>
        <div className='relative w-21 h-21 shrink-0 rounded-xs overflow-hidden bg-background'>
          <Image
            width={1000}
            height={1000}
            src={productImageUrl}
            alt={product.name ?? 'Product Image'}
            className='w-full h-full object-cover'
          />
          {/*{hasImage ? (
            <Image
              width={1000}
              height={1000}
              src={productImageUrl ?? ''}
              alt={product.name ?? 'Product'}
              className='w-full h-full object-cover'
            />
          ) : (
            <div className='w-full h-full flex items-center justify-center'>
              <Icon name='spinners-ring' className='size-6 text-light-brand' />
            </div>
          )}*/}
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
              <p className='font-medium text-lg'>${formatPrice(totalPrice)}</p>
              {priceBreakdown.isOnSale ? (
                <div className='flex items-center space-x-3'>
                  <span className='bg-terpenes rounded-xs px-1 font-okxs font-semibold text-white text-xs tracking-wide uppercase'>
                    On Sale
                  </span>
                  <p className='font-clash text-sm text-foreground/70 line-through decoration-0.25'>
                    ${formatPrice(regularTotalPrice)}
                  </p>
                </div>
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
                onPress={() => onDecrement(item)}>
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
                onPress={() => onIncrement(item)}>
                <Icon name='plus' className='size-4 m-auto' />
              </Button>
            </div>
            <Button
              size='sm'
              isIconOnly
              variant='ghost'
              className='w-8 h-7 rounded-xs text-foreground/70 hover:opacity-100'
              isDisabled={isPending}
              onPress={() => onRemove(item)}>
              <Icon name='trash' className='size-5 m-auto' />
            </Button>
          </div>
        </div>
      </div>
    </ViewTransition>
  )
})

interface BundleCartDrawerRowProps {
  item: BundleCartDrawerItem
  itemIndex: number
  itemKey: string
  isPending: boolean
  onRemove: (itemIndex: number, itemKey: string) => Promise<void>
  onEdit: (itemIndex: number, itemKey: string) => Promise<void>
}

const BundleCartDrawerRow = memo(function BundleCartDrawerRow({
  item,
  itemIndex,
  itemKey,
  isPending,
  onRemove,
  onEdit,
}: BundleCartDrawerRowProps) {
  const handleRemove = useCallback(
    (index: number) => onRemove(index, itemKey),
    [itemKey, onRemove],
  )

  const handleEdit = useCallback(
    (index: number) => onEdit(index, itemKey),
    [itemKey, onEdit],
  )

  return (
    <ViewTransition
      enter={CART_DRAWER_ITEM_VIEW_TRANSITION}
      exit={CART_DRAWER_ITEM_VIEW_TRANSITION}
      update={CART_DRAWER_ITEM_SHIFT_VIEW_TRANSITION}
      default='none'>
      <BundleCartItem
        item={item}
        itemIndex={itemIndex}
        onRemove={handleRemove}
        onEdit={handleEdit}
        isPending={isPending}
      />
    </ViewTransition>
  )
})

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
  const [pendingItemKey, setPendingItemKey] = useState<string | null>(null)

  const runCartMutation = useCallback(
    (itemKey: string, action: () => Promise<void>) => {
      setPendingItemKey(itemKey)
      return new Promise<void>((resolve, reject) => {
        startTransition(async () => {
          try {
            await action()
            resolve()
          } catch (error) {
            reject(error)
          } finally {
            setPendingItemKey((currentItemKey) =>
              currentItemKey === itemKey ? null : currentItemKey,
            )
          }
        })
      })
    },
    [startTransition],
  )

  const removeBundleItem = useCallback(
    async (itemIndex: number) => {
      applyOptimisticCartAction({
        type: 'removeBundle',
        itemIndex,
      })
      await removeBundle(itemIndex)
    },
    [applyOptimisticCartAction, removeBundle],
  )

  const handleDecrementProduct = useCallback(
    (item: ProductCartItemWithProduct) => {
      const newQty = item.quantity - 1
      const itemKey = getProductCartItemKey(item.product._id, item.denomination)

      void runCartMutation(itemKey, async () => {
        if (newQty < 1) {
          applyOptimisticCartAction({
            type: 'remove',
            productId: item.product._id,
            denomination: item.denomination,
          })
          await removeItem(item.product._id, item.denomination)
          return
        }

        applyOptimisticCartAction({
          type: 'update',
          productId: item.product._id,
          quantity: newQty,
          denomination: item.denomination,
        })
        await updateItem(item.product._id, newQty, item.denomination)
      })
    },
    [applyOptimisticCartAction, removeItem, runCartMutation, updateItem],
  )

  const handleIncrementProduct = useCallback(
    (item: ProductCartItemWithProduct) => {
      const newQty = item.quantity + 1
      const itemKey = getProductCartItemKey(item.product._id, item.denomination)

      void runCartMutation(itemKey, async () => {
        applyOptimisticCartAction({
          type: 'update',
          productId: item.product._id,
          quantity: newQty,
          denomination: item.denomination,
        })
        await updateItem(item.product._id, newQty, item.denomination)
      })
    },
    [applyOptimisticCartAction, runCartMutation, updateItem],
  )

  const handleRemoveProduct = useCallback(
    (item: ProductCartItemWithProduct) => {
      const itemKey = getProductCartItemKey(item.product._id, item.denomination)

      void runCartMutation(itemKey, async () => {
        applyOptimisticCartAction({
          type: 'remove',
          productId: item.product._id,
          denomination: item.denomination,
        })
        await removeItem(item.product._id, item.denomination)
      })
    },
    [applyOptimisticCartAction, removeItem, runCartMutation],
  )

  const handleRemoveBundle = useCallback(
    (itemIndex: number, itemKey: string) =>
      runCartMutation(itemKey, async () => {
        await removeBundleItem(itemIndex)
      }),
    [removeBundleItem, runCartMutation],
  )

  const handleEditBundle = useCallback(
    (itemIndex: number, itemKey: string) =>
      runCartMutation(itemKey, async () => {
        await removeBundleItem(itemIndex)
      }),
    [removeBundleItem, runCartMutation],
  )

  const bundleKeyCounts = new Map<string, number>()

  return (
    <div className='relative px-3 md:px-4 mb-6' aria-busy={isPending}>
      {isPending ? (
        <div aria-hidden className='absolute inset-0 z-10 cursor-wait' />
      ) : null}
      {cartItems.map((item, index) => {
        if (isProductCartItemWithProduct(item)) {
          const itemKey = getProductCartItemKey(
            item.product._id,
            item.denomination,
          )

          return (
            <ProductCartDrawerRow
              key={itemKey}
              item={item}
              isPending={pendingItemKey === itemKey}
              resolveUrl={resolveUrl}
              onDecrement={handleDecrementProduct}
              onIncrement={handleIncrementProduct}
              onRemove={handleRemoveProduct}
            />
          )
        }

        const signature = getBundleCartItemSignature(item)
        const occurrence = bundleKeyCounts.get(signature) ?? 0
        bundleKeyCounts.set(signature, occurrence + 1)
        const itemKey = getBundleCartItemKey(signature, occurrence)

        return (
          <BundleCartDrawerRow
            key={itemKey}
            item={item}
            itemIndex={index}
            itemKey={itemKey}
            onRemove={handleRemoveBundle}
            onEdit={handleEditBundle}
            isPending={pendingItemKey === itemKey}
          />
        )
      })}
    </div>
  )
}

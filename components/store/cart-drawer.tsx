'use client'

import {Id} from '@/convex/_generated/dataModel'
import {useCart} from '@/hooks/use-cart'
import {Icon} from '@/lib/icons'
import {Button, Image} from '@heroui/react'
import {useRouter} from 'next/navigation'
import {useMemo, useOptimistic, useTransition} from 'react'
import {Drawer} from 'vaul'

const formatPrice = (priceCents: number) => {
  const dollars = priceCents / 100
  return dollars % 1 === 0 ? `${dollars.toFixed(0)}` : `${dollars.toFixed(2)}`
}

type OptimisticAction =
  | {
      type: 'update'
      productId: Id<'products'>
      quantity: number
      denomination?: number
    }
  | {type: 'remove'; productId: Id<'products'>; denomination?: number}

interface CartDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const CartDrawer = ({open, onOpenChange}: CartDrawerProps) => {
  const {cart, updateItem, removeItem, isLoading, cartItemCount} = useCart()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Build cart items from server cart
  const serverCartItems = useMemo(() => {
    if (cart && cart.items) {
      return cart.items.map((item) => ({
        product: item.product,
        quantity: item.quantity,
        denomination: item.denomination,
      }))
    }
    return []
  }, [cart])

  // Optimistic cart state
  const [optimisticCartItems, setOptimisticCartItems] = useOptimistic(
    serverCartItems,
    (currentItems, action: OptimisticAction) => {
      switch (action.type) {
        case 'update': {
          return currentItems.map((item) =>
            item.product._id === action.productId &&
            (item.denomination ?? undefined) ===
              (action.denomination ?? undefined)
              ? {...item, quantity: action.quantity}
              : item,
          )
        }
        case 'remove': {
          return currentItems.filter(
            (item) =>
              !(
                item.product._id === action.productId &&
                (item.denomination ?? undefined) ===
                  (action.denomination ?? undefined)
              ),
          )
        }
        default:
          return currentItems
      }
    },
  )

  // Use optimistic cart items for display
  const cartItems = optimisticCartItems

  const hasItems = cartItems.length > 0

  // Calculate optimistic cart item count
  const optimisticCartItemCount = useMemo(() => {
    return cartItems.reduce((total, item) => total + item.quantity, 0)
  }, [cartItems])

  const subtotal = useMemo(() => {
    return cartItems.reduce((total, item) => {
      const price = item.product.priceCents
      const denomination = item.denomination || 1
      return total + price * denomination * item.quantity
    }, 0)
  }, [cartItems])

  const handleViewCart = () => {
    onOpenChange(false)
    router.push('/cart')
  }

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} direction='right'>
      <Drawer.Portal>
        <Drawer.Overlay className='fixed inset-0 bg-slate-800/60 backdrop-blur-1 z-50' />
        <Drawer.Content className='z–200 border-l-[0.33px] border-foreground/20 bg-background flex flex-col h-full w-[400px] fixed bottom-0 right-0 z-50'>
          <div className='p-4 bg-background flex-1 overflow-auto'>
            <div className='flex items-center justify-end space-x-6'>
              <Button isIconOnly variant='solid'>
                <Icon
                  name='fullscreen'
                  onClick={handleViewCart}
                  className='size-5 opacity-100 cursor-pointer'
                />
              </Button>
            </div>
            <div className='mx-auto w-12 h-1.5 shrink-0 bg-border rounded-full mb-0' />
            <div className='flex items-center gap-4 mb-6 px-2'>
              <Drawer.Title className='text-2xl font-semibold tracking-tighter font-space'>
                Cart
              </Drawer.Title>
              <Drawer.Description asChild>
                <div className='flex items-center h-7 p-1'>
                  <span className='ml-1 font-space text-base md:text-lg lg:text-2xl px-2 opacity-70'>
                    <span className='mr-1.5'>{cartItemCount}</span>
                    <span className='tracking-tighter'>items</span>
                  </span>
                </div>
              </Drawer.Description>
            </div>

            {isLoading ? (
              <div className='flex items-center justify-center py-12'>
                <p className='text-color-muted'>Loading cart...</p>
              </div>
            ) : !hasItems && !isPending ? (
              <div className='flex flex-col items-center justify-center py-12 space-y-4'>
                <Icon name='bag-light' className='size-16 text-color-muted' />
                <p className='text-lg font-medium'>Your cart is empty</p>
                <Button variant='flat' onPress={() => onOpenChange(false)}>
                  Continue Shopping
                </Button>
              </div>
            ) : (
              <>
                <div className='space-y-4 mb-6 rounded-3xl border border-indigo-300/80 dark:border-indigo-300/60 bg-indigo-400/5'>
                  {cartItems.map((item) => {
                    const product = item.product
                    const denomination = item.denomination || 1
                    const itemPrice = product.priceCents * denomination
                    const totalPrice = itemPrice * item.quantity

                    return (
                      <div
                        key={`${product._id}-${item.denomination || 'default'}`}
                        className='flex gap-4 p-3 bg-surface-highlight border-b border-foreground/25 border-dashed last:border-b-0 pb-6'>
                        <div className='relative w-20 h-20 shrink-0 rounded-lg overflow-hidden'>
                          <Image
                            src={product.image}
                            alt={product.name}
                            className='w-full h-full object-cover'
                          />
                        </div>
                        <div className='flex-1 flex flex-col justify-center gap-0 min-w-0'>
                          <div className='flex items-center justify-between'>
                            <div className='flex items-center space-x-4 min-w-0'>
                              <h3 className='font-medium font-space text-base tracking-tight truncate'>
                                {product.name}
                              </h3>
                              {item.denomination && (
                                <span className='text-xs text-color-muted font-space'>
                                  {item.denomination} {product.unit}
                                </span>
                              )}
                            </div>
                            <Button
                              size='sm'
                              isIconOnly
                              variant='light'
                              className='min-w-0 size-6 shrink-0'
                              isDisabled={isPending}
                              onPress={() => {
                                startTransition(async () => {
                                  setOptimisticCartItems({
                                    type: 'remove',
                                    productId: product._id,
                                    denomination: item.denomination,
                                  })
                                  await removeItem(
                                    product._id,
                                    item.denomination,
                                  )
                                })
                              }}>
                              <Icon
                                name='minus'
                                className='size-4 text-primary'
                              />
                            </Button>
                          </div>
                          <div className='flex items-center justify-between mt-5'>
                            <div className='flex items-center gap-2'>
                              <Button
                                isIconOnly
                                size='sm'
                                variant='flat'
                                isDisabled={isPending}
                                className='min-w-0 w-8 h-7'
                                onPress={() => {
                                  const newQuantity = item.quantity - 1
                                  startTransition(async () => {
                                    if (newQuantity < 1) {
                                      setOptimisticCartItems({
                                        type: 'remove',
                                        productId: product._id,
                                        denomination: item.denomination,
                                      })
                                      await removeItem(
                                        product._id,
                                        item.denomination,
                                      )
                                    } else {
                                      setOptimisticCartItems({
                                        type: 'update',
                                        productId: product._id,
                                        quantity: newQuantity,
                                        denomination: item.denomination,
                                      })
                                      await updateItem(
                                        product._id,
                                        newQuantity,
                                        item.denomination,
                                      )
                                    }
                                  })
                                }}>
                                <Icon
                                  name='minus'
                                  className='size-4 opacity-70'
                                />
                              </Button>
                              <span className='text-base font-space font-semibold w-8 text-center'>
                                {item.quantity}
                              </span>
                              <Button
                                isIconOnly
                                size='sm'
                                variant='flat'
                                className='min-w-0 w-8 h-7'
                                isDisabled={isPending}
                                onPress={() => {
                                  const newQuantity = item.quantity + 1
                                  startTransition(async () => {
                                    setOptimisticCartItems({
                                      type: 'update',
                                      productId: product._id,
                                      quantity: newQuantity,
                                      denomination: item.denomination,
                                    })
                                    await updateItem(
                                      product._id,
                                      newQuantity,
                                      item.denomination,
                                    )
                                  })
                                }}>
                                <Icon
                                  name='plus'
                                  className='size-4 opacity-70'
                                />
                              </Button>
                            </div>
                            <p className='font-space font-medium text-lg'>
                              ${formatPrice(totalPrice)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/*<Divider className='my-4' />*/}

                <div className='space-y-3 px-4 mb-6'>
                  <div className='flex justify-between text-sm'>
                    <span className='text-color-muted font-semibold'>
                      Subtotal
                    </span>
                    <span className='font-space font-medium text-lg'>
                      ${formatPrice(subtotal)}
                    </span>
                  </div>
                  <div className='flex justify-between text-sm'>
                    <span className='text-color-muted font-semibold'>
                      Items
                    </span>
                    <span className='font-space font-medium text-lg'>
                      {optimisticCartItemCount}
                    </span>
                  </div>
                </div>

                <div className='mx-auto mb-2 px-4'>
                  <Button
                    size='lg'
                    variant='shadow'
                    className='w-full h-14 font-semibold mb-2 bg-indigo-500'
                    onPress={() => {
                      onOpenChange(false)
                      router.push('/cart')
                    }}>
                    <span className='text-white font-bold font-space text-lg'>
                      Checkout
                    </span>
                  </Button>
                </div>
                <button
                  type='button'
                  onClick={handleViewCart}
                  className='w-full text-sm text-color-muted hover:text-foreground transition-colors text-center py-2'>
                  Continue Shopping
                </button>
              </>
            )}
          </div>
          <div className='h-10 w-full border-t border-foreground/5 flex items-center justify-center bg-black'>
            <Icon name='rapid-fire' className='mr-2 w-20 text-white' />
            <span className='text-white text-sm'>
              <span className='font-space font-light tracking-tight'>
                &copy;{new Date().getFullYear()}
              </span>
            </span>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}

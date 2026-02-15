'use client'

import {AuthModal} from '@/components/auth/auth-modal'
import {Id} from '@/convex/_generated/dataModel'
import {useAuthCtx} from '@/ctx/auth'
import {useCart} from '@/hooks/use-cart'
import {useStorageUrls} from '@/hooks/use-storage-urls'
import {Icon} from '@/lib/icons'
import {getUnitPriceCents} from '@/utils/cartPrice'
import {formatPrice} from '@/utils/formatPrice'
import {Button, Image, useDisclosure} from '@heroui/react'
import {useRouter} from 'next/navigation'
import {useMemo, useOptimistic, useTransition} from 'react'
import {Drawer} from 'vaul'
import {DrawerFooter} from '../ui/drawer'
import {EmptyCart} from './empty-cart'
import {SuggestedCartItems} from './suggested-cart-items'

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
  const {user} = useAuthCtx()
  const {isOpen: isAuthOpen, onOpen: onAuthOpen, onClose: onAuthClose} =
    useDisclosure()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Build cart items from server cart
  const serverCartItems = useMemo(() => {
    if (cart && cart.items && Array.isArray(cart.items)) {
      return cart.items.map((item) => ({
        product: item.product,
        quantity: item.quantity,
        denomination: item.denomination,
      }))
    }
    return []
  }, [cart])

  // Get all product image IDs for URL resolution
  const productImageIds = useMemo(
    () => serverCartItems.map((item) => item.product?.image).filter(Boolean),
    [serverCartItems],
  )

  // Resolve storage IDs to URLs
  const resolveUrl = useStorageUrls(productImageIds)

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

  // Show loading only if the hook says we're loading.
  // Once isLoading is false, the cart query has resolved (even if cart is null or items are empty).
  // Note: cartItemCount may be > 0 while cartItems is empty if products were filtered out by safeGet
  // (e.g., products deleted or invalid IDs). In that case, show empty cart, not loading.
  const isStillLoading = isLoading

  // Calculate optimistic cart item count
  const optimisticCartItemCount = useMemo(() => {
    return cartItems.reduce((total, item) => total + item.quantity, 0)
  }, [cartItems])

  const subtotal = useMemo(() => {
    return cartItems.reduce((total, item) => {
      const unitCents = getUnitPriceCents(item.product, item.denomination)
      return total + unitCents * item.quantity
    }, 0)
  }, [cartItems])

  const handleCartCheckout = () => {
    if (!user) {
      onAuthOpen()
      return
    }
    onOpenChange(false)
    router.push('/lobby/cart')
  }

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} direction='right'>
      <Drawer.Portal>
        <Drawer.Overlay className='fixed inset-0 bg-slate-950/60 backdrop-grayscale' />
        <Drawer.Content className='z-9999 border-l-[0.33px] border-foreground/20 bg-linear-to-b from-background dark:from-black to-background flex flex-col h-full md:w-2xl w-screen fixed overflow-hidden bottom-0 right-0'>
          <div className='py-4 flex-1 overflow-y-scroll overflow-x-hidden w-screen md:w-full'>
            <div className='flex items-center gap-4 mb-4 px-4'>
              <Drawer.Title className='text-base md:text-lg lg:text-2xl font-semibold tracking-normal font-okxs'>
                In Cart
              </Drawer.Title>
              <Icon name='play-solid' className='size-4 opacity-70' />
              <Drawer.Description asChild>
                <div className='flex items-center h-7 p-1'>
                  <span className='ml-1 font-okxs text-base md:text-lg lg:text-2xl px-2 opacity-70'>
                    <span className='mr-1.5'>{cartItemCount}</span>
                    <span className='tracking-tighter'>
                      item{cartItemCount > 1 ? `s` : null}
                    </span>
                  </span>
                </div>
              </Drawer.Description>
            </div>

            {isStillLoading ? (
              <div className='flex items-center justify-center py-12'>
                <p className='text-color-muted'>Loading cart...</p>
              </div>
            ) : !hasItems && !isPending ? (
              <div className='flex flex-col h-fit'>
                <EmptyCart onPress={() => onOpenChange(false)} />
                <SuggestedCartItems onClose={() => onOpenChange(false)} />
              </div>
            ) : (
              <>
                <div className='space-y-3 px-4 mb-6'>
                  {cartItems.map((item) => {
                    const product = item.product
                    const denomination = item.denomination
                    const itemPrice = getUnitPriceCents(product, denomination)
                    const totalPrice = itemPrice * item.quantity
                    const productImageUrl = resolveUrl(product.image ?? '')
                    const hasImage = Boolean(product.image && productImageUrl)

                    return (
                      <div
                        key={`${product._id}-${item.denomination ?? 'default'}`}
                        className='flex gap-3 p-3 rounded-xl border border-foreground/15 bg-card/50'>
                        <div className='relative w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-muted'>
                          {hasImage ? (
                            <Image
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
                            <div className='min-w-0 flex items-center space-x-4'>
                              <h3 className='font-medium font-okxs text-base tracking-tight truncate'>
                                {product.name ?? 'Product'}
                              </h3>
                              {item.denomination != null && (
                                <p className='text-xs text-muted-foreground font-okxs'>
                                  {item.denomination}
                                  {product.unit ?? ''}
                                </p>
                              )}
                            </div>
                            <p className='font-okxs font-medium text-lg shrink-0'>
                              ${formatPrice(totalPrice)}
                            </p>
                          </div>
                          <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-1'>
                              <Button
                                isIconOnly
                                size='sm'
                                radius='none'
                                variant='flat'
                                isDisabled={isPending}
                                className='min-w-7 w-7 h-7 aspect-square rounded-sm'
                                onPress={() => {
                                  const newQty = item.quantity - 1
                                  startTransition(async () => {
                                    if (newQty < 1) {
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
                                <Icon name='minus' className='size-3.5' />
                              </Button>
                              <span className='font-okxs text-lg font-semibold w-8 text-center'>
                                {item.quantity}
                              </span>
                              <Button
                                isIconOnly
                                size='sm'
                                radius='none'
                                variant='flat'
                                isDisabled={isPending}
                                className='min-w-7 w-7 h-7 aspect-square rounded-sm'
                                onPress={() => {
                                  const newQty = item.quantity + 1
                                  startTransition(async () => {
                                    setOptimisticCartItems({
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
                                <Icon name='plus' className='size-3.5' />
                              </Button>
                            </div>
                            <Button
                              size='sm'
                              radius='none'
                              isIconOnly
                              variant='light'
                              className='min-w-8 w-8 h-7 aspect-square rounded-sm text-muted-foreground opacity-80 hover:opacity-100'
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
                              <Icon name='trash' className='size-6' />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className='font-okxs space-y-3 px-6 mb-6'>
                  <div className='flex justify-between'>
                    <span className='text-color-muted font-medium'>
                      Subtotal
                    </span>
                    <span className='font-medium text-lg'>
                      ${formatPrice(subtotal)}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-color-muted font-medium'>
                      Total Items
                    </span>
                    <span className='font-space font-medium text-lg'>
                      {optimisticCartItemCount}
                    </span>
                  </div>
                </div>

                <div className='mx-auto mb-3 px-4'>
                  <Button
                    size='lg'
                    className='w-full sm:flex-1 h-15 font-polysans font-normal text-lg bg-foreground/95 text-white dark:text-dark-gray'
                    onPress={handleCartCheckout}>
                    <span className='font-bold font-polysans text-lg'>
                      Checkout
                    </span>
                  </Button>
                </div>
                <button
                  type='button'
                  onClick={() => {
                    onOpenChange(false)
                  }}
                  className='font-okxs w-full text-sm text-color-muted hover:text-foreground transition-colors text-center py-2'>
                  Continue Shopping
                </button>
              </>
            )}
            <div className=' pb-24'></div>
          </div>
          <DrawerFooter className='p-0'>
            <div className='h-10 p-0 w-full border-t border-foreground/5 flex items-center justify-center bg-black'>
              <Icon
                name='rapid-fire-latest'
                className='mr-2 w-20 text-light-gray'
              />
              <span className='text-white text-sm'>
                <span className='font-space font-light tracking-tight'>
                  &copy;{new Date().getFullYear()}
                </span>
              </span>
            </div>
          </DrawerFooter>
        </Drawer.Content>
      </Drawer.Portal>
      <AuthModal isOpen={isAuthOpen} onClose={onAuthClose} mode='login' />
    </Drawer.Root>
  )
}

'use client'

import {useCart} from '@/hooks/use-cart'
import {Icon} from '@/lib/icons'
import {Button, Image, Link} from '@heroui/react'
import {useRouter} from 'next/navigation'
import {useMemo} from 'react'
import {Drawer} from 'vaul'

const formatPrice = (priceCents: number) => {
  const dollars = priceCents / 100
  return dollars % 1 === 0 ? `${dollars.toFixed(0)}` : `${dollars.toFixed(2)}`
}

interface CartDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const CartDrawer = ({open, onOpenChange}: CartDrawerProps) => {
  const {cart, updateItem, removeItem, isLoading, cartItemCount} = useCart()
  const router = useRouter()

  // Build cart items from server cart
  const cartItems = useMemo(() => {
    if (cart && cart.items) {
      return cart.items.map((item) => ({
        product: item.product,
        quantity: item.quantity,
        denomination: item.denomination,
      }))
    }
    return []
  }, [cart])

  const hasItems = cartItems.length > 0

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
        <Drawer.Overlay className='fixed inset-0 bg-foreground/40 z-50' />
        <Drawer.Content className='border-l-[0.33px] border-foreground/40 bg-background flex flex-col rounded-t-[10px] h-full w-[400px] fixed bottom-0 right-0 z-50'>
          <div className='p-4 bg-background rounded-t-[10px] flex-1 overflow-auto'>
            <Drawer.Close asChild className='place-self-end'>
              <button
                type='button'
                className='min-w-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-muted transition-colors'>
                <Icon name='x' className='size-5 opacity-50' />
              </button>
            </Drawer.Close>
            <div className='mx-auto w-12 h-1.5 shrink-0 bg-border rounded-full mb-0' />

            <div className='flex items-center justify-between gap-4 mb-6 px-2'>
              <Drawer.Title className='text-2xl font-semibold tracking-tighter'>
                Cart Items
              </Drawer.Title>
              <Drawer.Description asChild>
                <Link
                  href='/cart'
                  className='bg-cyan-500 h-7 rounded-lg text-white px-3'>
                  <Icon name='eye' className='size-4' />
                  <span className='ml-1 text-sm font-medium drop-shadow-xs'>
                    Full View
                  </span>
                </Link>
              </Drawer.Description>
            </div>

            {isLoading ? (
              <div className='flex items-center justify-center py-12'>
                <p className='text-color-muted'>Loading cart...</p>
              </div>
            ) : !hasItems ? (
              <div className='flex flex-col items-center justify-center py-12 space-y-4'>
                <Icon name='bag-light' className='size-16 text-color-muted' />
                <p className='text-lg font-medium'>Your cart is empty</p>
                <Button variant='flat' onPress={() => onOpenChange(false)}>
                  Continue Shopping
                </Button>
              </div>
            ) : (
              <>
                <div className='space-y-4 mb-6 rounded-xl border border-indigo-400/80 bg-indigo-400/5'>
                  {cartItems.map((item) => {
                    const product = item.product
                    const denomination = item.denomination || 1
                    const itemPrice = product.priceCents * denomination
                    const totalPrice = itemPrice * item.quantity

                    return (
                      <div
                        key={`${product._id}-${item.denomination || 'default'}`}
                        className='flex gap-4 p-3 bg-surface-highlight border-b-[0.33px] border-foreground/20 last:border-b-0 pb-6'>
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
                              <h3 className='font-semibold font-space text-sm truncate'>
                                {product.name}
                              </h3>
                              {item.denomination && (
                                <span className='text-xs text-color-muted font-space'>
                                  {item.denomination} {product.unit}
                                </span>
                              )}
                            </div>
                            <Button
                              isIconOnly
                              variant='light'
                              size='sm'
                              className='min-w-0 size-6 shrink-0'
                              onPress={() =>
                                removeItem(product._id, item.denomination)
                              }>
                              <Icon
                                name='minus'
                                className='size-4 text-primary'
                              />
                            </Button>
                          </div>
                          <div className='flex items-center justify-between mt-3'>
                            <div className='flex items-center gap-2'>
                              <Button
                                isIconOnly
                                size='sm'
                                variant='flat'
                                className='min-w-0 w-6 h-6'
                                onPress={() => {
                                  const newQuantity = item.quantity - 1
                                  if (newQuantity < 1) {
                                    removeItem(product._id, item.denomination)
                                  } else {
                                    updateItem(
                                      product._id,
                                      newQuantity,
                                      item.denomination,
                                    )
                                  }
                                }}>
                                <Icon name='minus' className='size-3' />
                              </Button>
                              <span className='text-sm font-medium w-8 text-center'>
                                {item.quantity}
                              </span>
                              <Button
                                isIconOnly
                                size='sm'
                                variant='flat'
                                className='min-w-0 w-6 h-6'
                                onPress={() =>
                                  updateItem(
                                    product._id,
                                    item.quantity + 1,
                                    item.denomination,
                                  )
                                }>
                                <Icon name='plus' className='size-3' />
                              </Button>
                            </div>
                            <p className='font-semibold text-sm'>
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
                    <span className='font-medium'>
                      ${formatPrice(subtotal)}
                    </span>
                  </div>
                  <div className='flex justify-between text-sm'>
                    <span className='text-color-muted'>Items</span>
                    <span className='font-medium'>{cartItemCount}</span>
                  </div>
                </div>

                <div className='mx-auto px-4'>
                  <Button
                    size='lg'
                    variant='shadow'
                    className='w-full h-14 font-semibold mb-2 bg-indigo-500'
                    onPress={() => {
                      onOpenChange(false)
                      router.push('/checkout')
                    }}>
                    <span className='text-white font-fugaz font-normal text-lg'>
                      Checkout
                    </span>
                  </Button>
                </div>
                <button
                  type='button'
                  onClick={handleViewCart}
                  className='w-full text-sm text-color-muted hover:text-foreground transition-colors text-center py-2'>
                  View Full Cart
                </button>
              </>
            )}
          </div>
          <div className='h-10 w-full border-t border-foreground/20 flex items-center justify-center bg-black'>
            <span
              id='unlicensed-logo'
              className='text-teal-300 text-lg leading-none'>
              ●
            </span>
            <span className='text-white text-sm'>
              <span className='font-fugaz mr-2'>unlicensed</span>
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

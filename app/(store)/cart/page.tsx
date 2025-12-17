'use client'

import {AuthModal} from '@/components/auth/auth-modal'
import {api} from '@/convex/_generated/api'
import {useAuth} from '@/hooks/use-auth'
import {useCart} from '@/hooks/use-cart'
import {usePlaceOrder} from '@/hooks/use-place-order'
import {Icon} from '@/lib/icons'
import {Button, useDisclosure} from '@heroui/react'
import {useQuery} from 'convex/react'
import NextLink from 'next/link'
import {useMemo} from 'react'
import {CartItem} from './cart-item'
import {Checkout} from './checkout'
import {RecommendedProducts} from './recommended'
import {RewardsSummary} from './rewards-summary'

export default function CartPage() {
  const {cart, updateItem, removeItem, clear, isLoading, isAuthenticated} =
    useCart()
  const {user: firebaseUser} = useAuth()
  const {
    placeOrder,
    isLoading: isPlacingOrder,
    error: orderError,
    orderId,
  } = usePlaceOrder()
  const {
    isOpen: isAuthOpen,
    onOpen: onAuthOpen,
    onClose: onAuthClose,
  } = useDisclosure()
  const {
    isOpen: isCheckoutOpen,
    onOpen: onCheckoutOpen,
    onClose: onCheckoutClose,
  } = useDisclosure()

  // Get user info for checkout
  const convexUser = useQuery(
    api.users.q.getCurrentUser,
    firebaseUser ? {firebaseId: firebaseUser.uid} : 'skip',
  )

  const defaultAddress = useQuery(
    api.users.q.getDefaultAddress,
    firebaseUser ? {firebaseId: firebaseUser.uid, type: 'shipping'} : 'skip',
  )

  const defaultBillingAddress = useQuery(
    api.users.q.getDefaultAddress,
    firebaseUser ? {firebaseId: firebaseUser.uid, type: 'billing'} : 'skip',
  )

  const userEmail = useMemo(() => {
    return convexUser?.email || firebaseUser?.email || ''
  }, [convexUser?.email, firebaseUser?.email])

  const userPhone = useMemo(() => {
    return convexUser?.contact?.phone || defaultAddress?.phone || ''
  }, [convexUser?.contact?.phone, defaultAddress?.phone])

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

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <p>Loading cart...</p>
      </div>
    )
  }

  if (!hasItems) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center space-y-4'>
          <Icon name='bag-light' className='size-16 mx-auto text-color-muted' />
          <h1 className='text-2xl font-semibold'>Your cart is empty</h1>
          <Button as={NextLink} href='/' color='primary'>
            Continue Shopping
          </Button>
        </div>
      </div>
    )
  }

  const subtotal = cartItems.reduce((total, item) => {
    const price = item.product.priceCents
    const denomination = item.denomination || 1
    return total + price * denomination * item.quantity
  }, 0)

  const tax = subtotal * 0.1 // 10% tax
  const shipping = subtotal > 5000 ? 0 : 500 // Free shipping over $50
  const total = subtotal + tax + shipping

  return (
    <div className='min-h-screen lg:pt-28 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-7xl mx-auto'>
        <div className='flex items-center justify-between mb-8'>
          <h1 className='text-base font-medium font-space space-x-2 tracking-tight'>
            <span className='opacity-60'>Shopping Cart</span>
            <span className='font-light text-sm'>/</span>
            <span>Checkout</span>
          </h1>
        </div>

        <div className='grid gap-8 lg:grid-cols-[1fr_400px]'>
          {/* Cart Items */}
          <div className='h-[70lvh] dark:bg-white/10 rounded-2xl overflow-hidden flex flex-col'>
            <div className='flex-1 overflow-y-auto'>
              {cartItems.map((item) => {
                const product = item.product
                const denomination = item.denomination || 1
                const itemPrice = product.priceCents * denomination

                return (
                  <CartItem
                    key={`${product._id}-${item.denomination || 'default'}`}
                    item={item}
                    itemPrice={itemPrice}
                    onUpdate={updateItem}
                    onRemove={removeItem}
                    className={
                      cartItems.length === 1
                        ? 'first:border-b'
                        : ' first:border-b-0'
                    }
                  />
                )
              })}
            </div>
            <RecommendedProducts />
          </div>

          <div className='space-y-6'>
            {/* Order Summary - Read-only review */}
            <RewardsSummary
              subtotal={subtotal}
              tax={tax}
              shipping={shipping}
              total={total}
            />

            {/* Checkout - Payment method and place order */}
            <Checkout
              tax={tax}
              total={total}
              onOpen={isAuthenticated ? onCheckoutOpen : onAuthOpen}
              subtotal={subtotal}
              shipping={shipping}
              isAuthenticated={isAuthenticated}
              isLoading={isPlacingOrder}
              onPlaceOrder={placeOrder}
              userEmail={userEmail}
              defaultAddress={defaultAddress || undefined}
              defaultBillingAddress={defaultBillingAddress || undefined}
              userPhone={userPhone}
              convexUser={convexUser || undefined}
              orderError={orderError}
              orderId={orderId}
              onCheckoutClose={onCheckoutClose}
              isCheckoutOpen={isCheckoutOpen}
              onClearCart={clear}
            />
          </div>
        </div>
      </div>
      <AuthModal isOpen={isAuthOpen} onClose={onAuthClose} mode='login' />
    </div>
  )
}

'use client'

import {AuthModal} from '@/components/auth/auth-modal'
import {Loader} from '@/components/expermtl/loader'
import {EmptyCart} from '@/components/store/empty-cart'
import {api} from '@/convex/_generated/api'
import {useAuth} from '@/hooks/use-auth'
import {useCart} from '@/hooks/use-cart'
import {usePlaceOrder} from '@/hooks/use-place-order'
import {cn} from '@/lib/utils'
import {useDisclosure} from '@heroui/react'
import {useQuery} from 'convex/react'
import {useRouter} from 'next/navigation'
import {useCallback, useEffect, useMemo, useOptimistic, useRef, useState, useTransition} from 'react'
import {CartItem} from './cart-item'
import {Checkout} from './checkout'
import {RecommendedProducts} from './recommended'
import {RewardsSummary} from './rewards-summary'
import {Id} from '@/convex/_generated/dataModel'
import {ProductType} from '@/convex/products/d'

export default function CartPage() {
  const router = useRouter()
  const {cart, updateItem: baseUpdateItem, removeItem: baseRemoveItem, clear, isLoading, isAuthenticated} =
    useCart()
  const {user: firebaseUser} = useAuth()
  const {
    placeOrder,
    isLoading: isPlacingOrder,
    error: orderError,
    orderId,
  } = usePlaceOrder()
  const [isPending, startTransition] = useTransition()
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
  const [showEmptyCartLoader, setShowEmptyCartLoader] = useState(false)
  const loaderTimerRef = useRef<NodeJS.Timeout | null>(null)

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

  type OptimisticAction =
    | {
        type: 'update'
        productId: Id<'products'>
        quantity: number
        denomination?: number
      }
    | {
        type: 'remove'
        productId: Id<'products'>
        denomination?: number
      }

  // Optimistic cart state to prevent blinking
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

  // Wrap updateItem with optimistic updates
  const updateItem = useCallback(
    async (
      productId: Id<'products'>,
      quantity: number,
      denomination?: number,
    ) => {
      // Optimistically update UI immediately
      setOptimisticCartItems({
        type: 'update',
        productId,
        quantity,
        denomination,
      })
      // Then perform the actual update
      await baseUpdateItem(productId, quantity, denomination)
    },
    [baseUpdateItem, setOptimisticCartItems],
  )

  // Wrap removeItem with optimistic updates
  const removeItem = useCallback(
    async (productId: Id<'products'>, denomination?: number) => {
      // Optimistically update UI immediately
      setOptimisticCartItems({
        type: 'remove',
        productId,
        denomination,
      })
      // Then perform the actual removal
      await baseRemoveItem(productId, denomination)
    },
    [baseRemoveItem, setOptimisticCartItems],
  )

  const hasItems = cartItems.length > 0

  // Redirect to account page when order is placed (prevent showing empty cart)
  useEffect(() => {
    if (orderId) {
      const redirectTimer = setTimeout(() => {
        startTransition(() => {
          router.push(`/account/orders/${orderId}`)
        })
      }, 5000) // Give time for development modal to show

      return () => clearTimeout(redirectTimer)
    }
  }, [orderId, router])

  // Show loader for 3 seconds when cart is empty (after initial load completes)
  useEffect(() => {
    // Clear any existing timer
    if (loaderTimerRef.current) {
      clearTimeout(loaderTimerRef.current)
      loaderTimerRef.current = null
    }

    // If loading or has items, hide the loader via timeout callback
    if (isLoading || hasItems) {
      const timeoutId = setTimeout(() => {
        setShowEmptyCartLoader(false)
      }, 0)
      return () => clearTimeout(timeoutId)
    }

    // If not loading and no items, show loader for 3 seconds then show empty cart
    if (!isLoading && !hasItems) {
      const showTimeoutId = setTimeout(() => {
        setShowEmptyCartLoader(true)
      }, 0)
      loaderTimerRef.current = setTimeout(() => {
        setShowEmptyCartLoader(false)
        loaderTimerRef.current = null
      }, 3000)
      return () => {
        clearTimeout(showTimeoutId)
        if (loaderTimerRef.current) {
          clearTimeout(loaderTimerRef.current)
          loaderTimerRef.current = null
        }
      }
    }

    return () => {
      if (loaderTimerRef.current) {
        clearTimeout(loaderTimerRef.current)
        loaderTimerRef.current = null
      }
    }
  }, [isLoading, hasItems])

  const subtotal = useMemo(() => {
    return cartItems.reduce((total, item) => {
      const price = item.product.priceCents ?? 0
      const denomination = item.denomination || 1
      return total + price * denomination * item.quantity
    }, 0)
  }, [cartItems])

  const tax = useMemo(() => subtotal * 0.1, [subtotal]) // 10% tax
  const shipping = useMemo(() => (subtotal > 5000 ? 0 : 500), [subtotal]) // Free shipping over $50
  const total = useMemo(() => subtotal + tax + shipping, [subtotal, tax, shipping])

  // Get user's points balance and next visit multiplier
  const pointsBalance = useQuery(
    api.rewards.q.getUserPointsBalance,
    convexUser && convexUser._id ? {userId: convexUser._id} : 'skip',
  )

  const nextVisitMultiplier = useQuery(
    api.rewards.q.getNextVisitMultiplier,
    convexUser && convexUser._id ? {userId: convexUser._id} : 'skip',
  )

  // Calculate estimated points (assuming all products are eligible)
  // In reality, we'd need to check each product, but for UI purposes we'll estimate
  const estimatedPoints = useMemo(() => {
    if (!nextVisitMultiplier || !isAuthenticated) return null
    // Convert subtotal from cents to dollars, then multiply by multiplier
    // Points = (subtotal in dollars) × multiplier, rounded to nearest integer
    const points = Math.round((subtotal / 100) * nextVisitMultiplier.multiplier)
    return points
  }, [subtotal, nextVisitMultiplier, isAuthenticated])

  if (!hasItems) {
    return isLoading || showEmptyCartLoader ? (
      <div className='min-h-screen w-screen pt-20 lg:pt-28 flex items-start justify-center'>
        <Loader />
      </div>
    ) : (
      <div className='min-h-screen w-screen flex items-start justify-center pt-16 sm:pt-10 md:pt-24 lg:pt-28 px-4 sm:px-6 lg:px-8'>
        <EmptyCart />
      </div>
    )
  }

  return (
    <div className='min-h-screen pt-16 sm:pt-10 md:pt-24 lg:pt-28 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-7xl mx-auto'>
        <div className='flex items-center justify-between mb-4'>
          <h1 className='text-base font-medium font-space space-x-2 tracking-tight'>
            <span className='opacity-60'>Cart</span>
            <span className='font-light text-sm'>/</span>
            <span>Checkout</span>
          </h1>
        </div>

        <div className='grid gap-8 lg:grid-cols-[1fr_400px]'>
          {/* Cart Items */}
          <div className='md:h-[70lvh] h-fit bg-linear-to-b dark:from-dark-table/40 via-transparent to-transparent rounded-3xl overflow-hidden flex flex-col'>
            <div className='flex-1 overflow-y-auto rounded-3xl'>
              {cartItems.map((item) => {
                const product = item.product
                const denomination = item.denomination || 1
                const itemPrice = (product.priceCents ?? 0) * denomination

                return (
                  <CartItem
                    key={`${product._id}-${item.denomination || 'default'}`}
                    item={item}
                    itemPrice={itemPrice}
                    onUpdate={updateItem}
                    onRemove={removeItem}
                    className={cn(
                      'dark:border-dark-gray',
                      cartItems.length === 1
                        ? 'first:border-b'
                        : ' first:border-b-0',
                    )}
                  />
                )
              })}
            </div>
            <RecommendedProducts />
          </div>

          <div className='space-y-6'>
            <RewardsSummary
              nextVisitMultiplier={nextVisitMultiplier}
              pointsBalance={pointsBalance}
              estimatedPoints={estimatedPoints}
              isAuthenticated={firebaseUser !== null}
            />

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
              pointsBalance={pointsBalance}
            />
          </div>
        </div>
      </div>
      <AuthModal isOpen={isAuthOpen} onClose={onAuthClose} mode='login' />
    </div>
  )
}

'use client'

import {AuthModal} from '@/components/auth/auth-modal'
import ShimmerText from '@/components/expermtl/shimmer'
import {api} from '@/convex/_generated/api'
import {useAuth} from '@/hooks/use-auth'
import {isProductCartItemWithProduct, useCart} from '@/hooks/use-cart'
import {usePlaceOrder} from '@/hooks/use-place-order'
import {useDisclosure} from '@heroui/react'
import {useQuery} from 'convex/react'
import {useRouter} from 'next/navigation'
import {useEffect, useMemo, useState, useTransition} from 'react'
import {CartEmptyState} from './CartEmptyState'
import {CartItemsSection} from './CartItemsSection'
import {CartPageHeader} from './CartPageHeader'
import {Checkout} from './checkout'
import type {RewardsVariant} from './checkout/types'
import {useCartCheckoutQueryState} from './hooks/use-cart-checkout-query-state'
import {useCartDebugLog} from './hooks/use-cart-debug-log'
import {
  useCartRewards,
  useCartTotals,
  useEstimatedPoints,
} from './hooks/use-cart-totals'
import {useEmptyCartLoader} from './hooks/use-empty-cart-loader'
import {useOptimisticCartItems} from './hooks/use-optimistic-cart-items'
import {getOrderRedirectPath} from './lib/order-redirect'
import type {CartPageItem} from './types'

const DEFAULT_SHIPPING_FEE_CENTS = 1299
const DEFAULT_MINIMUM_ORDER_CENTS = 9900

export default function CartPage() {
  const router = useRouter()
  const {
    cart,
    updateItem: baseUpdateItem,
    removeItem: baseRemoveItem,
    clear,
    isLoading,
    isAuthenticated,
  } = useCart()
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
    isCheckoutOpen,
    onCheckoutOpen,
    onCheckoutClose,
    paymentMethod,
    onPaymentMethodChange,
  } = useCartCheckoutQueryState()

  /** Toggle to swap rewards panel in checkout: 'tier' | 'points' | 'off' */
  const [rewardsVariant, setRewardsVariant] = useState<RewardsVariant>('tier')

  const shippingConfig = useQuery(api.admin.q.getShippingConfig, {})
  const taxConfig = useQuery(api.admin.q.getTaxConfig, {})
  const rewardsConfig = useQuery(api.admin.q.getRewardsConfig, {})

  const shippingFeeCents =
    shippingConfig?.shippingFeeCents ?? DEFAULT_SHIPPING_FEE_CENTS
  const minimumOrderCents =
    shippingConfig?.minimumOrderCents ?? DEFAULT_MINIMUM_ORDER_CENTS

  // Get user info for checkout
  const convexUser = useQuery(
    api.users.q.getCurrentUser,
    firebaseUser ? {fid: firebaseUser.uid} : 'skip',
  )

  const defaultAddress = useQuery(
    api.users.q.getDefaultAddress,
    firebaseUser ? {fid: firebaseUser.uid, type: 'shipping'} : 'skip',
  )
  const shippingAddresses = useQuery(
    api.users.q.getUserAddresses,
    firebaseUser ? {fid: firebaseUser.uid, type: 'shipping'} : 'skip',
  )

  const defaultBillingAddress = useQuery(
    api.users.q.getDefaultAddress,
    firebaseUser ? {fid: firebaseUser.uid, type: 'billing'} : 'skip',
  )

  const isFirstTimeBuyer = useQuery(
    api.orders.q.isFirstTimeBuyer,
    convexUser?._id ? {userId: convexUser._id} : 'skip',
  )

  const rawCartDebug = useQuery(
    api.cart.q.getCartRaw,
    convexUser?._id ? {userId: convexUser._id} : 'skip',
  )

  const userEmail = useMemo(() => {
    return convexUser?.email || firebaseUser?.email || ''
  }, [convexUser?.email, firebaseUser?.email])

  const userPhone = useMemo(() => {
    return convexUser?.contact?.phone || defaultAddress?.phone || ''
  }, [convexUser?.contact?.phone, defaultAddress?.phone])

  const serverCartItems = useMemo<CartPageItem[]>(() => {
    if (!cart?.items) return []
    return cart.items.filter(isProductCartItemWithProduct).map((item) => ({
      product: item.product,
      quantity: item.quantity,
      denomination: item.denomination,
    }))
  }, [cart])

  const {cartItems, updateItem, removeItem, clearCartWithHistory} =
    useOptimisticCartItems({
      serverCartItems,
      onUpdateItem: baseUpdateItem,
      onRemoveItem: baseRemoveItem,
      onClearCart: clear,
    })

  useCartDebugLog({
    cart,
    cartItems,
    serverCartItems,
    isLoading,
    isAuthenticated,
    rawCartDebug,
  })

  const hasItems = cartItems.length > 0

  // Fallback redirect when order is placed
  useEffect(() => {
    if (!orderId) return
    const redirectTimer = setTimeout(() => {
      startTransition(() => {
        const path = getOrderRedirectPath(orderId, String(paymentMethod))
        router.replace(path)
      })
    }, 5000)
    return () => clearTimeout(redirectTimer)
  }, [orderId, paymentMethod, router, startTransition])

  const showEmptyCartLoader = useEmptyCartLoader({
    isLoading,
    hasItems,
  })

  const {subtotal, tax, shipping} = useCartTotals({
    cartItems,
    taxConfig,
    shippingConfig,
  })

  // Get user's points balance and next visit multiplier
  const pointsBalance = useQuery(
    api.rewards.q.getUserPointsBalance,
    convexUser && convexUser._id ? {userId: convexUser._id} : 'skip',
  )

  const nextVisitMultiplier = useQuery(
    api.rewards.q.getNextVisitMultiplier,
    convexUser && convexUser._id ? {userId: convexUser._id} : 'skip',
  )

  const estimatedPoints = useEstimatedPoints({
    subtotal,
    nextVisitMultiplier,
    isAuthenticated,
  })

  const computedRewards = useCartRewards({
    cartItems,
    subtotal,
    isFirstOrder: isFirstTimeBuyer ?? false,
    config: rewardsConfig ?? undefined,
  })

  // Use rewards tier-based shipping (from checkout-rewards-summary) instead of shipping_config
  const effectiveShipping =
    computedRewards != null
      ? Math.round(computedRewards.shippingCost * 100)
      : shipping
  const effectiveTotal = subtotal + tax + effectiveShipping

  if (!hasItems && isLoading) {
    return (
      <CartEmptyState
        isLoading={isLoading}
        showEmptyCartLoader={showEmptyCartLoader}
      />
    )
  }

  return (
    <div className='min-h-screen w-full min-w-0 overflow-x-hidden pt-16 sm:pt-16 md:pt-16 lg:pt-20 xl:pt-24 2xl:pt-28 pb-10 px-4 sm:px-6 md:px-6 lg:px-8'>
      <div className='max-w-7xl mx-auto w-full min-w-0'>
        <CartPageHeader isPending={isPending} />

        <div className='grid min-w-0 grid-cols-1 gap-8 lg:grid-cols-[1fr_400px]'>
          <div className='min-w-0'>
            <CartItemsSection
              cartItems={cartItems}
              onUpdateItem={updateItem}
              onRemoveItem={removeItem}
            />
          </div>

          <div className='min-w-0 space-y-6 relative'>
            <div className='absolute top-0 left-0'>
              <ShimmerText surface='light' />
            </div>
            <Checkout
              tax={tax}
              total={effectiveTotal}
              showTaxRow={taxConfig?.active ?? true}
              onOpen={isAuthenticated ? onCheckoutOpen : onAuthOpen}
              subtotal={subtotal}
              shipping={effectiveShipping}
              isAuthenticated={isAuthenticated}
              isLoading={isPlacingOrder}
              onPlaceOrder={placeOrder}
              userEmail={userEmail}
              defaultAddress={defaultAddress || undefined}
              shippingAddresses={shippingAddresses || undefined}
              defaultBillingAddress={defaultBillingAddress || undefined}
              userPhone={userPhone}
              cashAppUsername={convexUser?.cashAppUsername}
              convexUser={convexUser || undefined}
              orderError={orderError}
              orderId={orderId}
              onCheckoutClose={onCheckoutClose}
              isCheckoutOpen={isCheckoutOpen}
              onClearCart={clearCartWithHistory}
              pointsBalance={pointsBalance}
              paymentMethodFromUrl={paymentMethod}
              onPaymentMethodUrlChange={onPaymentMethodChange}
              minimumOrderCents={minimumOrderCents}
              shippingFeeCents={shippingFeeCents}
              rewardsVariant={rewardsVariant}
              computedRewards={computedRewards}
              rewardsConfig={rewardsConfig ?? undefined}
              nextVisitMultiplier={nextVisitMultiplier}
              estimatedPoints={estimatedPoints}
            />
          </div>
        </div>
      </div>
      <AuthModal isOpen={isAuthOpen} onClose={onAuthClose} mode='login' />
    </div>
  )
}

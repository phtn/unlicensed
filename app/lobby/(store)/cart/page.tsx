'use client'

import {AuthModal} from '@/components/auth/auth-modal'
import ShimmerText from '@/components/expermtl/shimmer'
import {api} from '@/convex/_generated/api'
import {useAuth} from '@/hooks/use-auth'
import {useCart} from '@/hooks/use-cart'
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
import {getOrderRedirectPath} from './lib/order-redirect'
import {useCartCheckoutQueryState} from './hooks/use-cart-checkout-query-state'
import {
  useCartRewards,
  useCartTotals,
  useEstimatedPoints,
} from './hooks/use-cart-totals'
import {useCartDebugLog} from './hooks/use-cart-debug-log'
import {useEmptyCartLoader} from './hooks/use-empty-cart-loader'
import {useOptimisticCartItems} from './hooks/use-optimistic-cart-items'
import type {CartPageItem} from './types'

const DEFAULT_SHIPPING_FEE_CENTS = 500
const DEFAULT_MINIMUM_ORDER_CENTS = 5000

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
    return (
      cart?.items.map((item) => ({
        product: item.product,
        quantity: item.quantity,
        denomination: item.denomination,
      })) ?? []
    )
  }, [cart?.items])

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

  const {subtotal, tax, shipping, total} = useCartTotals({
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
  })

  if (!hasItems) {
    return (
      <CartEmptyState
        isLoading={isLoading}
        showEmptyCartLoader={showEmptyCartLoader}
      />
    )
  }

  return (
    <div className='min-h-screen pt-16 sm:pt-16 md:pt-16 lg:pt-20 xl:pt-24 2xl:pt-28 pb-10 px-2 md:px-4 sm:px-6 lg:px-8'>
      <div className='max-w-7xl mx-auto'>
        <CartPageHeader isPending={isPending} />

        <div className='grid gap-8 lg:grid-cols-[1fr_400px]'>
          <CartItemsSection
            cartItems={cartItems}
            onUpdateItem={updateItem}
            onRemoveItem={removeItem}
          />

          <div className='space-y-6 relative'>
            <div className='absolute op-0 left-0'>
              <ShimmerText surface='light' />
            </div>
            {/*<div className='flex flex-wrap items-center gap-2'>
              <span className='text-sm text-muted-foreground'>
                Rewards in checkout:
              </span>
              {(
                [
                  {value: 'points' as const, label: 'Points'},
                  {value: 'tier' as const, label: 'Tier'},
                  {value: 'off' as const, label: 'Off'},
                ] as const
              ).map(({value, label}) => (
                <button
                  key={value}
                  type='button'
                  onClick={() => setRewardsVariant(value)}
                  className={`rounded-md px-2.5 py-1 text-sm font-medium transition-colors ${
                    rewardsVariant === value
                      ? 'bg-foreground text-background dark:bg-brand dark:text-white'
                      : 'bg-foreground/10 text-foreground hover:bg-foreground/20'
                  }`}>
                  {label}
                </button>
              ))}
            </div>*/}

            {/*<RewardsSummary
              nextVisitMultiplier={nextVisitMultiplier}
              pointsBalance={pointsBalance}
              estimatedPoints={estimatedPoints}
              isAuthenticated={firebaseUser !== null}
            />*/}

            <Checkout
              tax={tax}
              total={total}
              showTaxRow={taxConfig?.active ?? true}
              onOpen={isAuthenticated ? onCheckoutOpen : onAuthOpen}
              subtotal={subtotal}
              shipping={shipping}
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

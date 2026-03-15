'use client'

import {useDealConfigs} from '@/app/lobby/(store)/deals/hooks/use-deal-configs'
import {AuthModal} from '@/components/auth/auth-modal'
import {api} from '@/convex/_generated/api'
import type {Id} from '@/convex/_generated/dataModel'
import {useAuth} from '@/hooks/use-auth'
import {
  isBundleCartItemWithProducts,
  isProductCartItemWithProduct,
  useCart,
} from '@/hooks/use-cart'
import {usePlaceOrder} from '@/hooks/use-place-order'
import {Icon} from '@/lib/icons'
import {getBundleTotalCents, getUnitPriceCents} from '@/utils/cartPrice'
import {useDisclosure} from '@heroui/react'
import {useQuery} from 'convex/react'
import dynamic from 'next/dynamic'
import {useRouter} from 'next/navigation'
import {useCallback, useEffect, useMemo, useState, useTransition} from 'react'
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

const CartEmptyScene = dynamic(
  () => import('./CartEmptyScene').then((module) => module.CartEmptyScene),
  {
    ssr: false,
    loading: () => (
      <div className='min-h-[34.01rem] whitespace-nowrap border border-foreground/15 bg-linear-to-br from-white/70 via-pink-50/70 to-sidebar/60 dark:from-dark-table/40 dark:via-[#140911]/70 dark:to-black/60 lg:min-h-[42.01rem] flex items-center justify-center space-x-2'>
        <Icon name='spinners-ring' className='size-4' />
      </div>
    ),
  },
)

export default function CartPage() {
  const router = useRouter()
  const {
    cart,
    updateItem: baseUpdateItem,
    removeItem: baseRemoveItem,
    removeBundle,
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
  const [rewardsVariant] = useState<RewardsVariant>('tier')

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

  const {configs: dealConfigs} = useDealConfigs()

  const serverCartItems = useMemo<CartPageItem[]>(() => {
    if (!cart?.items) return []
    const productItems: CartPageItem[] = []
    const bundleItems: CartPageItem[] = []
    cart.items.forEach((item, idx) => {
      if (isProductCartItemWithProduct(item)) {
        productItems.push({
          product: item.product,
          quantity: item.quantity,
          denomination: item.denomination,
        })
      } else if (isBundleCartItemWithProducts(item)) {
        const config = dealConfigs[item.bundleType]
        const variation = config?.variations[item.variationIndex]
        const denom =
          variation?.denominationPerUnit ??
          item.bundleItemsWithProducts[0]?.denomination ??
          0.125
        const bundleAmount = variation
          ? variation.totalUnits * variation.denominationPerUnit
          : item.bundleItemsWithProducts.reduce(
              (s, bi) => s + bi.denomination * bi.quantity,
              0,
            )
        const products = item.bundleItemsWithProducts.map((bi) => bi.product)
        const bundleTotalCents = getBundleTotalCents(
          products,
          denom,
          bundleAmount,
        )
        let sumUnitQty = 0
        for (const bi of item.bundleItemsWithProducts) {
          sumUnitQty +=
            getUnitPriceCents(bi.product, bi.denomination) * bi.quantity
        }
        item.bundleItemsWithProducts.forEach((bi, lineIdx) => {
          const lineUnitQty =
            getUnitPriceCents(bi.product, bi.denomination) * bi.quantity
          const lineTotalCents =
            sumUnitQty > 0
              ? Math.round((bundleTotalCents * lineUnitQty) / sumUnitQty)
              : 0
          bundleItems.push({
            product: bi.product,
            quantity: bi.quantity,
            denomination: bi.denomination,
            bundleCartItemIndex: idx,
            bundleLineIndex: lineIdx,
            lineTotalCents,
          })
        })
      }
    })
    return [...productItems, ...bundleItems]
  }, [cart, dealConfigs])

  const onRemoveItem = useCallback(
    async (
      productId: Id<'products'>,
      denomination?: number,
      bundleCartItemIndex?: number,
    ) => {
      if (bundleCartItemIndex !== undefined) {
        await removeBundle(bundleCartItemIndex)
      } else {
        await baseRemoveItem(productId, denomination)
      }
    },
    [baseRemoveItem, removeBundle],
  )

  const {cartItems, updateItem, removeItem, clearCartWithHistory} =
    useOptimisticCartItems({
      serverCartItems,
      onUpdateItem: baseUpdateItem,
      onRemoveItem,
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
          <div className='min-w-0 rounded-xs'>
            {cartItems.length > 0 ? (
              <CartItemsSection
                cartItems={cartItems}
                onUpdateItem={updateItem}
                onRemoveItem={removeItem}
              />
            ) : (
              <CartEmptyScene />
            )}
          </div>

          {/*<div className='absolute top-0 left-0'>
              <ShimmerText surface='light' />
            </div>*/}
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
      <AuthModal isOpen={isAuthOpen} onClose={onAuthClose} mode='login' />
    </div>
  )
}

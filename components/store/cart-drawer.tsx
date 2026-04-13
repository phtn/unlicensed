'use client'

import {CashBackRedemption} from '@/app/lobby/(store)/cart/checkout/components/cash-back-redemption'
import {useCashBackRedemption} from '@/app/lobby/(store)/cart/hooks/use-cash-back-redemption'
import {useDealConfigs} from '@/app/lobby/(store)/deals/hooks/use-deal-configs'
import {AuthModal} from '@/components/auth/auth-modal'
import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {useAuthCtx} from '@/ctx/auth'
import {
  type CartItemWithProduct,
  isProductCartItemWithProduct,
  useCart,
} from '@/hooks/use-cart'
import {useDisclosure} from '@/hooks/use-disclosure'
import {useStorageUrls} from '@/hooks/use-storage-urls'
import {Icon} from '@/lib/icons'
import {getBundleTotalCents, getUnitPriceCents} from '@/utils/cartPrice'
import {formatPrice} from '@/utils/formatPrice'
import {Avatar, Button} from '@heroui/react'
import {useQuery} from 'convex/react'
import {useRouter} from 'next/navigation'
import {useMemo, useOptimistic, useTransition, ViewTransition} from 'react'
import {Drawer} from 'vaul'
import {DrawerFooter} from '../ui/drawer'
import {EmptyCart} from './empty-cart'
import {SuggestedCartItems} from './suggested-cart-items'

// import {LegacyImage} from '@/components/ui/legacy-image'
import {getInitials} from '@/utils/initials'
import {CartDrawerItems} from './cart-drawer-items'

type OptimisticAction =
  | {
      type: 'update'
      productId: Id<'products'>
      quantity: number
      denomination?: number
    }
  | {type: 'remove'; productId: Id<'products'>; denomination?: number}
  | {type: 'removeBundle'; itemIndex: number}

interface CartDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const CASH_BACK_REDEMPTION_MINIMUM_ORDER_CENTS = 5000
const CASH_BACK_APPLIED_VIEW_TRANSITION = 'cart-cash-back-applied'
const CART_SUMMARY_FOLLOW_VIEW_TRANSITION = 'cart-summary-follow-shift'

function CashBackAppliedRow({amountCents}: {amountCents: number}) {
  if (amountCents <= 0) {
    return null
  }

  return (
    <ViewTransition
      enter={CASH_BACK_APPLIED_VIEW_TRANSITION}
      exit={CASH_BACK_APPLIED_VIEW_TRANSITION}
      default='none'>
      <div className='flex justify-between font-clash text-lg text-emerald-600 dark:text-emerald-400 px-2'>
        <span className='font-medium'>Cash back applied</span>
        <span className='font-medium'>-${formatPrice(amountCents)}</span>
      </div>
    </ViewTransition>
  )
}

export const CartDrawer = ({open, onOpenChange}: CartDrawerProps) => {
  const {
    cart,
    updateItem,
    removeItem,
    removeBundle,
    isLoading,
    cartItemCount,
    isAuthenticated,
  } = useCart()
  const {user, convexUserId} = useAuthCtx()
  const {configs} = useDealConfigs()
  const {
    isOpen: isAuthOpen,
    onOpen: onAuthOpen,
    onClose: onAuthClose,
  } = useDisclosure()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const {isCashBackEnabled, setCashBackEnabled} = useCashBackRedemption()
  const pointsBalance = useQuery(
    api.rewards.q.getUserPointsBalance,
    convexUserId ? {userId: convexUserId} : 'skip',
  )

  // Build cart items from server cart (preserve full structure for product + bundle)
  const baseCartItems = useMemo<CartItemWithProduct[]>(() => {
    if (cart && cart.items && Array.isArray(cart.items)) {
      return cart.items
    }
    return []
  }, [cart])

  // Get all product image IDs for URL resolution (product items only)
  const productImageIds = useMemo(
    () =>
      baseCartItems
        .filter(isProductCartItemWithProduct)
        .map((item) => item.product?.image)
        .filter(Boolean),
    [baseCartItems],
  )

  // Resolve storage IDs to URLs
  const resolveUrl = useStorageUrls(productImageIds)

  // Optimistic cart state
  const [optimisticCartItems, setOptimisticCartItems] = useOptimistic(
    baseCartItems,
    (currentItems, action: OptimisticAction) => {
      switch (action.type) {
        case 'update': {
          return currentItems.map((item) =>
            isProductCartItemWithProduct(item) &&
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
                isProductCartItemWithProduct(item) &&
                item.product._id === action.productId &&
                (item.denomination ?? undefined) ===
                  (action.denomination ?? undefined)
              ),
          )
        }
        case 'removeBundle': {
          return currentItems.filter((_, i) => i !== action.itemIndex)
        }
        default:
          return currentItems
      }
    },
  )

  // Use optimistic cart items for display
  const cartItems = isAuthenticated ? optimisticCartItems : baseCartItems

  const hasItems = cartItems.length > 0

  // Show loading only if the hook says we're loading.
  // Once isLoading is false, the cart query has resolved (even if cart is null or items are empty).
  // Note: cartItemCount may be > 0 while cartItems is empty if products were filtered out by safeGet
  // (e.g., products deleted or invalid IDs). In that case, show empty cart, not loading.
  const isStillLoading = isLoading && !hasItems

  const applyOptimisticCartAction = (action: OptimisticAction) => {
    if (!isAuthenticated) return
    setOptimisticCartItems(action)
  }

  // Calculate optimistic cart item count
  const optimisticCartItemCount = useMemo(() => {
    return cartItems.reduce((total, item) => {
      if (isProductCartItemWithProduct(item)) return total + item.quantity
      return total + 1
    }, 0)
  }, [cartItems])

  const subtotal = useMemo(() => {
    return cartItems.reduce((total, item) => {
      if (isProductCartItemWithProduct(item)) {
        const unitCents = getUnitPriceCents(item.product, item.denomination)
        return total + unitCents * item.quantity
      }
      const config = configs[item.bundleType]
      const variation = config?.variations[item.variationIndex]
      if (!variation) return total
      const denom = variation.denominationPerUnit
      const bundleAmount = variation.totalUnits * denom
      const products = item.bundleItemsWithProducts.map((bi) => bi.product)
      const bundleCents = getBundleTotalCents(products, denom, bundleAmount)
      return total + bundleCents
    }, 0)
  }, [cartItems, configs])
  const availableCashBackCents = Math.max(
    0,
    Math.round((pointsBalance?.availablePoints ?? 0) * 100),
  )
  const appliedCashBackCents =
    isCashBackEnabled && subtotal >= CASH_BACK_REDEMPTION_MINIMUM_ORDER_CENTS
      ? Math.min(availableCashBackCents, subtotal)
      : 0
  const discountedSubtotal = Math.max(0, subtotal - appliedCashBackCents)

  const handleCashBackToggle = (nextValue: boolean) => {
    startTransition(() => {
      setCashBackEnabled(nextValue)
    })
  }

  const handleCartCheckout = () => {
    if (!user) {
      onOpenChange(false)
      window.setTimeout(() => {
        onAuthOpen()
      }, 0)
      return
    }
    onOpenChange(false)
    router.push('/lobby/cart')
  }

  return (
    <>
      <Drawer.Root open={open} onOpenChange={onOpenChange} direction='right'>
        <Drawer.Portal>
          <Drawer.Overlay className='fixed inset-0 bg-slate-950/60 backdrop-grayscale' />
          <Drawer.Content className='z-9999 border-l-[0.33px] border-foreground/20 bg-linear-to-b from-background dark:from-black to-background flex flex-col h-full md:w-2xl w-screen fixed overflow-hidden bottom-0 right-0'>
            <div className='py-4 flex-1 overflow-y-scroll overflow-x-hidden w-screen md:w-full'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-4 mb-4 px-4'>
                  <Drawer.Title className='text-base md:text-lg lg:text-2xl font-semibold tracking-normal font-clash'>
                    In Cart
                  </Drawer.Title>
                  <Drawer.Description asChild>
                    <div className='flex items-center h-7 p-1'>
                      <span className='ml-1 font-clash text-base md:text-lg lg:text-2xl px-2 opacity-70'>
                        <span className='mr-1.5'>{cartItemCount}</span>
                        <span className='tracking-tighter'>
                          item{cartItemCount > 1 ? `s` : null}
                        </span>
                      </span>
                    </div>
                  </Drawer.Description>
                </div>

                <div className='flex items-center mb-4 mr-4 space-x-4 md:space-x-6'>
                  {user && (
                    <Avatar className='relative size-9 border border-white/50 bg-background/90 text-foreground shadow-[0_10px_30px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-dark-table'>
                      <Avatar.Image
                        alt={user.displayName ?? 'pfp'}
                        src={user.photoURL ?? undefined}
                      />
                      <Avatar.Fallback className='bg-background/90 text-[11px] font-medium tracking-tight text-foreground dark:bg-dark-table'>
                        {getInitials(user.displayName)}
                      </Avatar.Fallback>
                    </Avatar>
                  )}
                  <Button
                    size='sm'
                    isIconOnly
                    variant='tertiary'
                    className='flex items-center justify-center size-8'
                    onPress={() => onOpenChange(false)}>
                    <Icon name='x' className='size-4 m-auto' />
                  </Button>
                </div>
              </div>
              {isStillLoading ? (
                <div className='flex items-center justify-center py-12'>
                  <p className='text-color-muted'>Loading cart...</p>
                </div>
              ) : !hasItems && !isPending ? (
                <div className='flex flex-col h-fit'>
                  <EmptyCart onPress={() => onOpenChange(false)} />
                  <SuggestedCartItems />
                </div>
              ) : (
                <>
                  <CartDrawerItems
                    cartItems={cartItems}
                    resolveUrl={resolveUrl}
                    isPending={isPending}
                    startTransition={startTransition}
                    applyOptimisticCartAction={applyOptimisticCartAction}
                    updateItem={updateItem}
                    removeItem={removeItem}
                    removeBundle={removeBundle}
                  />

                  <div className='font-clash space-y-3 px-4 mb-6'>
                    <div className='flex justify-between px-2'>
                      <span className='text-lg font-medium'>Subtotal</span>
                      <span className='font-medium text-lg'>
                        ${formatPrice(subtotal)}
                      </span>
                    </div>
                    {isAuthenticated && (
                      <CashBackRedemption
                        availableBalanceCents={availableCashBackCents}
                        appliedBalanceCents={appliedCashBackCents}
                        subtotalCents={subtotal}
                        isEnabled={isCashBackEnabled}
                        onToggle={handleCashBackToggle}
                      />
                    )}
                    <CashBackAppliedRow amountCents={appliedCashBackCents} />
                    <ViewTransition
                      update={CART_SUMMARY_FOLLOW_VIEW_TRANSITION}
                      default='none'>
                      <div className='flex justify-between font-clash px-2'>
                        <span className='text-lg font-medium'>
                          {appliedCashBackCents > 0
                            ? 'Due today'
                            : 'Current total'}
                        </span>

                        <span className='font-medium text-lg'>
                          ${formatPrice(discountedSubtotal)}
                        </span>
                      </div>
                    </ViewTransition>
                    <ViewTransition
                      update={CART_SUMMARY_FOLLOW_VIEW_TRANSITION}
                      default='none'>
                      <div className='flex justify-between font-clash px-2'>
                        <span className='text-lg font-medium'>Total Items</span>
                        <span className='font-medium text-lg'>
                          {optimisticCartItemCount}
                        </span>
                      </div>
                    </ViewTransition>
                  </div>

                  <ViewTransition
                    update={CART_SUMMARY_FOLLOW_VIEW_TRANSITION}
                    default='none'>
                    <div className='mx-auto mb-3 px-4'>
                      <Button
                        size='lg'
                        className='w-full sm:flex-1 h-15 font-polysans font-normal text-lg bg-foreground/95 text-white dark:text-dark-gray rounded-xs'
                        onPress={handleCartCheckout}>
                        <span className='font-bold font-polysans text-lg'>
                          {user ? 'Checkout' : 'Sign in'}
                        </span>
                      </Button>
                    </div>
                  </ViewTransition>
                  <ViewTransition
                    update={CART_SUMMARY_FOLLOW_VIEW_TRANSITION}
                    default='none'>
                    <button
                      type='button'
                      onClick={() => {
                        onOpenChange(false)
                      }}
                      className='font-okxs w-full text-sm text-color-muted hover:text-foreground transition-colors text-center py-2'>
                      Continue Shopping
                    </button>
                  </ViewTransition>
                </>
              )}
              <div className=' pb-24'></div>
            </div>
            <DrawerFooter className='p-0'>
              <div className='h-10 p-0 w-full text-light-brand flex items-center justify-center'>
                <Icon name='rapid-fire-latest' className='mr-2 w-20' />
                <span className='text-sm'>
                  <span className='font-clash tracking-tight'>
                    &copy;{new Date().getFullYear()}
                  </span>
                </span>
              </div>
            </DrawerFooter>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
      <AuthModal isOpen={isAuthOpen} onClose={onAuthClose} mode='login' />
    </>
  )
}

'use client'

import {useDealConfigs} from '@/app/lobby/(store)/deals/hooks/use-deal-configs'
import {AuthModal} from '@/components/auth/auth-modal'
import {HeroAvatarImage} from '@/components/ui/heroui-avatar-image'
import {useAuthCtx} from '@/ctx/auth'
import {
  type CartItemWithProduct,
  isProductCartItemWithProduct,
  useCart,
} from '@/hooks/use-cart'
import {useDisclosure} from '@/hooks/use-disclosure'
import {useStorageUrls} from '@/hooks/use-storage-urls'
import {Icon} from '@/lib/icons'
import {
  getBundleTotalCents,
  getRegularBundleTotalCents,
  getRegularUnitPriceCents,
  getUnitPriceCents,
} from '@/utils/cartPrice'
import {Avatar, Button} from '@heroui/react'
import {useRouter} from 'next/navigation'
import {useCallback, useMemo, useOptimistic, useTransition} from 'react'
import {Drawer} from 'vaul'
import {DrawerFooter} from '../ui/drawer'
import {EmptyCart} from './empty-cart'
import {SuggestedCartItems} from './suggested-cart-items'

// import {LegacyImage} from '@/components/ui/legacy-image'
import {getInitials} from '@/utils/initials'
import {CartDrawerItems} from './cart-drawer-items'
import {CartSummary} from './cart-summary'

import {Id} from '@/convex/_generated/dataModel'

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
  const {user, convexUser, convexUserId} = useAuthCtx()
  const {configs} = useDealConfigs()
  const {
    isOpen: isAuthOpen,
    onOpen: onAuthOpen,
    onClose: onAuthClose,
  } = useDisclosure()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

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

  const {subtotal, regularSubtotal} = useMemo(() => {
    return cartItems.reduce(
      (totals, item) => {
        if (isProductCartItemWithProduct(item)) {
          const unitCents = getUnitPriceCents(item.product, item.denomination)
          const regularUnitCents = getRegularUnitPriceCents(
            item.product,
            item.denomination,
          )
          return {
            subtotal: totals.subtotal + unitCents * item.quantity,
            regularSubtotal:
              totals.regularSubtotal + regularUnitCents * item.quantity,
          }
        }

        const config = configs[item.bundleType]
        const variation = config?.variations[item.variationIndex]
        if (!variation) return totals

        const denom = variation.denominationPerUnit
        const bundleAmount = variation.totalUnits * denom
        const products = item.bundleItemsWithProducts.map((bi) => bi.product)
        const bundleCents = getBundleTotalCents(products, denom, bundleAmount)
        const regularBundleCents = getRegularBundleTotalCents(
          products,
          denom,
          bundleAmount,
        )
        return {
          subtotal: totals.subtotal + bundleCents,
          regularSubtotal: totals.regularSubtotal + regularBundleCents,
        }
      },
      {subtotal: 0, regularSubtotal: 0},
    )
  }, [cartItems, configs])
  const userAvatarLabel =
    user?.displayName?.trim() ||
    convexUser?.name?.trim() ||
    user?.email?.split('@')[0]?.trim() ||
    user?.email?.trim() ||
    'User'

  const handleCartCheckout = useCallback(() => {
    if (!user) {
      onOpenChange(false)
      window.setTimeout(() => {
        onAuthOpen()
      }, 0)
      return
    }
    onOpenChange(false)
    router.push('/lobby/cart')
  }, [user, onOpenChange, onAuthOpen, router])

  const handleClose = useCallback(() => onOpenChange(false), [onOpenChange])

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
                      <HeroAvatarImage
                        alt={userAvatarLabel}
                        src={user.photoURL ?? undefined}
                      />
                      <Avatar.Fallback className='bg-background/90 text-[11px] font-medium tracking-tight text-foreground dark:bg-dark-table'>
                        {getInitials(userAvatarLabel)}
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

                  <CartSummary
                    subtotal={subtotal}
                    regularSubtotal={regularSubtotal}
                    isAuthenticated={isAuthenticated}
                    convexUserId={convexUserId}
                    optimisticCartItemCount={optimisticCartItemCount}
                    isSignedIn={!!user}
                    onCheckout={handleCartCheckout}
                    onClose={handleClose}
                  />
                </>
              )}
              <div className=' pb-24'></div>
            </div>
            <DrawerFooter className='p-0'>
              <div className='h-10 p-0 w-full flex items-center justify-center'>
                <Icon
                  name='rapid-fire-latest'
                  className='mr-2 w-20 text-light-brand'
                />
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

'use client'

import {clearGuestCart, getGuestCartItems} from '@/app/actions'
import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {ProductType} from '@/convex/products/d'
import {addToCartHistory} from '@/lib/localStorageCartHistory'
import {
  addToLocalStorageCart,
  clearLocalStorageCart,
  getLocalStorageCartItems,
  LOCAL_STORAGE_CART_UPDATED_EVENT,
  removeFromLocalStorageCart,
  setLocalStorageCartItems,
  updateLocalStorageCartItem,
} from '@/lib/localStorageCart'
import {useMutation, useQuery} from 'convex/react'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {useAuth} from './use-auth'

/**
 * Cart hook that uses different storage based on authentication:
 *
 * - Authenticated users: Cart is stored in Convex, linked to userId
 * - Unauthenticated users: Cart is stored in localStorage (hyfe_cart_items:v1)
 * - When user authenticates: Guest cart items are merged into Convex cart
 * - When user checks out: Guest cart items are synced to Convex before order creation
 *
 * Reactivity Flow:
 * - Authenticated: Uses Convex queries which automatically subscribe and update
 * - Unauthenticated: Uses localStorage + LOCAL_STORAGE_CART_UPDATED_EVENT for sync across instances
 */
type CartItemWithProduct = {
  productId: Id<'products'>
  quantity: number
  denomination?: number
  product: ProductType & {
    _id: Id<'products'>
    _creationTime: number
  }
}

type CartWithProducts = {
  _id: Id<'carts'>
  userId: Id<'users'> | null
  updatedAt: number
  items: CartItemWithProduct[]
}

interface UseCartResult {
  cart: CartWithProducts | null
  cartItemCount: number
  addItem: (
    productId: Id<'products'>,
    quantity?: number,
    denomination?: number,
  ) => Promise<Id<'carts'>>
  removeItem: (
    productId: Id<'products'>,
    denomination?: number,
  ) => Promise<void>
  updateItem: (
    productId: Id<'products'>,
    quantity: number,
    denomination?: number,
  ) => Promise<void>
  clear: () => Promise<void>
  isLoading: boolean
  isAuthenticated: boolean
}

export const useCart = (): UseCartResult => {
  const {user} = useAuth()
  const hasMergedRef = useRef(false)
  const mergeLockKeyRef = useRef<string | null>(null)
  const prevAuthenticatedRef = useRef<boolean | undefined>(undefined)
  const [guestCartItems, setGuestCartItems] = useState<
    Array<{productId: Id<'products'>; quantity: number; denomination?: number}>
  >([])
  const [isLoadingGuestCart, setIsLoadingGuestCart] = useState(true)

  // Get user ID from Convex - this query automatically subscribes and updates
  const convexUser = useQuery(
    api.users.q.getCurrentUser,
    user ? {firebaseId: user.uid} : 'skip',
  )

  // Memoize userId to ensure stability for cart queries
  const userId = useMemo(() => convexUser?._id, [convexUser?._id])
  const isAuthenticated = !!user && !!userId

  // Load guest cart from localStorage on mount. Migrate cookie→localStorage once, then subscribe to sync events.
  const storageListenerRef = useRef<(() => void) | null>(null)
  useEffect(() => {
    if (isAuthenticated) {
      setIsLoadingGuestCart(false)
      return
    }

    let cancelled = false
    const onCartUpdated = (e: Event) => {
      const custom = e as CustomEvent<Array<{productId: Id<'products'>; quantity: number; denomination?: number}>>
      if (custom.detail) setGuestCartItems(custom.detail)
    }

    ;(async () => {
      try {
        // One-time migration: copy cookie guest cart to localStorage, then clear cookie
        const cookieItems = await getGuestCartItems()
        if (cancelled) return
        if (cookieItems.length > 0) {
          setLocalStorageCartItems(cookieItems)
          await clearGuestCart()
        }
        if (cancelled) return

        const items = getLocalStorageCartItems()
        setGuestCartItems(items)
        if (typeof window === 'undefined' || cancelled) return
        window.addEventListener(LOCAL_STORAGE_CART_UPDATED_EVENT, onCartUpdated)
        storageListenerRef.current = () =>
          window.removeEventListener(LOCAL_STORAGE_CART_UPDATED_EVENT, onCartUpdated)
      } catch (error) {
        if (!cancelled) console.error('Failed to load guest cart:', error)
        setGuestCartItems([])
      } finally {
        if (!cancelled) setIsLoadingGuestCart(false)
      }
    })()

    return () => {
      cancelled = true
      storageListenerRef.current?.()
      storageListenerRef.current = null
    }
  }, [isAuthenticated])

  // Get product IDs from guest cart
  const guestCartProductIds = useMemo(() => {
    return guestCartItems.map((item) => item.productId)
  }, [guestCartItems])

  // Fetch products for guest cart items
  const guestCartProducts = useQuery(
    api.products.q.getProductsByIds,
    !isAuthenticated && guestCartProductIds.length > 0
      ? {productIds: guestCartProductIds}
      : 'skip',
  )

  // Build cart from guest cart items with product data
  const guestCart = useMemo<CartWithProducts | null>(() => {
    if (isAuthenticated || !guestCartItems.length) return null
    if (guestCartProducts === undefined) return null

    const productMap = new Map(guestCartProducts.map((p) => [p._id, p]))
    const items: CartItemWithProduct[] = guestCartItems
      .map((item) => {
        const product = productMap.get(item.productId)
        if (!product) return null
        return {
          ...item,
          product: {
            ...product,
            _id: product._id,
            _creationTime: product._creationTime,
          },
        }
      })
      .filter((item): item is CartItemWithProduct => item !== null)

    return {
      _id: 'guest-cart' as Id<'carts'>,
      userId: null,
      updatedAt: 0,
      items,
    }
  }, [isAuthenticated, guestCartItems, guestCartProducts])

  // Determine which cart identifier to use (only for authenticated users)
  const cartIdentifier = useMemo(() => {
    if (isAuthenticated && userId) {
      return {userId}
    }
    return null
  }, [isAuthenticated, userId])

  // Server cart queries - only for authenticated users
  const serverCart = useQuery(
    api.cart.q.getCart,
    cartIdentifier ? cartIdentifier : 'skip',
  )

  // Separate query for cart item count - only for authenticated users
  const serverCartItemCount = useQuery(
    api.cart.q.getCartItemCount,
    cartIdentifier ? cartIdentifier : 'skip',
  )

  // Mutations (only used for authenticated users)
  const addToCartMutation = useMutation(api.cart.m.addToCart)
  const updateCartItemMutation = useMutation(api.cart.m.updateCartItem)
  const removeFromCartMutation = useMutation(api.cart.m.removeFromCart)
  const clearCartMutation = useMutation(api.cart.m.clearCart)

  // When user authenticates, merge guest cart into Convex cart
  useEffect(() => {
    const wasAuthenticated = prevAuthenticatedRef.current
    prevAuthenticatedRef.current = isAuthenticated

    // Only reset merge flag on true logout (firebase user becomes null).
    // During sign-in, `isAuthenticated` can temporarily be false while `userId` is loading.
    // Resetting on that transient state can cause the merge to run multiple times.
    if (!user) {
      hasMergedRef.current = false
      if (typeof window !== 'undefined' && mergeLockKeyRef.current) {
        try {
          sessionStorage.removeItem(mergeLockKeyRef.current)
        } catch {
          // ignore
        } finally {
          mergeLockKeyRef.current = null
        }
      }
    } else if (
      wasAuthenticated === false &&
      isAuthenticated &&
      userId &&
      guestCartItems.length > 0 &&
      !hasMergedRef.current
    ) {
      // Merge guest cart into Convex when user authenticates
      hasMergedRef.current = true
      const mergeCart = async () => {
        const mergeLockKey = `hyfe_cart_merge_done:${user.uid}`
        mergeLockKeyRef.current = mergeLockKey

        // Cross-instance lock: multiple `useCart()` hook instances can mount (navbar slot,
        // cart drawer, page, etc.). We only want ONE of them to perform the merge.
        if (typeof window !== 'undefined') {
          try {
            const existing = sessionStorage.getItem(mergeLockKey)
            if (existing) {
              return
            }
            sessionStorage.setItem(mergeLockKey, String(Date.now()))
          } catch {
            // If sessionStorage is unavailable, fall through and attempt merge once per instance.
          }
        }

        try {
          const itemsToMerge = [...guestCartItems]
          // Add each guest cart item to Convex cart
          for (const item of itemsToMerge) {
            await addToCartMutation({
              userId,
              productId: item.productId,
              quantity: item.quantity,
              denomination: item.denomination,
            })
          }
          // Clear guest cart (localStorage) after successful merge
          clearLocalStorageCart()
          setGuestCartItems([])

          if (process.env.NODE_ENV === 'development') {
            console.log(
              '[useCart] Guest cart merged on authentication:',
              {
                itemsCount: itemsToMerge.length,
                userId,
              },
            )
          }
        } catch (error) {
          console.error('Failed to merge guest cart:', error)
          // Reset merge flag on error so we can retry
          hasMergedRef.current = false
          if (typeof window !== 'undefined') {
            try {
              sessionStorage.removeItem(mergeLockKey)
            } catch {
              // ignore
            }
          }
        }
      }
      mergeCart()
    }
  }, [user, isAuthenticated, userId, guestCartItems, addToCartMutation])

  // Add item to cart - uses server actions for unauthenticated users
  const addItem = useCallback(
    async (
      productId: Id<'products'>,
      quantity: number = 1,
      denomination?: number,
    ) => {
      if (isAuthenticated && userId) {
        // Use Convex for authenticated users
        const cartId = await addToCartMutation({
          userId,
          productId,
          quantity,
          denomination,
        })
        return cartId
      } else {
        // Use localStorage for unauthenticated users
        const newItems = addToLocalStorageCart(productId, quantity, denomination)
        setGuestCartItems(newItems)
        return 'guest-cart' as Id<'carts'>
      }
    },
    [isAuthenticated, userId, addToCartMutation],
  )

  // Update item in cart
  const updateItem = useCallback(
    async (
      productId: Id<'products'>,
      quantity: number,
      denomination?: number,
    ) => {
      if (isAuthenticated && userId) {
        // Use Convex for authenticated users
        await updateCartItemMutation({
          userId,
          productId,
          quantity,
          denomination,
        })
      } else {
        // Use localStorage for unauthenticated users
        const newItems = updateLocalStorageCartItem(productId, quantity, denomination)
        setGuestCartItems(newItems)
      }
    },
    [isAuthenticated, userId, updateCartItemMutation],
  )

  // Remove item from cart
  const removeItem = useCallback(
    async (productId: Id<'products'>, denomination?: number) => {
      // Add to cart history before removing
      addToCartHistory(productId, denomination)

      if (isAuthenticated && userId) {
        // Use Convex for authenticated users
        await removeFromCartMutation({
          userId,
          productId,
          denomination,
        })
      } else {
        // Use localStorage for unauthenticated users
        const newItems = removeFromLocalStorageCart(productId, denomination)
        setGuestCartItems(newItems)
      }
    },
    [isAuthenticated, userId, removeFromCartMutation],
  )

  // Clear cart
  const clear = useCallback(async () => {
    if (isAuthenticated && userId) {
      await clearCartMutation({userId})
    } else {
      clearLocalStorageCart()
      setGuestCartItems([])
    }
  }, [isAuthenticated, userId, clearCartMutation])

  // Determine which cart to return
  const cart = useMemo(() => {
    if (isAuthenticated) {
      return serverCart ?? null
    }
    return guestCart
  }, [isAuthenticated, serverCart, guestCart])

  // Cart item count: use Convex count (auth) or guest cart sum (guest).
  // Badge and list both consume this; display uses cart.items.
  const cartItemCount = useMemo(() => {
    if (isAuthenticated) {
      return serverCartItemCount ?? 0
    }
    return guestCartItems.reduce((total, item) => total + item.quantity, 0)
  }, [isAuthenticated, guestCartItems, serverCartItemCount])

  // Determine loading state
  // When Firebase user exists but Convex user is still loading, we're resolving auth.
  // Show loader until we know—otherwise we'd show empty guest cart then switch to server cart.
  const isLoading = useMemo(() => {
    // If we have Firebase user but Convex user is still loading, show loader
    const isResolvingAuth = Boolean(user && convexUser === undefined)
    if (isResolvingAuth) return true
    if (isAuthenticated) {
      return serverCart === undefined
    }
    return (
      isLoadingGuestCart ||
      (guestCartProducts === undefined && guestCartItems.length > 0)
    )
  }, [
    user,
    convexUser,
    isAuthenticated,
    serverCart,
    guestCartProducts,
    guestCartItems,
    isLoadingGuestCart,
  ])

  return {
    cart,
    cartItemCount,
    addItem,
    updateItem,
    removeItem,
    clear,
    isLoading,
    isAuthenticated,
  }
}

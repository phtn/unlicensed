'use client'

import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {ProductType} from '@/convex/products/d'
import {
  addToLocalStorageCart,
  clearLocalStorageCart,
  getLocalStorageCartItemCount,
  getLocalStorageCartItems,
  removeFromLocalStorageCart,
  updateLocalStorageCartItem,
} from '@/lib/localStorageCart'
import {useMutation, useQuery} from 'convex/react'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {useAuth} from './use-auth'

/**
 * Cart hook that uses different storage based on authentication:
 *
 * - Authenticated users: Cart is stored in Convex, linked to userId
 * - Unauthenticated users: Cart is stored in local storage
 * - When user authenticates: Local storage items are merged into Convex cart
 * - When user checks out: Local storage items are synced to Convex before order creation
 *
 * Reactivity Flow:
 * - Authenticated: Uses Convex queries which automatically subscribe and update
 * - Unauthenticated: Uses local storage with manual state updates
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
  const prevAuthenticatedRef = useRef<boolean | undefined>(undefined)
  const [localStorageCartItems, setLocalStorageCartItems] = useState(() =>
    typeof window !== 'undefined' ? getLocalStorageCartItems() : [],
  )

  // Get user ID from Convex - this query automatically subscribes and updates
  const convexUser = useQuery(
    api.users.q.getCurrentUser,
    user ? {firebaseId: user.uid} : 'skip',
  )

  // Memoize userId to ensure stability for cart queries
  const userId = useMemo(() => convexUser?._id, [convexUser?._id])
  const isAuthenticated = !!user && !!userId

  // Get product IDs from local storage cart
  const localStorageProductIds = useMemo(() => {
    return localStorageCartItems.map((item) => item.productId)
  }, [localStorageCartItems])

  // Fetch products for local storage cart items
  const localStorageProducts = useQuery(
    api.products.q.getProductsByIds,
    !isAuthenticated && localStorageProductIds.length > 0
      ? {productIds: localStorageProductIds}
      : 'skip',
  )

  // Build cart from local storage items with product data
  const localStorageCart = useMemo<CartWithProducts | null>(() => {
    if (isAuthenticated || !localStorageCartItems.length) return null
    if (localStorageProducts === undefined) return null // Still loading

    // Create a map of productId -> product for quick lookup
    const productMap = new Map(
      localStorageProducts.map((p) => [p._id, p]),
    )

    // Build cart items with product data
    const items: CartItemWithProduct[] = localStorageCartItems
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
      _id: 'local-storage' as Id<'carts'>,
      userId: null,
      updatedAt: 0,
      items,
    }
  }, [isAuthenticated, localStorageCartItems, localStorageProducts])

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

  // When user authenticates, merge local storage cart into Convex cart
  useEffect(() => {
    const wasAuthenticated = prevAuthenticatedRef.current
    prevAuthenticatedRef.current = isAuthenticated

    if (!isAuthenticated) {
      // Reset merge flag when user logs out
      hasMergedRef.current = false
    } else if (
      wasAuthenticated === false &&
      isAuthenticated &&
      userId &&
      localStorageCartItems.length > 0 &&
      !hasMergedRef.current
    ) {
      // Merge local storage cart into Convex when user authenticates
      hasMergedRef.current = true
      const mergeCart = async () => {
        try {
          // Add each local storage item to Convex cart
          for (const item of localStorageCartItems) {
            await addToCartMutation({
              userId,
              productId: item.productId,
              quantity: item.quantity,
              denomination: item.denomination,
            })
          }
          // Clear local storage after successful merge
          clearLocalStorageCart()
          setLocalStorageCartItems([])

          if (process.env.NODE_ENV === 'development') {
            console.log('[useCart] Local storage cart merged on authentication:', {
              itemsCount: localStorageCartItems.length,
              userId,
            })
          }
        } catch (error) {
          console.error('Failed to merge local storage cart:', error)
          // Reset merge flag on error so we can retry
          hasMergedRef.current = false
        }
      }
      mergeCart()
    }
  }, [
    isAuthenticated,
    userId,
    localStorageCartItems,
    addToCartMutation,
  ])

  // Add item to cart - uses local storage for unauthenticated users
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
        // Use local storage for unauthenticated users
        const newItems = addToLocalStorageCart(
          productId,
          quantity,
          denomination,
        )
        setLocalStorageCartItems(newItems)
        // Return a dummy cart ID for unauthenticated users
        return 'local-storage' as Id<'carts'>
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
        // Use local storage for unauthenticated users
        const newItems = updateLocalStorageCartItem(
          productId,
          quantity,
          denomination,
        )
        setLocalStorageCartItems(newItems)
      }
    },
    [isAuthenticated, userId, updateCartItemMutation],
  )

  // Remove item from cart
  const removeItem = useCallback(
    async (productId: Id<'products'>, denomination?: number) => {
      if (isAuthenticated && userId) {
        // Use Convex for authenticated users
        await removeFromCartMutation({
          userId,
          productId,
          denomination,
        })
      } else {
        // Use local storage for unauthenticated users
        const newItems = removeFromLocalStorageCart(productId, denomination)
        setLocalStorageCartItems(newItems)
      }
    },
    [isAuthenticated, userId, removeFromCartMutation],
  )

  // Clear cart
  const clear = useCallback(async () => {
      if (isAuthenticated && userId) {
        // Use Convex for authenticated users
        await clearCartMutation({userId})
      } else {
        // Use local storage for unauthenticated users
        clearLocalStorageCart()
        setLocalStorageCartItems([])
      }
    },
    [isAuthenticated, userId, clearCartMutation],
  )

  // Calculate cart item count
  const cartItemCount = useMemo(() => {
    if (isAuthenticated) {
      return serverCartItemCount ?? 0
    } else {
      return getLocalStorageCartItemCount()
    }
  }, [isAuthenticated, serverCartItemCount])

  // Determine which cart to return
  const cart = useMemo(() => {
    if (isAuthenticated) {
      return serverCart ?? null
    } else {
      return localStorageCart
    }
  }, [isAuthenticated, serverCart, localStorageCart])

  // Determine loading state
  const isLoading = useMemo(() => {
    if (isAuthenticated) {
      return serverCart === undefined
    } else {
      return localStorageProducts === undefined && localStorageCartItems.length > 0
    }
  }, [isAuthenticated, serverCart, localStorageProducts, localStorageCartItems])

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

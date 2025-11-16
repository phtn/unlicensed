'use client'

import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {ProductType} from '@/convex/products/d'
import {deleteCartCookie, getCartCookie, setCartCookie} from '@/lib/cookies'
import {useMutation, useQuery} from 'convex/react'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {useAuth} from './use-auth'

/**
 * Cart hook that uses Convex for all cart operations.
 *
 * Supports both authenticated and anonymous users:
 * - Authenticated users: Cart is linked to userId
 * - Anonymous users: Cart ID is stored in secure cookie
 * - When user authenticates: Anonymous cart is merged with user cart and cookie is deleted
 *
 * Reactivity Flow:
 * - Uses Convex queries (serverCart, serverCartItemCount) which automatically
 *   subscribe and update when cart mutations (addToCart, removeFromCart, etc.) complete.
 * - Convex's reactive subscription system ensures queries update in real-time without manual refresh.
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
  // Lazy initialization: read from cookie on first render
  const [anonymousCartId, setAnonymousCartId] = useState<Id<'carts'> | null>(
    () => {
      if (typeof window === 'undefined') return null
      const cartId = getCartCookie()
      return cartId ? (cartId as Id<'carts'>) : null
    },
  )
  const hasMergedRef = useRef(false)
  const prevAuthenticatedRef = useRef<boolean | undefined>(undefined)

  // Get user ID from Convex - this query automatically subscribes and updates
  const convexUser = useQuery(
    api.users.q.getCurrentUser,
    user ? {firebaseId: user.uid} : 'skip',
  )

  // Memoize userId to ensure stability for cart queries
  const userId = useMemo(() => convexUser?._id, [convexUser?._id])
  const isAuthenticated = !!user && !!userId

  // Sync anonymous cart ID with authentication state
  useEffect(() => {
    const wasAuthenticated = prevAuthenticatedRef.current
    prevAuthenticatedRef.current = isAuthenticated

    if (!isAuthenticated) {
      // Reset merge flag when user logs out
      hasMergedRef.current = false
    } else if (wasAuthenticated === false) {
      // Clear anonymous cart ID when transitioning from unauthenticated to authenticated
      // Defer state update to avoid lint error
      queueMicrotask(() => {
        setAnonymousCartId(null)
        deleteCartCookie()
      })
    }
  }, [isAuthenticated])

  // Determine which cart identifier to use
  const cartIdentifier = useMemo(() => {
    if (isAuthenticated && userId) {
      return {userId}
    } else if (anonymousCartId) {
      return {cartId: anonymousCartId}
    }
    return null
  }, [isAuthenticated, userId, anonymousCartId])

  // Server cart queries - automatically subscribe when cart identifier is available
  const serverCart = useQuery(
    api.cart.q.getCart,
    cartIdentifier ? cartIdentifier : 'skip',
  )

  // Separate query for cart item count
  const serverCartItemCount = useQuery(
    api.cart.q.getCartItemCount,
    cartIdentifier ? cartIdentifier : 'skip',
  )

  // Mutations
  const addToCartMutation = useMutation(api.cart.m.addToCart)
  const updateCartItemMutation = useMutation(api.cart.m.updateCartItem)
  const removeFromCartMutation = useMutation(api.cart.m.removeFromCart)
  const clearCartMutation = useMutation(api.cart.m.clearCart)
  const updateCartUserIdMutation = useMutation(api.cart.m.updateCartUserId)

  // When user authenticates, merge anonymous cart with user cart
  // This effect runs when user logs in and has an anonymous cart
  useEffect(() => {
    if (isAuthenticated && userId && anonymousCartId && !hasMergedRef.current) {
      hasMergedRef.current = true
      // Merge cart when user authenticates
      // We don't wait for serverCart to load because the merge will update it
      const mergeCart = async () => {
        try {
          const mergedCartId = await updateCartUserIdMutation({
            cartId: anonymousCartId,
            userId,
          })
          // Clear anonymous cart ID after merge
          setAnonymousCartId(null)

          if (process.env.NODE_ENV === 'development') {
            console.log('[useCart] Cart merged on authentication:', {
              anonymousCartId,
              mergedCartId,
              userId,
            })
          }
        } catch (error) {
          console.error('Failed to merge cart:', error)
          // Reset merge flag on error so we can retry
          hasMergedRef.current = false
        }
      }
      mergeCart()
    }
  }, [isAuthenticated, userId, anonymousCartId, updateCartUserIdMutation])

  // Add item to cart - works for both authenticated and anonymous users
  const addItem = useCallback(
    async (
      productId: Id<'products'>,
      quantity: number = 1,
      denomination?: number,
    ) => {
      let cartId: Id<'carts'>

      if (isAuthenticated && userId) {
        cartId = await addToCartMutation({
          userId,
          productId,
          quantity,
          denomination,
        })
      } else {
        // For anonymous users, create cart if it doesn't exist
        if (!anonymousCartId) {
          cartId = await addToCartMutation({
            userId: null,
            productId,
            quantity,
            denomination,
          })
          // Store cart ID in cookie
          setCartCookie(cartId)
          setAnonymousCartId(cartId)
        } else {
          cartId = await addToCartMutation({
            cartId: anonymousCartId,
            productId,
            quantity,
            denomination,
          })
        }
      }

      return cartId
    },
    [isAuthenticated, userId, anonymousCartId, addToCartMutation],
  )

  // Update item in cart
  const updateItem = useCallback(
    async (
      productId: Id<'products'>,
      quantity: number,
      denomination?: number,
    ) => {
      const args = cartIdentifier
        ? {
            ...cartIdentifier,
            productId,
            quantity,
            denomination,
          }
        : null

      if (!args) {
        throw new Error('Cart not available')
      }

      await updateCartItemMutation(args)
    },
    [cartIdentifier, updateCartItemMutation],
  )

  // Remove item from cart
  const removeItem = useCallback(
    async (productId: Id<'products'>, denomination?: number) => {
      const args = cartIdentifier
        ? {
            ...cartIdentifier,
            productId,
            denomination,
          }
        : null

      if (!args) {
        throw new Error('Cart not available')
      }

      await removeFromCartMutation(args)
    },
    [cartIdentifier, removeFromCartMutation],
  )

  // Clear cart
  const clear = useCallback(async () => {
    const args = cartIdentifier || null

    if (!args) {
      throw new Error('Cart not available')
    }

    await clearCartMutation(args)
  }, [cartIdentifier, clearCartMutation])

  // Calculate cart item count
  const cartItemCount = useMemo(() => {
    const count = serverCartItemCount ?? 0

    // Debug: Log query updates to verify reactivity
    if (process.env.NODE_ENV === 'development') {
      console.log('[useCart] serverCartItemCount updated:', {
        count,
        serverCartItemCount,
        userId,
        anonymousCartId,
        isAuthenticated,
      })
    }

    return count
  }, [serverCartItemCount, userId, anonymousCartId, isAuthenticated])

  return {
    cart: serverCart ?? null,
    cartItemCount,
    addItem,
    updateItem,
    removeItem,
    clear,
    isLoading: cartIdentifier ? serverCart === undefined : false,
    isAuthenticated,
  }
}

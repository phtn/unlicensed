'use client'

import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {useAuthCtx} from '@/ctx/auth'
import {
  LOCAL_STORAGE_CART_KEY,
  LOCAL_STORAGE_CART_UPDATED_EVENT,
  getLocalStorageCartItems,
} from '@/lib/localStorageCart'
import {
  CART_PRODUCT_QUANTITIES_UPDATED_EVENT,
  type CartProductQuantitiesUpdatedDetail,
  getProductQuantityFromProductItems,
} from '@/lib/cart-product-quantities'
import {useQuery} from 'convex/react'
import {useEffect, useMemo, useState} from 'react'

const getGuestProductQuantity = (productId?: Id<'products'>) => {
  return getProductQuantityFromProductItems(getLocalStorageCartItems(), productId)
}

export const useProductCartQuantity = (productId?: Id<'products'>) => {
  const {user, convexUserId, isConvexUserLoading} = useAuthCtx()
  const userId = useMemo(() => convexUserId, [convexUserId])
  const isResolvingAuth = Boolean(user && isConvexUserLoading)
  const isAuthenticated = Boolean(user && userId)
  const productKey = productId ?? null

  const serverQuantity = useQuery(
    api.cart.q.getProductQuantity,
    isAuthenticated && userId && productId ? {userId, productId} : 'skip',
  )

  const [guestQuantity, setGuestQuantity] = useState(() =>
    getGuestProductQuantity(productId),
  )
  const [optimisticQuantity, setOptimisticQuantity] = useState<{
    baseline: number
    productKey: Id<'products'> | null
    value: number
  } | null>(null)

  useEffect(() => {
    if (!productId || isAuthenticated || isResolvingAuth) {
      return
    }

    const syncQuantity = () => {
      setGuestQuantity(getGuestProductQuantity(productId))
    }

    syncQuantity()

    if (typeof window === 'undefined') {
      return
    }

    const onCartUpdated = () => syncQuantity()
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === LOCAL_STORAGE_CART_KEY) {
        syncQuantity()
      }
    }

    window.addEventListener(
      LOCAL_STORAGE_CART_UPDATED_EVENT,
      onCartUpdated as EventListener,
    )
    window.addEventListener('storage', onStorage)

    return () => {
      window.removeEventListener(
        LOCAL_STORAGE_CART_UPDATED_EVENT,
        onCartUpdated as EventListener,
      )
      window.removeEventListener('storage', onStorage)
    }
  }, [isAuthenticated, isResolvingAuth, productId])

  const baseQuantity = isAuthenticated ? (serverQuantity ?? 0) : guestQuantity

  useEffect(() => {
    if (!productId || typeof window === 'undefined') {
      return
    }

    const onCartQuantitiesUpdated = (event: Event) => {
      const detail = (
        event as CustomEvent<CartProductQuantitiesUpdatedDetail>
      ).detail

      if (!detail) {
        return
      }

      const nextQuantity = detail.updates.find(
        (update) => update.productId === productId,
      )

      if (nextQuantity) {
        setOptimisticQuantity({
          baseline: baseQuantity,
          productKey,
          value: nextQuantity.quantity,
        })
        return
      }

      if (detail.replace) {
        setOptimisticQuantity({
          baseline: baseQuantity,
          productKey,
          value: 0,
        })
      }
    }

    window.addEventListener(
      CART_PRODUCT_QUANTITIES_UPDATED_EVENT,
      onCartQuantitiesUpdated as EventListener,
    )

    return () => {
      window.removeEventListener(
        CART_PRODUCT_QUANTITIES_UPDATED_EVENT,
        onCartQuantitiesUpdated as EventListener,
      )
    }
  }, [baseQuantity, productId, productKey])

  if (!productId || isResolvingAuth) {
    return 0
  }

  if (
    optimisticQuantity &&
    optimisticQuantity.productKey === productKey &&
    optimisticQuantity.baseline === baseQuantity
  ) {
    return optimisticQuantity.value
  }

  return baseQuantity
}

'use client'

import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {useAuthCtx} from '@/ctx/auth'
import {
  LOCAL_STORAGE_CART_KEY,
  LOCAL_STORAGE_CART_UPDATED_EVENT,
  getLocalStorageCartItems,
} from '@/lib/localStorageCart'
import {useQuery} from 'convex/react'
import {useEffect, useMemo, useState} from 'react'

const getGuestProductQuantity = (productId?: Id<'products'>) => {
  if (!productId) {
    return 0
  }

  return getLocalStorageCartItems().reduce(
    (total, item) =>
      item.productId === productId ? total + item.quantity : total,
    0,
  )
}

export const useProductCartQuantity = (productId?: Id<'products'>) => {
  const {user, convexUserId, isConvexUserLoading} = useAuthCtx()
  const userId = useMemo(() => convexUserId, [convexUserId])
  const isResolvingAuth = Boolean(user && isConvexUserLoading)
  const isAuthenticated = Boolean(user && userId)

  const serverQuantity = useQuery(
    api.cart.q.getProductQuantity,
    isAuthenticated && userId && productId ? {userId, productId} : 'skip',
  )

  const [guestQuantity, setGuestQuantity] = useState(() =>
    getGuestProductQuantity(productId),
  )

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

  if (!productId || isResolvingAuth) {
    return 0
  }

  return isAuthenticated ? (serverQuantity ?? 0) : guestQuantity
}

'use client'

import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {ProductType} from '@/convex/products/d'
import {
  addToCartHistory,
  CartHistoryItem,
  clearCartHistory,
  getCartHistoryItems,
  LOCAL_STORAGE_CART_HISTORY_KEY,
  LOCAL_STORAGE_CART_HISTORY_UPDATED_EVENT,
  removeFromCartHistory,
} from '@/lib/localStorageCartHistory'
import {useQuery} from 'convex/react'
import {useCallback, useEffect, useMemo, useState} from 'react'

export type CartHistoryItemWithProduct = {
  productId: Id<'products'>
  denomination?: number
  addedAt: number
  product: ProductType & {
    _id: Id<'products'>
    _creationTime: number
  }
}

interface UseCartHistoryResult {
  historyItems: CartHistoryItemWithProduct[]
  addToHistory: (productId: Id<'products'>, denomination?: number) => void
  removeFromHistory: (productId: Id<'products'>, denomination?: number) => void
  clearHistory: () => void
  isLoading: boolean
}

export const useCartHistory = (): UseCartHistoryResult => {
  const [historyData, setHistoryData] = useState<CartHistoryItem[]>(() =>
    typeof window !== 'undefined' ? getCartHistoryItems() : [],
  )

  // Get product IDs from history
  const productIds = useMemo(() => {
    const ids = historyData
      .map((item) => item.productId)
      .filter((id): id is Id<'products'> => typeof id === 'string' && id.length > 0)
    return Array.from(new Set(ids))
  }, [historyData])

  // Fetch products for history items
  const products = useQuery(
    api.products.q.getProductsByIds,
    productIds.length > 0 ? {productIds} : 'skip',
  )

  // Build history items with product data
  const historyItems = useMemo<CartHistoryItemWithProduct[]>(() => {
    if (!historyData.length) return []
    if (products === undefined) return [] // Still loading

    // Create a map of productId -> product for quick lookup
    const productMap = new Map(products.map((p) => [p._id, p]))

    // Build history items with product data
    return historyData
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
      .filter((item): item is CartHistoryItemWithProduct => item !== null)
  }, [historyData, products])

  // Sync with local storage changes (and read on mount so client has data after hydration)
  useEffect(() => {
    if (typeof window === 'undefined') return

    const syncFromLocalStorage = () => {
      setHistoryData(getCartHistoryItems())
    }

    // Sync from localStorage on mount so "Previously in cart" shows when history exists
    syncFromLocalStorage()

    const onHistoryUpdated = () => {
      syncFromLocalStorage()
    }

    const onStorage = (event: StorageEvent) => {
      if (event.key === LOCAL_STORAGE_CART_HISTORY_KEY) {
        syncFromLocalStorage()
      }
    }

    window.addEventListener(LOCAL_STORAGE_CART_HISTORY_UPDATED_EVENT, onHistoryUpdated)
    window.addEventListener('storage', onStorage)

    return () => {
      window.removeEventListener(LOCAL_STORAGE_CART_HISTORY_UPDATED_EVENT, onHistoryUpdated)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  const addToHistoryCallback = useCallback(
    (productId: Id<'products'>, denomination?: number) => {
      const newItems = addToCartHistory(productId, denomination)
      setHistoryData(newItems)
    },
    [],
  )

  const removeFromHistoryCallback = useCallback(
    (productId: Id<'products'>, denomination?: number) => {
      const newItems = removeFromCartHistory(productId, denomination)
      setHistoryData(newItems)
    },
    [],
  )

  const clearHistoryCallback = useCallback(() => {
    clearCartHistory()
    setHistoryData([])
  }, [])

  const isLoading = useMemo(() => {
    return products === undefined && historyData.length > 0
  }, [products, historyData])

  return {
    historyItems,
    addToHistory: addToHistoryCallback,
    removeFromHistory: removeFromHistoryCallback,
    clearHistory: clearHistoryCallback,
    isLoading,
  }
}

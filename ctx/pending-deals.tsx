'use client'

import {
  type BundleType,
  type PendingBundleItem,
  type PendingDeal,
} from '@/app/lobby/(store)/deals/lib/deal-types'
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

interface PendingDealsContextValue {
  pendingDeals: PendingDeal[]
  setPendingDeal: (
    bundleType: BundleType,
    items: PendingBundleItem[],
    requiredTotal: number,
  ) => void
  clearPendingDeal: (bundleType: BundleType) => void
  clearAllPending: () => void
}

const PendingDealsContext = createContext<
  PendingDealsContextValue | undefined
>(undefined)

export function PendingDealsProvider({children}: {children: ReactNode}) {
  const [deals, setDeals] = useState<Map<BundleType, PendingDeal>>(new Map())

  const setPendingDeal = useCallback(
    (
      bundleType: BundleType,
      items: PendingBundleItem[],
      requiredTotal: number,
    ) => {
      setDeals((prev) => {
        const next = new Map(prev)
        const totalSelected = items.reduce((s, i) => s + i.quantity, 0)
        if (totalSelected === 0) {
          next.delete(bundleType)
        } else {
          next.set(bundleType, {
            bundleType,
            items,
            totalSelected,
            requiredTotal,
          })
        }
        return next
      })
    },
    [],
  )

  const clearPendingDeal = useCallback((bundleType: BundleType) => {
    setDeals((prev) => {
      const next = new Map(prev)
      next.delete(bundleType)
      return next
    })
  }, [])

  const clearAllPending = useCallback(() => {
    setDeals(new Map())
  }, [])

  const pendingDeals = useMemo(
    () => Array.from(deals.values()),
    [deals],
  )

  const value = useMemo<PendingDealsContextValue>(
    () => ({
      pendingDeals,
      setPendingDeal,
      clearPendingDeal,
      clearAllPending,
    }),
    [pendingDeals, setPendingDeal, clearPendingDeal, clearAllPending],
  )

  return (
    <PendingDealsContext.Provider value={value}>
      {children}
    </PendingDealsContext.Provider>
  )
}

export function usePendingDeals() {
  const ctx = useContext(PendingDealsContext)
  return ctx
}

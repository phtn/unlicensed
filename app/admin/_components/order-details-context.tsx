'use client'

import type {Doc} from '@/convex/_generated/dataModel'
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from 'react'

type Order = Doc<'orders'>

interface OrderDetailsContextType {
  selectedOrder: Order | null
  setSelectedOrder: (order: Order | null) => void
  clearSelectedOrder: () => void
}

const OrderDetailsContext = createContext<OrderDetailsContextType | null>(null)

export function OrderDetailsProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [selectedOrder, setSelectedOrderState] = useState<Order | null>(null)

  const setSelectedOrder = useCallback((order: Order | null) => {
    setSelectedOrderState(order)
  }, [])

  const clearSelectedOrder = useCallback(() => {
    setSelectedOrderState(null)
  }, [])

  const value = useMemo(
    () => ({
      selectedOrder,
      setSelectedOrder,
      clearSelectedOrder,
    }),
    [selectedOrder, setSelectedOrder, clearSelectedOrder],
  )

  return (
    <OrderDetailsContext.Provider value={value}>
      {children}
    </OrderDetailsContext.Provider>
  )
}

export function useOrderDetails() {
  const context = useContext(OrderDetailsContext)
  if (!context) {
    throw new Error(
      'useOrderDetails must be used within an OrderDetailsProvider',
    )
  }
  return context
}

// Safe hook that returns null if context is not available
export function useOrderDetailsSafe() {
  const context = useContext(OrderDetailsContext)
  return context || null
}


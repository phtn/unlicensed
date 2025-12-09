'use client'

import type {Doc} from '@/convex/_generated/dataModel'
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from 'react'

type Product = Doc<'products'>

interface ProductDetailsContextType {
  selectedProduct: Product | null
  setSelectedProduct: (product: Product | null) => void
  clearSelectedProduct: () => void
}

const ProductDetailsContext = createContext<ProductDetailsContextType | null>(
  null,
)

export function ProductDetailsProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [selectedProduct, setSelectedProductState] = useState<Product | null>(
    null,
  )

  const setSelectedProduct = useCallback((product: Product | null) => {
    setSelectedProductState(product)
  }, [])

  const clearSelectedProduct = useCallback(() => {
    setSelectedProductState(null)
  }, [])

  const value = useMemo(
    () => ({
      selectedProduct,
      setSelectedProduct,
      clearSelectedProduct,
    }),
    [selectedProduct, setSelectedProduct, clearSelectedProduct],
  )

  return (
    <ProductDetailsContext.Provider value={value}>
      {children}
    </ProductDetailsContext.Provider>
  )
}

export function useProductDetails() {
  const context = useContext(ProductDetailsContext)
  if (!context) {
    throw new Error(
      'useProductDetails must be used within a ProductDetailsProvider',
    )
  }
  return context
}

// Safe hook that returns null if context is not available
export function useProductDetailsSafe() {
  const context = useContext(ProductDetailsContext)
  return context || null
}








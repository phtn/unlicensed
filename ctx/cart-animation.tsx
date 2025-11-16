'use client'

import {createContext, useContext, useState, useCallback, type ReactNode} from 'react'

interface CartAnimationState {
  isAnimating: boolean
  productImage: string | null
  startPosition: {x: number; y: number} | null
}

interface CartAnimationContextValue {
  animationState: CartAnimationState
  triggerAnimation: (
    productImage: string,
    startPosition: {x: number; y: number},
  ) => void
  clearAnimation: () => void
}

const CartAnimationContext = createContext<
  CartAnimationContextValue | undefined
>(undefined)

export const CartAnimationProvider = ({children}: {children: ReactNode}) => {
  const [animationState, setAnimationState] = useState<CartAnimationState>({
    isAnimating: false,
    productImage: null,
    startPosition: null,
  })

  const triggerAnimation = useCallback(
    (productImage: string, startPosition: {x: number; y: number}) => {
      setAnimationState({
        isAnimating: true,
        productImage,
        startPosition,
      })
    },
    [],
  )

  const clearAnimation = useCallback(() => {
    setAnimationState({
      isAnimating: false,
      productImage: null,
      startPosition: null,
    })
  }, [])

  return (
    <CartAnimationContext.Provider
      value={{animationState, triggerAnimation, clearAnimation}}>
      {children}
    </CartAnimationContext.Provider>
  )
}

export const useCartAnimation = () => {
  const context = useContext(CartAnimationContext)
  if (!context) {
    throw new Error('useCartAnimation must be used within CartAnimationProvider')
  }
  return context
}







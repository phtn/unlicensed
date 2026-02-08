import {useEffect} from 'react'
import {CartPageItem} from '../types'

interface UseCartDebugLogParams {
  cart: unknown
  cartItems: CartPageItem[]
  serverCartItems: CartPageItem[]
  isLoading: boolean
  isAuthenticated: boolean
  rawCartDebug: unknown
}

export function useCartDebugLog({
  cart,
  cartItems,
  serverCartItems,
  isLoading,
  isAuthenticated,
  rawCartDebug,
}: UseCartDebugLogParams) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      return
    }

    console.log('[Cart Page] Cart Debug:', {
      cart,
      cartItems: cartItems.length,
      serverCartItems: serverCartItems.length,
      optimisticCartItems: cartItems.length,
      isLoading,
      isAuthenticated,
      cartItemsDetail: cartItems,
      serverCartItemsDetail: serverCartItems,
      rawCart: cart,
      rawCartDebug,
    })
  }, [
    cart,
    cartItems,
    serverCartItems,
    isLoading,
    isAuthenticated,
    rawCartDebug,
  ])
}

import {Id} from '@/convex/_generated/dataModel'

export const LOCAL_STORAGE_CART_HISTORY_KEY = 'hyfe_cart_history'
export const LOCAL_STORAGE_CART_HISTORY_UPDATED_EVENT = 'hyfe_cart_history_updated'
export const MAX_HISTORY_ITEMS = 10

export type CartHistoryItem = {
  productId: Id<'products'>
  denomination?: number
  addedAt: number
}

/**
 * Get cart history items from local storage
 */
export const getCartHistoryItems = (): CartHistoryItem[] => {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_CART_HISTORY_KEY)
    if (!stored) return []
    const items = JSON.parse(stored) as CartHistoryItem[]
    // Validate items structure and sort by most recent
    return items
      .filter(
        (item) =>
          item.productId &&
          typeof item.addedAt === 'number',
      )
      .sort((a, b) => b.addedAt - a.addedAt)
  } catch (error) {
    console.error('Failed to read cart history from local storage:', error)
    return []
  }
}

/**
 * Save cart history items to local storage
 */
export const setCartHistoryItems = (
  items: CartHistoryItem[],
): void => {
  if (typeof window === 'undefined') return
  try {
    // Keep only the most recent MAX_HISTORY_ITEMS
    const trimmedItems = items.slice(0, MAX_HISTORY_ITEMS)
    localStorage.setItem(LOCAL_STORAGE_CART_HISTORY_KEY, JSON.stringify(trimmedItems))
    // Notify other React trees in the same tab (e.g. parallel routes) to sync.
    window.dispatchEvent(
      new CustomEvent<CartHistoryItem[]>(LOCAL_STORAGE_CART_HISTORY_UPDATED_EVENT, {
        detail: trimmedItems,
      }),
    )
  } catch (error) {
    console.error('Failed to save cart history to local storage:', error)
  }
}

/**
 * Add item to cart history
 */
export const addToCartHistory = (
  productId: Id<'products'>,
  denomination?: number,
): CartHistoryItem[] => {
  const items = getCartHistoryItems()
  
  // Remove existing entry for the same product/denomination to avoid duplicates
  const filteredItems = items.filter(
    (item) =>
      !(item.productId === productId && item.denomination === denomination),
  )
  
  // Add new item at the beginning
  const newItems: CartHistoryItem[] = [
    {
      productId,
      denomination,
      addedAt: Date.now(),
    },
    ...filteredItems,
  ].slice(0, MAX_HISTORY_ITEMS)
  
  setCartHistoryItems(newItems)
  return newItems
}

/**
 * Remove item from cart history
 */
export const removeFromCartHistory = (
  productId: Id<'products'>,
  denomination?: number,
): CartHistoryItem[] => {
  const items = getCartHistoryItems()
  const newItems = items.filter(
    (item) =>
      !(item.productId === productId && item.denomination === denomination),
  )
  setCartHistoryItems(newItems)
  return newItems
}

/**
 * Clear cart history
 */
export const clearCartHistory = (): void => {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(LOCAL_STORAGE_CART_HISTORY_KEY)
    window.dispatchEvent(
      new CustomEvent<CartHistoryItem[]>(LOCAL_STORAGE_CART_HISTORY_UPDATED_EVENT, {
        detail: [],
      }),
    )
  } catch (error) {
    console.error('Failed to clear cart history from local storage:', error)
  }
}

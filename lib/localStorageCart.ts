import {Id} from '@/convex/_generated/dataModel'
import {type ProductCartItem, CartItemType} from '@/convex/cart/d'

const VERSION = 'v1'
export const LOCAL_STORAGE_CART_KEY = `hyfe_cart_items:${VERSION}`
export const LOCAL_STORAGE_CART_UPDATED_EVENT = 'hyfe_cart_updated'

export type LocalStorageCartItem = ProductCartItem

/**
 * Get cart items from local storage (product items only; bundles not supported for guests)
 */
export const getLocalStorageCartItems = (): LocalStorageCartItem[] => {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_CART_KEY)
    if (!stored) return []
    const items = JSON.parse(stored) as CartItemType[]
    return items.filter(
      (item): item is ProductCartItem =>
        'productId' in item &&
        !('bundleType' in item) &&
        typeof item.quantity === 'number' &&
        item.quantity > 0,
    )
  } catch (error) {
    console.error('Failed to read cart from local storage:', error)
    return []
  }
}

/**
 * Save cart items to local storage
 */
export const setLocalStorageCartItems = (
  items: LocalStorageCartItem[],
): void => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(LOCAL_STORAGE_CART_KEY, JSON.stringify(items))
    // Notify other React trees in the same tab (e.g. parallel routes) to sync.
    window.dispatchEvent(
      new CustomEvent<LocalStorageCartItem[]>(LOCAL_STORAGE_CART_UPDATED_EVENT, {
        detail: items,
      }),
    )
  } catch (error) {
    console.error('Failed to save cart to local storage:', error)
  }
}

/**
 * Add item to local storage cart
 */
export const addToLocalStorageCart = (
  productId: Id<'products'>,
  quantity: number = 1,
  denomination?: number,
): LocalStorageCartItem[] => {
  const items = getLocalStorageCartItems()
  const existingIndex = items.findIndex(
    (item) =>
      item.productId === productId &&
      item.denomination === denomination,
  )

  if (existingIndex >= 0) {
    // Update quantity
    const newItems = [...items]
    newItems[existingIndex] = {
      ...newItems[existingIndex],
      quantity: newItems[existingIndex].quantity + quantity,
    }
    setLocalStorageCartItems(newItems)
    return newItems
  } else {
    const newItems: LocalStorageCartItem[] = [
      ...items,
      {
        productId,
        quantity,
        denomination,
      },
    ]
    setLocalStorageCartItems(newItems)
    return newItems
  }
}

/**
 * Update item quantity in local storage cart
 */
export const updateLocalStorageCartItem = (
  productId: Id<'products'>,
  quantity: number,
  denomination?: number,
): LocalStorageCartItem[] => {
  const items = getLocalStorageCartItems()
  const existingIndex = items.findIndex(
    (item) =>
      item.productId === productId &&
      item.denomination === denomination,
  )

  if (existingIndex >= 0) {
    if (quantity <= 0) {
      // Remove item
      const newItems = items.filter((_, i) => i !== existingIndex)
      setLocalStorageCartItems(newItems)
      return newItems
    } else {
      // Update quantity
      const newItems = [...items]
      newItems[existingIndex] = {
        ...newItems[existingIndex],
        quantity,
      }
      setLocalStorageCartItems(newItems)
      return newItems
    }
  }
  return items
}

/**
 * Remove item from local storage cart
 */
export const removeFromLocalStorageCart = (
  productId: Id<'products'>,
  denomination?: number,
): LocalStorageCartItem[] => {
  const items = getLocalStorageCartItems()
  const newItems = items.filter(
    (item) =>
      !(item.productId === productId && item.denomination === denomination),
  )
  setLocalStorageCartItems(newItems)
  return newItems
}

/**
 * Clear local storage cart
 */
export const clearLocalStorageCart = (): void => {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(LOCAL_STORAGE_CART_KEY)
    window.dispatchEvent(
      new CustomEvent<LocalStorageCartItem[]>(LOCAL_STORAGE_CART_UPDATED_EVENT, {
        detail: [],
      }),
    )
  } catch (error) {
    console.error('Failed to clear cart from local storage:', error)
  }
}

/**
 * Get total item count from local storage cart
 */
export const getLocalStorageCartItemCount = (): number => {
  const items = getLocalStorageCartItems()
  return items.reduce((total, item) => total + item.quantity, 0)
}


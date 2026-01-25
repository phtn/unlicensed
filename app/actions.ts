'use server'

import {Id} from '@/convex/_generated/dataModel'
import {CartItemType} from '@/convex/cart/d'
import {cookies} from 'next/headers'

interface CookieOptions {
  path?: string
  httpOnly: boolean
  sameSite: boolean | 'lax' | 'strict' | 'none'
  secure: boolean
  maxAge?: number
}

type CookieType = 'rfac' | 'guestCart'
export type ValuesMap = {rfac: string; guestCart: CartItemType[]}

interface Expiry {
  expires?: Date
}

const cookieNameMap: Record<CookieType, string> = {
  rfac: 'rf-ac',
  guestCart: 'hyfe_guest_cart',
}
const defaults: CookieOptions = {
  path: '/',
  httpOnly: false,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 60 * 60 * 24 * 30, // 30 days
}

const cookieExpiryMap: Partial<Record<CookieType, number>> = {
  // sevenDays: 60 * 60 * 24 * 7, // 7 days
  // thirtyDays: 60 * 60 * 24 * 30, // 30 days
  rfac: 60 * 60 * 24 * 365, // 1 year
  guestCart: 60 * 60 * 24 * 30, // 30 days
}
/**
 * @name setCookie
 * @param CookieType
 * @param valuesMap
 * @param CookieOptions
 */
export const setCookie = async <T extends CookieType>(
  type: T,
  values: ValuesMap[T],
  options?: Partial<CookieOptions & Expiry>,
) => {
  const name = cookieNameMap[type]
  const store = await cookies()
  const value = JSON.stringify(values)
  const maxAge = options?.maxAge ?? cookieExpiryMap[type] ?? defaults.maxAge
  store.set(name, value, {...defaults, maxAge, ...options})
}

export const getCookie = async <T extends CookieType>(
  type: T,
): Promise<ValuesMap[T] | undefined> => {
  const name = cookieNameMap[type]
  const store = await cookies()
  const cookie = store.get(name)

  if (!cookie?.value) return undefined

  try {
    return JSON.parse(cookie.value) as ValuesMap[T]
  } catch {
    // fallback if the value was stored without JSON
    return cookie.value as unknown as ValuesMap[T]
  }
}

export const deleteCookie = async (type: CookieType) => {
  const name = cookieNameMap[type]
  const store = await cookies()
  store.delete(name)
}

// Guest Cart Server Actions

/**
 * Get guest cart items from cookie
 */
export const getGuestCartItems = async (): Promise<CartItemType[]> => {
  const items = await getCookie('guestCart')
  if (!items) return []
  // Validate items structure
  return items.filter(
    (item) =>
      item.productId &&
      typeof item.quantity === 'number' &&
      item.quantity > 0,
  )
}

/**
 * Add item to guest cart
 */
export const addGuestCartItem = async (
  productId: Id<'products'>,
  quantity: number = 1,
  denomination?: number,
): Promise<CartItemType[]> => {
  const items = await getGuestCartItems()
  const existingIndex = items.findIndex(
    (item) =>
      item.productId === productId &&
      item.denomination === denomination,
  )

  let newItems: CartItemType[]
  if (existingIndex >= 0) {
    // Update quantity
    newItems = [...items]
    newItems[existingIndex] = {
      ...newItems[existingIndex],
      quantity: newItems[existingIndex].quantity + quantity,
    }
  } else {
    // Add new item
    newItems = [
      ...items,
      {
        productId,
        quantity,
        denomination,
      },
    ]
  }

  await setCookie('guestCart', newItems)
  return newItems
}

/**
 * Update item quantity in guest cart
 */
export const updateGuestCartItem = async (
  productId: Id<'products'>,
  quantity: number,
  denomination?: number,
): Promise<CartItemType[]> => {
  const items = await getGuestCartItems()
  const existingIndex = items.findIndex(
    (item) =>
      item.productId === productId &&
      item.denomination === denomination,
  )

  if (existingIndex >= 0) {
    if (quantity <= 0) {
      // Remove item
      const newItems = items.filter((_, i) => i !== existingIndex)
      await setCookie('guestCart', newItems)
      return newItems
    } else {
      // Update quantity
      const newItems = [...items]
      newItems[existingIndex] = {
        ...newItems[existingIndex],
        quantity,
      }
      await setCookie('guestCart', newItems)
      return newItems
    }
  }
  return items
}

/**
 * Remove item from guest cart
 */
export const removeGuestCartItem = async (
  productId: Id<'products'>,
  denomination?: number,
): Promise<CartItemType[]> => {
  const items = await getGuestCartItems()
  const newItems = items.filter(
    (item) =>
      !(item.productId === productId && item.denomination === denomination),
  )
  await setCookie('guestCart', newItems)
  return newItems
}

/**
 * Clear guest cart
 */
export const clearGuestCart = async (): Promise<void> => {
  await deleteCookie('guestCart')
}

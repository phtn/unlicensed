import type {Id} from '@/convex/_generated/dataModel'
import {
  type CartItemType,
  isProductCartItem,
  type ProductCartItem,
} from '@/convex/cart/d'

type ProductQuantityItem = Pick<ProductCartItem, 'productId' | 'quantity'>

export const CART_PRODUCT_QUANTITIES_UPDATED_EVENT =
  'rapidfire_cart_product_quantities_updated'

export type CartProductQuantityUpdate = {
  productId: Id<'products'>
  quantity: number
}

export type CartProductQuantitiesUpdatedDetail = {
  replace?: boolean
  updates: CartProductQuantityUpdate[]
}

export const getProductQuantityFromProductItems = (
  items: ReadonlyArray<ProductQuantityItem>,
  productId?: Id<'products'>,
) => {
  if (!productId) {
    return 0
  }

  return items.reduce(
    (total, item) =>
      item.productId === productId ? total + item.quantity : total,
    0,
  )
}

export const getProductQuantityFromCartItems = (
  items: ReadonlyArray<CartItemType>,
  productId?: Id<'products'>,
) => {
  if (!productId) {
    return 0
  }

  return items.reduce((total, item) => {
    if (!isProductCartItem(item) || item.productId !== productId) {
      return total
    }

    return total + item.quantity
  }, 0)
}

export const getProductLineQuantityFromCartItems = (
  items: ReadonlyArray<CartItemType>,
  productId: Id<'products'>,
  denomination?: number,
) =>
  items.reduce((total, item) => {
    if (
      !isProductCartItem(item) ||
      item.productId !== productId ||
      item.denomination !== denomination
    ) {
      return total
    }

    return total + item.quantity
  }, 0)

export const buildCartProductQuantityUpdates = (
  items: ReadonlyArray<ProductQuantityItem>,
): CartProductQuantityUpdate[] => {
  const quantities = new Map<Id<'products'>, number>()

  for (const item of items) {
    quantities.set(
      item.productId,
      (quantities.get(item.productId) ?? 0) + item.quantity,
    )
  }

  return Array.from(quantities.entries()).map(([productId, quantity]) => ({
    productId,
    quantity,
  }))
}

export const dispatchCartProductQuantitiesUpdated = (
  detail: CartProductQuantitiesUpdatedDetail,
) => {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(
    new CustomEvent<CartProductQuantitiesUpdatedDetail>(
      CART_PRODUCT_QUANTITIES_UPDATED_EVENT,
      {
        detail,
      },
    ),
  )
}

export const dispatchCartProductQuantitiesSnapshot = (
  items: ReadonlyArray<ProductQuantityItem>,
) => {
  dispatchCartProductQuantitiesUpdated({
    replace: true,
    updates: buildCartProductQuantityUpdates(items),
  })
}

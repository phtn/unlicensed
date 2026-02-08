import {Id} from '@/convex/_generated/dataModel'
import {addToCartHistory} from '@/lib/localStorageCartHistory'
import {useCallback, useOptimistic} from 'react'
import {
  CartItemRemoveHandler,
  CartItemUpdateHandler,
  CartPageItem,
} from '../types'

type OptimisticAction =
  | {
      type: 'update'
      productId: Id<'products'>
      quantity: number
      denomination?: number
    }
  | {
      type: 'remove'
      productId: Id<'products'>
      denomination?: number
    }

interface UseOptimisticCartItemsParams {
  serverCartItems: CartPageItem[]
  onUpdateItem: CartItemUpdateHandler
  onRemoveItem: CartItemRemoveHandler
  onClearCart: () => Promise<void>
}

export function useOptimisticCartItems({
  serverCartItems,
  onUpdateItem,
  onRemoveItem,
  onClearCart,
}: UseOptimisticCartItemsParams) {
  const [cartItems, setOptimisticCartItems] = useOptimistic(
    serverCartItems,
    (currentItems, action: OptimisticAction) => {
      switch (action.type) {
        case 'update': {
          return currentItems.map((item) =>
            item.product._id === action.productId &&
            (item.denomination ?? undefined) ===
              (action.denomination ?? undefined)
              ? {...item, quantity: action.quantity}
              : item,
          )
        }
        case 'remove': {
          return currentItems.filter(
            (item) =>
              !(
                item.product._id === action.productId &&
                (item.denomination ?? undefined) ===
                  (action.denomination ?? undefined)
              ),
          )
        }
        default:
          return currentItems
      }
    },
  )

  const updateItem = useCallback(
    async (
      productId: Id<'products'>,
      quantity: number,
      denomination?: number,
    ) => {
      setOptimisticCartItems({
        type: 'update',
        productId,
        quantity,
        denomination,
      })
      await onUpdateItem(productId, quantity, denomination)
    },
    [onUpdateItem, setOptimisticCartItems],
  )

  const removeItem = useCallback(
    async (productId: Id<'products'>, denomination?: number) => {
      setOptimisticCartItems({
        type: 'remove',
        productId,
        denomination,
      })
      await onRemoveItem(productId, denomination)
    },
    [onRemoveItem, setOptimisticCartItems],
  )

  const clearCartWithHistory = useCallback(async () => {
    cartItems.forEach((item) => {
      addToCartHistory(item.product._id, item.denomination)
    })
    await onClearCart()
  }, [cartItems, onClearCart])

  return {
    cartItems,
    updateItem,
    removeItem,
    clearCartWithHistory,
  }
}

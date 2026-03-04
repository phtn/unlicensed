import {Id} from '@/convex/_generated/dataModel'
import {ProductType} from '@/convex/products/d'

export type CartPageItem = {
  product: ProductType & {
    _id: Id<'products'>
    _creationTime?: number
  }
  quantity: number
  denomination?: number
  /** Set when this row is a line from a bundle; used for remove (remove whole bundle). */
  bundleCartItemIndex?: number
  /** Index of this line within the bundle; used with bundleCartItemIndex for optimistic remove. */
  bundleLineIndex?: number
  /** When set (bundle lines), use this for subtotal instead of unit price × quantity (bundle discount). */
  lineTotalCents?: number
}

export type CartItemUpdateHandler = (
  productId: Id<'products'>,
  quantity: number,
  denomination?: number,
) => Promise<void>

export type CartItemRemoveHandler = (
  productId: Id<'products'>,
  denomination?: number,
  bundleCartItemIndex?: number,
  bundleLineIndex?: number,
) => Promise<void>

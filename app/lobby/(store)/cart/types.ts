import {Id} from '@/convex/_generated/dataModel'
import {ProductType} from '@/convex/products/d'

export type CartPageItem = {
  product: ProductType & {
    _id: Id<'products'>
    _creationTime?: number
  }
  quantity: number
  denomination?: number
}

export type CartItemUpdateHandler = (
  productId: Id<'products'>,
  quantity: number,
  denomination?: number,
) => Promise<void>

export type CartItemRemoveHandler = (
  productId: Id<'products'>,
  denomination?: number,
) => Promise<void>

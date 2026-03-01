import type {Id} from '../_generated/dataModel'
import {Infer, v} from 'convex/values'

/** Single product line (non-bundle) */
export const productCartItemSchema = v.object({
  productId: v.id('products'),
  quantity: v.number(),
  denomination: v.optional(v.number()),
})

/** Item within a bundle */
export const bundleLineItemSchema = v.object({
  productId: v.id('products'),
  quantity: v.number(),
  denomination: v.number(),
})

/** Bundle as a single cart item */
export const bundleCartItemSchema = v.object({
  bundleType: v.string(),
  variationIndex: v.number(),
  bundleItems: v.array(bundleLineItemSchema),
})

export const cartItemSchema = v.union(
  productCartItemSchema,
  bundleCartItemSchema,
)

export const cartSchema = v.object({
  userId: v.union(v.id('users'), v.null()),
  items: v.array(cartItemSchema),
  updatedAt: v.number(),
})

export type ProductCartItem = Infer<typeof productCartItemSchema>
export type BundleCartItem = Infer<typeof bundleCartItemSchema>
export type CartItemType = Infer<typeof cartItemSchema>
export type CartType = Infer<typeof cartSchema>

export function isProductCartItem(
  item: CartItemType,
): item is ProductCartItem {
  return 'productId' in item && !('bundleType' in item)
}

export function isBundleCartItem(item: CartItemType): item is BundleCartItem {
  return 'bundleType' in item && 'bundleItems' in item
}

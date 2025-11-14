import {Infer, v} from 'convex/values'

export const cartItemSchema = v.object({
  productId: v.id('products'),
  quantity: v.number(),
  denomination: v.optional(v.number()),
})

export const cartSchema = v.object({
  userId: v.union(v.id('users'), v.null()),
  items: v.array(cartItemSchema),
  updatedAt: v.number(),
})

export type CartItemType = Infer<typeof cartItemSchema>
export type CartType = Infer<typeof cartSchema>

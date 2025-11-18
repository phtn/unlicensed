import {Infer, v} from 'convex/values'

// Activity type enum
export const activityTypeSchema = v.union(
  v.literal('user_signup'),
  v.literal('user_login'),
  v.literal('order_created'),
  v.literal('order_confirmed'),
  v.literal('order_processing'),
  v.literal('order_shipped'),
  v.literal('order_delivered'),
  v.literal('order_cancelled'),
  v.literal('order_refunded'),
  v.literal('payment_pending'),
  v.literal('payment_processing'),
  v.literal('payment_completed'),
  v.literal('payment_failed'),
  v.literal('payment_refunded'),
  v.literal('product_created'),
  v.literal('product_updated'),
  v.literal('category_created'),
  v.literal('category_updated'),
  v.literal('cart_item_added'),
  v.literal('cart_item_removed'),
  v.literal('cart_cleared'),
)

// Activity metadata schema - flexible object for type-specific data
export const activityMetadataSchema = v.object({
  // Order-related metadata
  orderId: v.optional(v.id('orders')),
  orderNumber: v.optional(v.string()),
  orderTotalCents: v.optional(v.number()),
  orderStatus: v.optional(v.string()),

  // Payment-related metadata
  paymentMethod: v.optional(v.string()),
  paymentStatus: v.optional(v.string()),
  paymentAmountCents: v.optional(v.number()),
  transactionId: v.optional(v.string()),

  // Product-related metadata
  productId: v.optional(v.id('products')),
  productName: v.optional(v.string()),
  productSlug: v.optional(v.string()),

  // Category-related metadata
  categoryId: v.optional(v.id('categories')),
  categoryName: v.optional(v.string()),
  categorySlug: v.optional(v.string()),

  // Cart-related metadata
  cartId: v.optional(v.id('carts')),
  itemCount: v.optional(v.number()),
  cartTotalCents: v.optional(v.number()),

  // User-related metadata
  userName: v.optional(v.string()),
  userEmail: v.optional(v.string()),

  // Shipping-related metadata
  shippingMethod: v.optional(v.string()),
  trackingNumber: v.optional(v.string()),
  carrier: v.optional(v.string()),

  // General metadata
  reason: v.optional(v.string()),
  notes: v.optional(v.string()),
  previousValue: v.optional(v.string()),
  newValue: v.optional(v.string()),
})

// Activity schema
export const activitySchema = v.object({
  // Activity identification
  type: activityTypeSchema,
  title: v.string(), // Human-readable title
  description: v.optional(v.string()), // Optional detailed description

  // Related entities
  userId: v.optional(v.union(v.id('users'), v.null())), // null for system/admin actions
  orderId: v.optional(v.id('orders')),
  productId: v.optional(v.id('products')),
  categoryId: v.optional(v.id('categories')),

  // Metadata for flexible storage of type-specific data
  metadata: v.optional(activityMetadataSchema),

  // Timestamps
  createdAt: v.number(),
})

export type ActivityType = Infer<typeof activityTypeSchema>
export type Activity = Infer<typeof activitySchema>
export type ActivityMetadata = Infer<typeof activityMetadataSchema>

import {Infer, v} from 'convex/values'
import {addressSchema} from '../users/d'

// Order item schema - captures product details at time of order
export const orderItemSchema = v.object({
  productId: v.id('products'),
  productName: v.string(), // Snapshot of product name at time of order
  productSlug: v.string(), // Snapshot of product slug at time of order
  productImage: v.string(), // Snapshot of product image at time of order
  quantity: v.number(),
  denomination: v.optional(v.number()),
  unitPriceCents: v.number(), // Price per unit at time of order
  totalPriceCents: v.number(), // Total price for this line item
})

export const paymentMethodSchema = v.union(
  v.literal('cards'),
  v.literal('crypto_transfer'),
  v.literal('crypto_commerce'),
  v.literal('cash_app'),
)

export type PaymentMethod = Infer<typeof paymentMethodSchema>

// Payment information schema
export const paymentSchema = v.object({
  method: paymentMethodSchema,
  status: v.union(
    v.literal('pending'),
    v.literal('processing'),
    v.literal('completed'),
    v.literal('failed'),
    v.literal('refunded'),
    v.literal('partially_refunded'),
  ),
  transactionId: v.optional(v.string()),
  paymentIntentId: v.optional(v.string()), // For Stripe or similar
  paidAt: v.optional(v.number()), // Timestamp when payment was completed
  refundedAt: v.optional(v.number()), // Timestamp when refund was issued
  refundAmountCents: v.optional(v.number()), // Amount refunded in cents
  gatewayId: v.optional(v.string()), // Gateway ID
  gateway: v.optional(
    v.object({
      name: v.string(),
      id: v.string(),
      provider: v.string(),
      status: v.string(),
      sessionId: v.optional(v.string()), // PayGate session ID
      paymentUrl: v.optional(v.string()), // PayGate payment URL for redirect
      transactionId: v.optional(v.string()), // PayGate transaction ID
      metadata: v.optional(v.record(v.string(), v.any())),
    }),
  ),
  // PayGate-specific fields
  // paygateSessionId: v.optional(v.string()), // PayGate session ID
  // paygatePaymentUrl: v.optional(v.string()), // PayGate payment URL for redirect
  // paygateTransactionId: v.optional(v.string()), // PayGate transaction ID
})

// Order status enum
export const orderStatusSchema = v.union(
  v.literal('pending_payment'), // Order placed, awaiting payment
  v.literal('order_processing'), // Order being processed
  v.literal('awaiting_courier_pickup'), // Awaiting courier pickup
  v.literal('shipping'), // Order is shipping
  v.literal('resend'), // Order needs to be resent
  v.literal('shipped'), // Order has been shipped
  v.literal('cancelled'), // Order was cancelled
)

export type OrderStatus = Infer<typeof orderStatusSchema>

// Shipping information schema
export const shippingSchema = v.object({
  method: v.optional(
    v.union(
      v.literal('standard'),
      v.literal('express'),
      v.literal('overnight'),
      v.literal('pickup'),
    ),
  ),
  carrier: v.optional(v.string()), // e.g., "USPS", "FedEx", "UPS"
  trackingNumber: v.optional(v.string()),
  estimatedDelivery: v.optional(v.number()), // Timestamp
  shippedAt: v.optional(v.number()), // Timestamp when order was shipped
  deliveredAt: v.optional(v.number()), // Timestamp when order was delivered
})

export const orderSchema = v.object({
  // User information
  userId: v.union(v.id('users'), v.null()), // null for guest orders

  // Order identification
  orderNumber: v.string(), // Human-readable order number (e.g., "ORD-2024-001234")
  uuid: v.optional(v.string()), // Unique identifier for the order
  orderStatus: orderStatusSchema,

  // Order items
  items: v.array(orderItemSchema),

  // Pricing breakdown (all in cents)
  subtotalCents: v.number(), // Sum of all item prices
  taxCents: v.number(), // Tax amount
  shippingCents: v.number(), // Shipping cost
  discountCents: v.optional(v.number()), // Discount/coupon amount
  totalCents: v.number(), // Final total

  // Addresses (can use address schema from users or store inline)
  shippingAddress: addressSchema,
  billingAddress: v.optional(addressSchema), // If different from shipping

  // Contact information at time of order
  contactEmail: v.string(),
  contactPhone: v.optional(v.string()),

  // Payment information
  payment: paymentSchema,

  // Shipping information
  shipping: v.optional(shippingSchema),

  // Additional notes
  customerNotes: v.optional(v.string()), // Notes from customer
  internalNotes: v.optional(v.string()), // Internal admin notes
  remarks: v.optional(v.string()), // Reps notes

  // Rewards points
  pointsEarned: v.optional(v.number()), // Points awarded for this order
  pointsMultiplier: v.optional(v.number()), // Multiplier used when awarding points

  // Timestamps
  createdAt: v.optional(v.number()),
  updatedAt: v.optional(v.number()),
  cancelledAt: v.optional(v.number()),
  courier: v.optional(v.id('couriers')),
})

export type OrderType = Infer<typeof orderSchema>
export type OrderItemType = Infer<typeof orderItemSchema>
export type PaymentType = Infer<typeof paymentSchema>
export type ShippingType = Infer<typeof shippingSchema>

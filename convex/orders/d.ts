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

// Payment information schema
export const paymentSchema = v.object({
  method: v.union(
    v.literal('credit_card'),
    v.literal('debit_card'),
    v.literal('paypal'),
    v.literal('apple_pay'),
    v.literal('google_pay'),
    v.literal('bank_transfer'),
    v.literal('cash'),
    v.literal('other'),
  ),
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
})

// Order status enum
export const orderStatusSchema = v.union(
  v.literal('pending'), // Order placed, awaiting payment
  v.literal('confirmed'), // Payment confirmed, order being processed
  v.literal('processing'), // Order being prepared
  v.literal('shipped'), // Order has been shipped
  v.literal('delivered'), // Order has been delivered
  v.literal('cancelled'), // Order was cancelled
  v.literal('refunded'), // Order was refunded
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

  // Timestamps
  createdAt: v.number(),
  updatedAt: v.number(),
  cancelledAt: v.optional(v.number()),
})

export type OrderType = Infer<typeof orderSchema>
export type OrderItemType = Infer<typeof orderItemSchema>
export type PaymentType = Infer<typeof paymentSchema>
export type ShippingType = Infer<typeof shippingSchema>


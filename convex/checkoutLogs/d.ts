import {Infer, v} from 'convex/values'

// Checkout status enum
export const checkoutStatusSchema = v.union(
  v.literal('initiated'), // Checkout process started
  v.literal('cart_validated'), // Cart validated successfully
  v.literal('address_collected'), // Shipping address collected
  v.literal('payment_initiated'), // Payment process started
  v.literal('payment_processing'), // Payment being processed
  v.literal('payment_completed'), // Payment completed successfully
  v.literal('order_created'), // Order created successfully
  v.literal('failed'), // Checkout failed
  v.literal('cancelled'), // Checkout cancelled by user
  v.literal('timeout'), // Checkout timed out
)

// Error type enum
export const checkoutErrorTypeSchema = v.union(
  v.literal('validation_error'), // Cart/address validation failed
  v.literal('payment_error'), // Payment processing failed
  v.literal('inventory_error'), // Product out of stock
  v.literal('network_error'), // Network/API error
  v.literal('server_error'), // Server-side error
  v.literal('unknown_error'), // Unknown error
)

// Checkout log schema
export const checkoutLogSchema = v.object({
  // Order information (optional - may not exist if checkout fails)
  orderId: v.optional(v.union(v.id('orders'), v.null())), // Order ID if order was created
  orderNumber: v.optional(v.string()), // Order number if order was created

  // Checkout status
  status: checkoutStatusSchema,

  // User information
  userId: v.optional(v.union(v.id('users'), v.null())), // User ID if authenticated
  sessionId: v.optional(v.string()), // Session identifier for tracking checkout flow

  // Error information (if status is 'failed')
  error: v.optional(v.string()), // Human-readable error message
  errorType: v.optional(checkoutErrorTypeSchema), // Categorized error type
  errorDetails: v.optional(v.record(v.string(), v.any())), // Structured error details

  // Payment information
  paymentMethod: v.optional(
    v.union(
      v.literal('credit_card'),
      v.literal('crypto'),
      v.literal('cashapp'),
    ),
  ),
  paymentIntentId: v.optional(v.string()), // Payment intent ID (Stripe, PayGate, etc.)
  paygateSessionId: v.optional(v.string()), // PayGate session ID if applicable
  transactionId: v.optional(v.string()), // Transaction ID if payment succeeded

  // Cart snapshot (at time of checkout attempt)
  cartSnapshot: v.optional(
    v.object({
      itemCount: v.number(),
      totalCents: v.number(),
      items: v.optional(
        v.array(
          v.object({
            productId: v.id('products'),
            productName: v.string(),
            quantity: v.number(),
            unitPriceCents: v.number(),
          }),
        ),
      ),
    }),
  ),

  // Network and device information
  ipAddress: v.optional(v.string()), // Client IP address
  userAgent: v.optional(v.string()), // User agent string

  // Additional metadata
  metadata: v.optional(v.record(v.string(), v.any())), // Flexible metadata object

  // Timestamps
  createdAt: v.number(), // Timestamp when log was created
  updatedAt: v.optional(v.number()), // Timestamp when log was last updated
})

export type CheckoutStatus = Infer<typeof checkoutStatusSchema>
export type CheckoutErrorType = Infer<typeof checkoutErrorTypeSchema>
export type CheckoutLog = Infer<typeof checkoutLogSchema>

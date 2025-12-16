/**
 * PayGate API Types
 */

export type PaymentMethod = 'credit_card' | 'crypto'

export interface PayGatePaymentRequest {
  amount: number // Amount in USD (e.g., 10.50 for $10.50)
  currency?: string // Default: 'USD'
  orderId: string // Your order ID
  email?: string // Customer email
  phone?: string // Customer phone
  name?: string // Customer name
  returnUrl: string // URL to redirect after payment
  cancelUrl?: string // URL to redirect if payment cancelled
  webhookUrl?: string // URL for webhook callbacks
  paymentMethod?: PaymentMethod // 'credit_card' or 'crypto'
  affiliate?: string // Optional affiliate wallet address
}

export interface PayGatePaymentResponse {
  success: boolean
  paymentUrl?: string // URL to redirect customer for payment
  sessionId?: string // PayGate session ID
  transactionId?: string // Transaction ID (may be null initially)
  error?: string // Error message if failed
}

export interface PayGatePaymentStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  transactionId?: string
  amount?: number
  currency?: string
  paidAt?: number // Timestamp
}

export interface PayGateCryptoInfo {
  ticker: string
  name: string
  network: string
  address: string
  amount: number
  qrCode?: string
}

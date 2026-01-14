/**
 * Cash App Pay API Types
 * 
 * Cash App Pay is powered by Square's payment infrastructure.
 * This integration uses Square's Web Payments SDK and Payments API.
 */

export interface CashAppPaymentRequest {
  orderId: string
  amountCents: number // Amount in cents
  currency?: string // Default: 'USD'
  email?: string
  phone?: string
  returnUrl: string
  cancelUrl?: string
}

export interface CashAppPaymentResponse {
  success: boolean
  paymentUrl?: string // URL for desktop QR code or mobile redirect
  qrCode?: string // QR code data URL for desktop
  paymentId?: string // Square payment ID
  error?: string
}

export interface CashAppPaymentStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  paymentId?: string
  transactionId?: string
  paidAt?: number // Timestamp
}

export interface SquareConfig {
  applicationId: string // Square Application ID
  locationId?: string // Square Location ID (optional)
  accessToken?: string // Server-side access token (for backend)
  environment?: 'sandbox' | 'production'
}

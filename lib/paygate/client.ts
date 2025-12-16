/**
 * PayGate API Client
 * 
 * PayGate.to API integration for credit card and cryptocurrency payments.
 * No API keys required - just configure your USDC Polygon wallet address.
 */

import {paygateConfig, paygatePublicConfig} from './config'
import type {
  PayGatePaymentRequest,
  PayGatePaymentResponse,
  PayGatePaymentStatus,
  PayGateCryptoInfo,
} from './types'

export class PayGateClient {
  private apiUrl: string
  private checkoutUrl: string
  private usdcWallet: string

  constructor(config?: {
    apiUrl?: string
    checkoutUrl?: string
    usdcWallet?: string
  }) {
    this.apiUrl = config?.apiUrl || paygateConfig.apiUrl
    this.checkoutUrl = config?.checkoutUrl || paygateConfig.checkoutUrl
    this.usdcWallet = config?.usdcWallet || paygateConfig.usdcWallet
  }

  /**
   * Create a payment session
   * 
   * For credit card payments, this returns a hosted checkout URL.
   * For crypto payments, this returns payment details including wallet address.
   */
  async createPayment(
    request: PayGatePaymentRequest,
  ): Promise<PayGatePaymentResponse> {
    try {
      // Build request parameters
      const params = new URLSearchParams({
        amount: request.amount.toString(),
        currency: request.currency || 'USD',
        order_id: request.orderId,
        return_url: request.returnUrl,
        ...(request.cancelUrl && {cancel_url: request.cancelUrl}),
        ...(request.webhookUrl && {webhook_url: request.webhookUrl}),
        ...(request.email && {email: request.email}),
        ...(request.phone && {phone: request.phone}),
        ...(request.name && {name: request.name}),
        ...(request.paymentMethod && {payment_method: request.paymentMethod}),
        ...(request.affiliate && {affiliate: request.affiliate}),
        ...(this.usdcWallet && {wallet: this.usdcWallet}),
      })

      // PayGate uses different endpoints for credit card vs crypto
      const endpoint =
        request.paymentMethod === 'crypto'
          ? `${this.apiUrl}/crypto/create.php`
          : `${this.apiUrl}/create.php`

      const response = await fetch(`${endpoint}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        return {
          success: false,
          error: `PayGate API error: ${response.status} ${errorText}`,
        }
      }

      const data = await response.json()

      // Handle different response formats
      if (data.success === false || data.error) {
        return {
          success: false,
          error: data.error || 'Unknown error',
        }
      }

      // For credit card payments, return checkout URL
      if (request.paymentMethod === 'credit_card' || !request.paymentMethod) {
        return {
          success: true,
          paymentUrl: data.payment_url || data.checkout_url || `${this.checkoutUrl}?session=${data.session_id}`,
          sessionId: data.session_id || data.sessionId,
          transactionId: data.transaction_id || data.transactionId,
        }
      }

      // For crypto payments, return payment details
      return {
        success: true,
        paymentUrl: data.payment_url || data.qr_code || '',
        sessionId: data.session_id || data.sessionId,
        transactionId: data.transaction_id || data.transactionId,
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create payment session',
      }
    }
  }

  /**
   * Check payment status
   */
  async checkPaymentStatus(
    sessionId: string,
  ): Promise<PayGatePaymentStatus | null> {
    try {
      const response = await fetch(
        `${this.apiUrl}/status.php?session_id=${sessionId}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        },
      )

      if (!response.ok) {
        return null
      }

      const data = await response.json()

      return {
        status: data.status || 'pending',
        transactionId: data.transaction_id || data.transactionId,
        amount: data.amount,
        currency: data.currency || 'USD',
        paidAt: data.paid_at || data.paidAt,
      }
    } catch (error) {
      console.error('PayGate status check error:', error)
      return null
    }
  }

  /**
   * Get crypto payment information
   * 
   * Returns wallet address and QR code for crypto payments
   */
  async getCryptoPaymentInfo(
    ticker: string,
    amount: number,
    orderId: string,
  ): Promise<PayGateCryptoInfo | null> {
    try {
      const params = new URLSearchParams({
        amount: amount.toString(),
        order_id: orderId,
        ...(this.usdcWallet && {wallet: this.usdcWallet}),
      })

      // PayGate crypto endpoint format: /crypto/{ticker}/info.php
      const endpoint = `${this.apiUrl}/crypto/${ticker.toLowerCase()}/info.php`
      const response = await fetch(`${endpoint}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        return null
      }

      const data = await response.json()

      return {
        ticker: ticker.toUpperCase(),
        name: data.name || ticker,
        network: data.network || '',
        address: data.address || '',
        amount: data.amount || amount,
        qrCode: data.qr_code || data.qrCode,
      }
    } catch (error) {
      console.error('PayGate crypto info error:', error)
      return null
    }
  }

  /**
   * Get supported cryptocurrencies
   */
  async getSupportedCryptos(): Promise<string[]> {
    try {
      const response = await fetch(`${this.apiUrl}/crypto/info.php`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        return ['BTC', 'ETH', 'USDC', 'USDT'] // Default fallback
      }

      const data = await response.json()
      return data.supported || data.tickers || ['BTC', 'ETH', 'USDC', 'USDT']
    } catch (error) {
      console.error('PayGate crypto list error:', error)
      return ['BTC', 'ETH', 'USDC', 'USDT'] // Default fallback
    }
  }
}

// Export singleton instance
export const paygateClient = new PayGateClient()

// Export factory function for custom configuration
export function createPayGateClient(config?: {
  apiUrl?: string
  checkoutUrl?: string
  usdcWallet?: string
}): PayGateClient {
  return new PayGateClient(config)
}

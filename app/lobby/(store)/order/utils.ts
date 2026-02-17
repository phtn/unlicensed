import {PaymentMethod} from '@/convex/orders/d'

export const pmmap: Record<PaymentMethod, string> = {
  cards: 'Credit/Debit Card',
  crypto_commerce: 'Pay with Crypto',
  crypto_transfer: 'Send with Crypto',
  cash_app: 'Cash App',
}

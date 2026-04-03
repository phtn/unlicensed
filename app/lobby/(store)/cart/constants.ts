import type {PaymentMethod} from '@/convex/orders/d'
import {createParser, parseAsString} from 'nuqs'

export const paymentMethodOptions = [
  'cards',
  'crypto_transfer',
  'crypto_commerce',
  'cash_app',
] as const satisfies readonly PaymentMethod[]

const PAYMENT_METHOD_ALIASES: Record<string, PaymentMethod> = {
  cards: 'cards',
  card: 'cards',
  c: 'cards',
  credit_card: 'cards',
  'credit-card': 'cards',
  debit_card: 'cards',
  'debit-card': 'cards',
  apple_pay: 'cards',
  'apple-pay': 'cards',
  google_pay: 'cards',
  'google-pay': 'cards',
  crypto_transfer: 'crypto_transfer',
  'crypto-transfer': 'crypto_transfer',
  transfer: 'crypto_transfer',
  crypto_commerce: 'crypto_commerce',
  'crypto-commerce': 'crypto_commerce',
  crypto: 'crypto_commerce',
  commerce: 'crypto_commerce',
  cash_app: 'cash_app',
  'cash-app': 'cash_app',
  cashapp: 'cash_app',
}

export const normalizePaymentMethod = (
  value?: string | null,
): PaymentMethod | null => {
  if (!value) return null

  return PAYMENT_METHOD_ALIASES[value.trim().toLowerCase()] ?? null
}

export const checkoutModalParser = parseAsString.withDefault('')
export const paymentMethodParser = createParser<PaymentMethod>({
  parse: (value) => normalizePaymentMethod(value),
  serialize: (value) => normalizePaymentMethod(value) ?? 'cards',
})
  .withOptions({clearOnDefault: false})
  .withDefault('cards')

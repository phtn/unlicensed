import type {PaymentMethod} from '@/convex/orders/d'
import {parseAsString, parseAsStringEnum} from 'nuqs'

export const paymentMethodOptions = [
  'cards',
  'crypto_transfer',
  'crypto_commerce',
  'cash_app',
] as const satisfies readonly PaymentMethod[]

export const checkoutModalParser = parseAsString.withDefault('')
export const paymentMethodParser = parseAsStringEnum<PaymentMethod>(
  [...paymentMethodOptions],
).withDefault('cards')

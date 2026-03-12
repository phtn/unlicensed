import {Resend} from 'resend'

let client: Resend | null = null

/**
 * Prefer envs that match the current runtime, but keep supporting the legacy
 * RESEND_API_KEY name so existing deployments do not silently lose email send.
 */
function getResendApiKey(): string | undefined {
  const productionKey = process.env.RESEND_API_KEY_PROD?.trim()
  const testKey = process.env.RESEND_API_KEY_TEST?.trim()
  const legacyKey = process.env.RESEND_API_KEY?.trim()

  if (process.env.NODE_ENV === 'production') {
    return productionKey || legacyKey || testKey
  }

  return testKey || legacyKey || productionKey
}

export const createClient = (): Resend => {
  if (!client) {
    const apiKey = getResendApiKey()
    if (!apiKey?.trim()) {
      throw new Error(
        'Resend API key is not configured. Set RESEND_API_KEY_PROD, RESEND_API_KEY_TEST, or RESEND_API_KEY.',
      )
    }
    client = new Resend(apiKey.trim())
  }
  return client
}

export {renderTemplate, renderToHtml} from './render'
export {
  BulkValueEmail,
  FirstOrderEmail,
  InvitationEmail,
  NotificationEmail,
  OrderConfirmationEmail,
  PasswordResetEmail,
  PaymentSuccessEmail,
  ProductDiscountEmail,
  PromotionEmail,
  WelcomeEmail,
} from './templates'
export type {BulkValueEmailProps} from './templates/bulk-value'
export type {FirstOrderEmailProps} from './templates/first-order'
export type {InvitationEmailProps} from './templates/invitation'
export type {NotificationEmailProps} from './templates/notification'
export type {OrderConfirmationEmailProps} from './templates/order-confirmation'
export type {PasswordResetEmailProps} from './templates/password-reset'
export type {PaymentSuccessEmailProps} from './templates/payment-success'
export type {ProductDiscountEmailProps} from './templates/product-discount'
export type {PromotionEmailProps} from './templates/promotion'
export type {WelcomeEmailProps} from './templates/welcome'

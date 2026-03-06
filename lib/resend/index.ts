import {Resend} from 'resend'

let client: Resend | null = null

/** Use RESEND_API_KEY in production, RESEND_API_KEY_TEST in dev/test. */
function getResendApiKey(): string | undefined {
  return process.env.RESEND_API_KEY ?? process.env.RESEND_API_KEY_TEST
}

export const createClient = (): Resend => {
  if (!client) {
    const apiKey = getResendApiKey()
    if (!apiKey?.trim()) {
      throw new Error(
        'Resend API key is not configured. Set RESEND_API_KEY (production) or RESEND_API_KEY_TEST (dev).',
      )
    }
    client = new Resend(apiKey.trim())
  }
  return client
}

export {renderTemplate, renderToHtml} from './render'
export type {OrderConfirmationEmailProps} from './templates/order-confirmation'
export type {PaymentSuccessEmailProps} from './templates/payment-success'
export type {PasswordResetEmailProps} from './templates/password-reset'
export type {NotificationEmailProps} from './templates/notification'
export type {WelcomeEmailProps} from './templates/welcome'
export type {InvitationEmailProps} from './templates/invitation'
export type {PromotionEmailProps} from './templates/promotion'
export type {ProductDiscountEmailProps} from './templates/product-discount'
export type {FirstOrderEmailProps} from './templates/first-order'
export {
  OrderConfirmationEmail,
  PaymentSuccessEmail,
  PasswordResetEmail,
  NotificationEmail,
  WelcomeEmail,
  InvitationEmail,
  PromotionEmail,
  ProductDiscountEmail,
  FirstOrderEmail,
} from './templates'

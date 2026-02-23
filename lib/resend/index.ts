import {Resend} from 'resend'

let client: Resend | null = null

export const createClient = () => {
  if (!client) {
    client = new Resend(process.env.RESEND_API_KEY_TEST)
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
export {
  OrderConfirmationEmail,
  PaymentSuccessEmail,
  PasswordResetEmail,
  NotificationEmail,
  WelcomeEmail,
  InvitationEmail,
  PromotionEmail,
  ProductDiscountEmail,
} from './templates'

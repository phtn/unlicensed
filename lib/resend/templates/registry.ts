/**
 * Email template registry for the admin template picker.
 * Options only (no React components) so this file is safe to import on the client.
 */

export const EMAIL_TEMPLATE_OPTIONS = [
  {id: 'welcome', label: 'Welcome', defaultSubject: 'Welcome to Rapid Fire'},
  {
    id: 'password-reset',
    label: 'Password reset',
    defaultSubject: 'Reset your Rapid Fire password',
  },
  {
    id: 'order-confirmation',
    label: 'Order confirmation',
    defaultSubject: 'Order {{orderNumber}} confirmed',
  },
  {
    id: 'payment-success',
    label: 'Payment Success',
    defaultSubject: 'We received your payment!',
  },
  {
    id: 'notification',
    label: 'Notification',
    defaultSubject: '{{title}}',
  },
  {
    id: 'invitation',
    label: 'Invitation',
    defaultText: 'Rapid Fire',
    defaultSubject: "You're invited.",
  },
  {id: 'promotion', label: 'Promotion', defaultSubject: '{{headline}}'},
  {id: 'receipt', label: 'Receipt', defaultSubject: 'Your receipt.'},
  {
    id: 'product-discount',
    label: 'Product discount',
    defaultSubject: 'A discount just for you',
  },
  {
    id: 'bulk-value',
    label: 'Bulk value',
    defaultSubject: 'Bulk just makes sense',
  },
  {
    id: 'first-order',
    label: 'First order',
    defaultSubject: 'Claim $25 off your first order',
  },
] as const

export type EmailTemplateId = (typeof EMAIL_TEMPLATE_OPTIONS)[number]['id']

import {renderTemplate} from '@/lib/resend'
import type {ComponentType} from 'react'
import {InvitationEmail} from './invitation'
import {NotificationEmail} from './notification'
import {OrderConfirmationEmail} from './order-confirmation'
import {PasswordResetEmail} from './password-reset'
import {PaymentSuccessEmail} from './payment-success'
import {ProductDiscountEmail} from './product-discount'
import {PromotionEmail} from './promotion'
import {ReceiptEmail} from './receipt'
import {EMAIL_TEMPLATE_OPTIONS, type EmailTemplateId} from './registry'
import {WelcomeEmail} from './welcome'

type TemplateEntry = {
  Component: ComponentType<object>
  defaultProps: object
}

const TEMPLATE_MAP: Record<EmailTemplateId, TemplateEntry> = {
  welcome: {
    Component: WelcomeEmail as ComponentType<object>,
    defaultProps: {
      userName: '{{userName}}',
      loginUrl: '{{loginUrl}}',
      supportUrl: '{{supportUrl}}',
    },
  },
  'password-reset': {
    Component: PasswordResetEmail as ComponentType<object>,
    defaultProps: {
      userName: '{{userName}}',
      resetUrl: '{{resetUrl}}',
      expiresInMinutes: 60,
    },
  },
  'order-confirmation': {
    Component: OrderConfirmationEmail as ComponentType<object>,
    defaultProps: {
      customerName: '{{customerName}}',
      orderNumber: '{{orderNumber}}',
      summary: '{{summary}}',
      dashboardUrl: '{{dashboardUrl}}',
    },
  },
  'payment-success': {
    Component: PaymentSuccessEmail as ComponentType<object>,
    defaultProps: {
      customerName: '{{customerName}}',
      planLabel: '{{planLabel}}',
      orderNumber: '{{orderNumber}}',
      amount: 0,
      currency: 'USD',
      cardId: '{{cardId}}',
      dashboardUrl: '{{dashboardUrl}}',
    },
  },
  notification: {
    Component: NotificationEmail as ComponentType<object>,
    defaultProps: {
      userName: '{{userName}}',
      title: '{{title}}',
      message: '{{message}}',
      ctaLabel: '{{ctaLabel}}',
      ctaUrl: '{{ctaUrl}}',
    },
  },
  invitation: {
    Component: InvitationEmail as ComponentType<object>,
    defaultProps: {
      recipientName: 'Alice Love',
      inviterName: 'We',
      title: 'You are invited.',
      message: 'Enter the code below to access our shop:',
      ctaLabel: 'Shop Now',
      ctaUrl: 'https://rapidfirenow.com',
      accessCode: 'RF2026',
    },
  },
  promotion: {
    Component: PromotionEmail as ComponentType<object>,
    defaultProps: {
      recipientName: '{{recipientName}}',
      headline: '{{headline}}',
      subheadline: '{{subheadline}}',
      body: '{{body}}',
      ctaLabel: '{{ctaLabel}}',
      ctaUrl: '{{ctaUrl}}',
      imageUrl: '{{imageUrl}}',
      imageAlt: '{{imageAlt}}',
    },
  },
  receipt: {
    Component: ReceiptEmail as ComponentType<object>,
    defaultProps: {
      recipientName: '{{recipientName}}',
      headline: '{{headline}}',
      subheadline: '{{subheadline}}',
      body: '{{body}}',
      ctaLabel: '{{ctaLabel}}',
      ctaUrl: '{{ctaUrl}}',
      imageUrl: '{{imageUrl}}',
      imageAlt: '{{imageAlt}}',
      customerName: 'Alice Love',
      customerEmail: 'alice@love.com',
      orderNumber: 'NGC0-RF',
      invoiceDate: '10 Feb 2026',
      total: '$14.95',
      lineItems: [
        {
          id: 'peach-tree',
          name: 'Peach Tree',
          description: 'Flower',
          price: '$14.95',
          quantity: '1 oz x 1',
          total: '$14.95',
        },
      ],
    },
  },
  'product-discount': {
    Component: ProductDiscountEmail as ComponentType<object>,
    defaultProps: {
      recipientName: '{{recipientName}}',
      productName: '{{productName}}',
      productImageUrl: '{{productImageUrl}}',
      discountDescription: '{{discountDescription}}',
      discountCode: '{{discountCode}}',
      discountPercent: 10,
      validUntil: '{{validUntil}}',
      ctaLabel: '{{ctaLabel}}',
      ctaUrl: '{{ctaUrl}}',
    },
  },
}

const RENDER_TIMEOUT_MS = 12_000

export async function getTemplatePreview(
  id: string,
): Promise<{html: string; subject: string} | null> {
  const entry = TEMPLATE_MAP[id as EmailTemplateId]
  if (!entry) return null

  const option = EMAIL_TEMPLATE_OPTIONS.find((o) => o.id === id)
  const subject = option?.defaultSubject ?? ''

  const html = await Promise.race([
    renderTemplate(entry.Component, entry.defaultProps),
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error('Template render timed out')),
        RENDER_TIMEOUT_MS,
      ),
    ),
  ])

  return {html, subject}
}

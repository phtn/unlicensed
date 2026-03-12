import {renderTemplate} from '@/lib/resend'
import {formatDate} from '@/utils/date'
import type {ComponentType} from 'react'
import {BulkValueEmail} from './bulk-value'
import {FirstOrderEmail} from './first-order'
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
      customerName: 'there',
      orderDate: formatDate(Date.now()),
      orderNumber: '00ML-RF45-XX',
      amount: 250,
      currency: 'USD',
      paymentMethod: 'cards',
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
  'bulk-value': {
    Component: BulkValueEmail as ComponentType<object>,
    defaultProps: {
      notice: 'Free delivery on orders $99+.',
      noticeCtaLabel: 'SHOP BULK',
      noticeCtaUrl: 'https://rapidfirenow.com/lobby',
      headline: 'REORDERING?\nBULK JUST MAKES SENSE',
      subheadline: 'Same THCa. Better value.',
      ctaLabel: 'Shop Bulk',
      ctaUrl: 'https://rapidfirenow.com/lobby',
      introTitle: 'You already know what you like.',
      introBody:
        'Bulk lets you buy it smarter. Better value per gram, fewer checkouts, and the same menu you already trust.',
      reasonsHeadline: 'WHY RAPID FIRE SHOPPERS GO BULK',
      reasonsSubheadline:
        'Frequent buyers figure this out fast: fewer re-ups, less friction, and stronger value every time.',
      secondaryCtaLabel: 'Shop Bulk',
      secondaryCtaUrl: 'https://rapidfirenow.com/lobby',
      heroImageUrls: [
        'https://rapidfirenow.com/static/slurry.webp',
        'https://rapidfirenow.com/static/devilsm.webp',
        'https://rapidfirenow.com/static/slurry.webp',
      ],
      benefits: [
        {
          title: 'LOWER COST',
          description:
            'Better value per gram means you keep more of your budget for the next drop.',
        },
        {
          title: 'FEWER RE-UPS',
          description:
            'A larger cart means fewer repeat checkouts and less time spent restocking.',
        },
        {
          title: 'SAME FIRE',
          description:
            'You are still shopping the same menu, just with a better buying strategy.',
        },
      ],
    },
  },
  'first-order': {
    Component: FirstOrderEmail as ComponentType<object>,
    defaultProps: {
      eyebrow: 'From the team behind Platinum Seedbank',
      discountText: '$25 OFF',
      discountLabel: 'First order',
      headline: 'Fresh. California. Delivered',
      body: 'Welcome to our new shop built by the team behind Platinum Seedbank. CA-sourced menu + fresh, fast delivery.',
      ctaLabel: 'CLAIM $25 & SHOP',
      ctaUrl: 'https://rapidfirenow.com/lobby',
      discountCode: 'RF25',
      codeNote:
        'Freshness guaranteed • Secure & frictionless checkout • 21+ only',
      benefits: [
        'Cannabis Cup Winning Growers',
        'California Quality',
        'Delivery Guaranteed',
        'Earn Cash Back',
        'Pay Your Way (Card • Apple Pay • Google Pay • Crypto • Cash App)',
      ],
      shopLinks: [
        {
          label: 'Flowers',
          url: 'https://rapidfirenow.com/lobby/category/flower',
        },
        {label: 'Vapes', url: 'https://rapidfirenow.com/lobby/category/vapes'},
        {
          label: 'Extracts',
          url: 'https://rapidfirenow.com/lobby/category/extracts',
        },
        {
          label: 'Edibles',
          url: 'https://rapidfirenow.com/lobby/category/edibles',
        },
        {
          label: 'Pre Rolls',
          url: 'https://rapidfirenow.com/lobby/category/pre-rolls',
        },
      ],
      secondaryCtaLabel: 'California Brands',
      secondaryCtaUrl: 'https://rapidfirenow.com/lobby/brands',
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

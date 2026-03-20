import type {Doc} from '../../convex/_generated/dataModel'
import {
  type LowStockAlertRecipient,
  normalizeLowStockAlertRecipients,
} from '../low-stock-alerts'
import {getStockDisplayUnit} from '../productStock'
import {createClient} from './index'
import {queueResendSend} from './rate-limit'
import {renderTemplate} from './render'
import {LowStockAlertEmail} from './templates/low-stock-alert'

type SendLowStockAlertEmailArgs = {
  product: Doc<'products'>
  recipients: LowStockAlertRecipient[]
  currentStock: number
  threshold: number
}

const DEFAULT_FROM = 'hello@rapidfirenow.com'
const DEFAULT_APP_BASE_URL = 'https://rapidfirenow.com'

const formatQuantity = (value: number) =>
  Number.isInteger(value)
    ? value.toLocaleString('en-US')
    : value.toLocaleString('en-US', {maximumFractionDigits: 6})

const formatStockLabel = (product: Doc<'products'>, value: number) => {
  const unit = getStockDisplayUnit(product)?.trim()
  return unit ? `${formatQuantity(value)} ${unit}` : formatQuantity(value)
}

const getAppBaseUrl = (): string =>
  process.env.EMAIL_API_BASE_URL?.trim() ||
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  process.env.SITE_URL?.trim() ||
  DEFAULT_APP_BASE_URL

export async function sendLowStockAlertEmail({
  product,
  recipients,
  currentStock,
  threshold,
}: SendLowStockAlertEmailArgs): Promise<{ids: string[]}> {
  const resend = createClient()
  const validRecipients = normalizeLowStockAlertRecipients(recipients)

  if (validRecipients.length === 0) {
    return {ids: []}
  }

  const currentStockLabel = formatStockLabel(product, currentStock)
  const thresholdLabel = formatStockLabel(product, threshold)
  const adminProductUrl = `${getAppBaseUrl()}/admin/inventory/product/${product._id}`
  const subject = `Low stock alert: ${product.name ?? 'Product'}`
  const ids: string[] = []

  for (const recipient of validRecipients) {
    const html = await renderTemplate(LowStockAlertEmail, {
      recipientName: recipient.name || recipient.email.split('@')[0] || 'there',
      productName: product.name ?? 'Product',
      currentStockLabel,
      thresholdLabel,
      adminProductUrl,
    })

    const result = await queueResendSend(() =>
      resend.emails.send({
        from: `Rapid Fire <${process.env.RESEND_FROM ?? DEFAULT_FROM}>`,
        to: recipient.email,
        subject,
        html,
      }),
    )

    if (result.error) {
      throw result.error instanceof Error
        ? result.error
        : new Error('Failed to send low stock alert email.')
    }

    if (result.data?.id) {
      ids.push(result.data.id)
    }
  }

  return {ids}
}

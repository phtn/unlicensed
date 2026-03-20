export const LOW_STOCK_ALERTS_IDENTIFIER = 'low-stock-alerts'

export type LowStockAlertRecipient = {
  name: string
  email: string
}

export type LowStockAlertsConfig = {
  enabled: boolean
  recipients: LowStockAlertRecipient[]
}

export type LowStockAlertTransition = 'schedule' | 'clear' | 'noop'

const DEFAULT_LOW_STOCK_ALERTS_CONFIG: LowStockAlertsConfig = {
  enabled: false,
  recipients: [],
}

const normalizeRecipient = (value: unknown): LowStockAlertRecipient | null => {
  if (!value || typeof value !== 'object') {
    return null
  }

  const raw = value as {name?: unknown; email?: unknown}
  const email =
    typeof raw.email === 'string' ? raw.email.trim().toLowerCase() : ''

  if (!email) {
    return null
  }

  const name = typeof raw.name === 'string' ? raw.name.trim() : ''

  return {name, email}
}

export const normalizeLowStockAlertRecipients = (
  value: unknown,
): LowStockAlertRecipient[] => {
  if (!Array.isArray(value)) {
    return []
  }

  const seen = new Set<string>()
  const recipients: LowStockAlertRecipient[] = []

  for (const item of value) {
    const recipient = normalizeRecipient(item)
    if (!recipient || seen.has(recipient.email)) {
      continue
    }

    seen.add(recipient.email)
    recipients.push(recipient)
  }

  return recipients
}

export const normalizeLowStockAlertsConfig = (
  value: unknown,
): LowStockAlertsConfig => {
  const raw = value && typeof value === 'object' ? value : {}

  return {
    enabled:
      typeof (raw as {enabled?: unknown}).enabled === 'boolean'
        ? ((raw as {enabled: boolean}).enabled ??
          DEFAULT_LOW_STOCK_ALERTS_CONFIG.enabled)
        : DEFAULT_LOW_STOCK_ALERTS_CONFIG.enabled,
    recipients: normalizeLowStockAlertRecipients(
      (raw as {recipients?: unknown}).recipients,
    ),
  }
}

export const serializeLowStockAlertsConfig = (
  config: LowStockAlertsConfig,
): Record<string, unknown> => ({
  enabled: config.enabled,
  recipients: config.recipients.map((recipient) => ({
    name: recipient.name.trim(),
    email: recipient.email.trim().toLowerCase(),
  })),
})

export const resolveLowStockAlertTransition = (args: {
  isArchived?: boolean
  threshold: number | undefined
  currentStock: number
  isActive: boolean
  alertsEnabled: boolean
  recipientCount: number
}): LowStockAlertTransition => {
  const {
    isArchived = false,
    threshold,
    currentStock,
    isActive,
    alertsEnabled,
    recipientCount,
  } = args

  const hasThreshold =
    typeof threshold === 'number' &&
    Number.isFinite(threshold) &&
    threshold >= 0

  if (isArchived || !hasThreshold) {
    return isActive ? 'clear' : 'noop'
  }

  if (currentStock > threshold) {
    return isActive ? 'clear' : 'noop'
  }

  if (isActive) {
    return 'noop'
  }

  return alertsEnabled && recipientCount > 0 ? 'schedule' : 'noop'
}

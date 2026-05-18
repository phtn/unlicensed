const META_PIXEL_SETTING_KEYS = [
  'pixelId',
  'metapixelId',
  'metapixel_id',
  'metapixel',
] as const

export const META_PIXEL_IDENTIFIER = 'metapixel_id'

type MetaPixelSetting = Record<string, unknown>
type MetaPixelParameterPrimitive = boolean | null | number | string | undefined
type MetaPixelParameterObject = {[key: string]: MetaPixelParameterValue}
type MetaPixelParameterValue =
  | MetaPixelParameterPrimitive
  | MetaPixelParameterObject
  | MetaPixelParameterValue[]

const DEFAULT_META_PIXEL_CURRENCY = 'USD'

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
  }
}

export type MetaPixelEventParameters = Record<string, MetaPixelParameterValue>

export function getMetaPixelId(setting: unknown): string | null {
  if (!setting || typeof setting !== 'object' || Array.isArray(setting)) {
    return null
  }

  const value = setting as MetaPixelSetting

  if ('error' in value) {
    return null
  }

  for (const key of META_PIXEL_SETTING_KEYS) {
    const candidate = value[key]

    if (typeof candidate !== 'string') {
      continue
    }

    const normalized = candidate.trim()

    if (normalized.length > 0) {
      return normalized
    }
  }

  return null
}

export function trackMetaPixelPageView() {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') {
    return
  }

  window.fbq('track', 'PageView')
}

export function trackMetaPixel(
  eventName: string,
  parameters?: MetaPixelEventParameters,
) {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') {
    return
  }

  if (parameters) {
    window.fbq('track', eventName, parameters)
    return
  }

  window.fbq('track', eventName)
}

export function trackMetaPixelCustom(
  eventName: string,
  parameters?: MetaPixelEventParameters,
) {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') {
    return
  }

  if (parameters) {
    window.fbq('trackCustom', eventName, parameters)
    return
  }

  window.fbq('trackCustom', eventName)
}

function getNormalizedMetaPixelContentIds(contentIds: string[]) {
  return [...new Set(contentIds.map((contentId) => contentId.trim()).filter(Boolean))]
}

export function trackMetaPixelAddToCart({
  contentIds,
  quantity,
  value,
  currency = DEFAULT_META_PIXEL_CURRENCY,
}: {
  contentIds: string[]
  quantity?: number
  value?: number
  currency?: string
}) {
  const normalizedContentIds = getNormalizedMetaPixelContentIds(contentIds)
  const parameters: MetaPixelEventParameters = {
    content_type: 'product',
  }

  if (normalizedContentIds.length > 0) {
    parameters.content_ids = normalizedContentIds
  }

  if (typeof quantity === 'number' && Number.isFinite(quantity) && quantity > 0) {
    parameters.quantity = quantity
  }

  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    parameters.value = value
    parameters.currency = currency
  }

  trackMetaPixel('AddToCart', parameters)
}

export function trackMetaPixelInitiateCheckout({
  contentIds,
  numItems,
  value,
  currency = DEFAULT_META_PIXEL_CURRENCY,
}: {
  contentIds?: string[]
  numItems?: number
  value?: number
  currency?: string
}) {
  const normalizedContentIds = getNormalizedMetaPixelContentIds(contentIds ?? [])
  const parameters: MetaPixelEventParameters = {
    content_type: 'product',
  }

  if (normalizedContentIds.length > 0) {
    parameters.content_ids = normalizedContentIds
  }

  if (typeof numItems === 'number' && Number.isFinite(numItems) && numItems > 0) {
    parameters.num_items = numItems
  }

  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    parameters.value = value
    parameters.currency = currency
  }

  trackMetaPixel('InitiateCheckout', parameters)
}

export function trackMetaPixelCheckoutClick({
  location,
  authenticated,
  numItems,
  value,
  currency = DEFAULT_META_PIXEL_CURRENCY,
}: {
  location: string
  authenticated: boolean
  numItems?: number
  value?: number
  currency?: string
}) {
  const parameters: MetaPixelEventParameters = {
    location,
    authenticated,
  }

  if (typeof numItems === 'number' && Number.isFinite(numItems) && numItems > 0) {
    parameters.num_items = numItems
  }

  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    parameters.value = value
    parameters.currency = currency
  }

  trackMetaPixelCustom('CheckoutClick', parameters)
}

export function trackMetaPixelViewContent({
  contentId,
  contentName,
  contentCategory,
  value,
  currency = DEFAULT_META_PIXEL_CURRENCY,
}: {
  contentId: string
  contentName?: string
  contentCategory?: string
  value?: number
  currency?: string
}) {
  const normalizedContentId = contentId.trim()

  if (normalizedContentId.length === 0) {
    return
  }

  const parameters: MetaPixelEventParameters = {
    content_ids: [normalizedContentId],
    content_type: 'product',
  }

  if (contentName?.trim()) {
    parameters.content_name = contentName.trim()
  }

  if (contentCategory?.trim()) {
    parameters.content_category = contentCategory.trim()
  }

  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    parameters.value = value
    parameters.currency = currency
  }

  trackMetaPixel('ViewContent', parameters)
}

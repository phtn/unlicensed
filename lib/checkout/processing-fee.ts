type ProcessingFeePaymentMethod =
  | 'cards'
  | 'crypto_transfer'
  | 'crypto_commerce'
  | 'cash_app'

type ComputeProcessingFeeCentsArgs = {
  discountedSubtotalCents: number
  enabled: boolean
  paymentMethod: ProcessingFeePaymentMethod
  percent: number
  shippingCents?: number
}

type ComputeOrderSummarySubtotalCentsArgs = {
  itemsTotalCents: number
  redeemedStoreCreditCents?: number
  shippingCents?: number
}

type ComputeOrderSummaryProcessingFeeCentsArgs =
  ComputeOrderSummarySubtotalCentsArgs & {
    processingFeeCents?: number
    taxCents?: number
    totalCents?: number
  }

type ComputeOrderTotalCentsArgs = {
  subtotalCents?: number
  taxCents?: number
  shippingCents?: number
  discountCents?: number
  totalCents?: number
}

type ComputeCryptoRelayTargetCentsArgs = {
  totalCents?: number
  processingFeeCents?: number
}

const normalizeMoneyCents = (value?: number) =>
  Number.isFinite(value) ? Math.max(0, value ?? 0) : 0

export const computeOrderSummarySubtotalCents = ({
  itemsTotalCents,
  redeemedStoreCreditCents = 0,
  shippingCents = 0,
}: ComputeOrderSummarySubtotalCentsArgs) => {
  return Math.max(
    0,
    normalizeMoneyCents(itemsTotalCents) +
      normalizeMoneyCents(shippingCents) -
      normalizeMoneyCents(redeemedStoreCreditCents),
  )
}

export const computeOrderSummaryProcessingFeeCents = ({
  itemsTotalCents,
  redeemedStoreCreditCents = 0,
  processingFeeCents,
  shippingCents = 0,
  taxCents = 0,
  totalCents = 0,
}: ComputeOrderSummaryProcessingFeeCentsArgs) => {
  const normalizedProcessingFeeCents = normalizeMoneyCents(processingFeeCents)
  if (normalizedProcessingFeeCents > 0) {
    return normalizedProcessingFeeCents
  }

  const subtotalCents = computeOrderSummarySubtotalCents({
    itemsTotalCents,
    redeemedStoreCreditCents,
    shippingCents,
  })

  return Math.max(
    0,
    normalizeMoneyCents(totalCents) -
      subtotalCents -
      normalizeMoneyCents(taxCents),
  )
}

export const computeOrderTotalCents = ({
  subtotalCents,
  taxCents,
  shippingCents,
  discountCents,
  totalCents,
}: ComputeOrderTotalCentsArgs) => {
  const hasBreakdown =
    subtotalCents !== undefined ||
    taxCents !== undefined ||
    shippingCents !== undefined ||
    discountCents !== undefined

  if (!hasBreakdown) {
    return normalizeMoneyCents(totalCents)
  }

  return Math.max(
    0,
    normalizeMoneyCents(subtotalCents) +
      normalizeMoneyCents(taxCents) +
      normalizeMoneyCents(shippingCents) -
      normalizeMoneyCents(discountCents),
  )
}

export const computeCryptoRelayTargetCents = ({
  totalCents,
  processingFeeCents,
}: ComputeCryptoRelayTargetCentsArgs) =>
  Math.max(
    0,
    normalizeMoneyCents(totalCents) + normalizeMoneyCents(processingFeeCents),
  )

export const isProcessingFeePaymentMethod = (
  paymentMethod: ProcessingFeePaymentMethod,
) => paymentMethod === 'crypto_transfer' || paymentMethod === 'crypto_commerce'

export const computeProcessingFeeCents = ({
  discountedSubtotalCents,
  enabled,
  paymentMethod,
  percent,
  shippingCents = 0,
}: ComputeProcessingFeeCentsArgs) => {
  if (!enabled || !isProcessingFeePaymentMethod(paymentMethod)) {
    return 0
  }

  const normalizedSubtotalCents = Math.max(0, discountedSubtotalCents)
  const normalizedPercent =
    Number.isFinite(percent) && percent > 0 ? percent / 100 : 0

  return Math.round(
    (normalizedSubtotalCents + shippingCents) * normalizedPercent,
  )
}

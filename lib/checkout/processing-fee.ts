type ProcessingFeePaymentMethod =
  | 'cards'
  | 'crypto_transfer'
  | 'crypto_commerce'
  | 'cash_app'

type ResolveOrderPayableTotalCentsArgs = {
  paymentMethod?: string
  totalCents?: number
  processingFeeCents?: number
  totalWithCryptoFeeCents?: number
}

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

type ComputeCryptoFeeCentsArgs = {
  totalCents?: number
  totalWithCryptoFeeCents?: number
}

type ComputePersistedOrderPaymentAmountsArgs = {
  paymentMethod: ProcessingFeePaymentMethod
  discountedSubtotalCents: number
  totalCents: number
  taxCents?: number
  shippingCents?: number
  processingFeeEnabled?: boolean
  processingFeePercent?: number
  cryptoFeeEnabled?: boolean
  cryptoFeeAcc?: number
}

export const CASH_APP_PROCESSING_FEE_PERCENT = 8

const normalizeMoneyCents = (value?: number) =>
  Number.isFinite(value) ? Math.max(0, value ?? 0) : 0

const isCryptoPaymentMethod = (paymentMethod?: string) =>
  paymentMethod === 'crypto_transfer' || paymentMethod === 'crypto_commerce'

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

export const computeCryptoFeeCents = ({
  totalCents,
  totalWithCryptoFeeCents,
}: ComputeCryptoFeeCentsArgs) =>
  Math.max(
    0,
    normalizeMoneyCents(totalWithCryptoFeeCents) -
      normalizeMoneyCents(totalCents),
  )

export const isProcessingFeePaymentMethod = (
  paymentMethod: ProcessingFeePaymentMethod,
) => isCryptoPaymentMethod(paymentMethod) || paymentMethod === 'cash_app'

export const computeProcessingFeeCents = ({
  discountedSubtotalCents,
  enabled,
  paymentMethod,
  percent,
  shippingCents = 0,
}: ComputeProcessingFeeCentsArgs) => {
  if (!isProcessingFeePaymentMethod(paymentMethod)) {
    return 0
  }

  const normalizedSubtotalCents = Math.max(0, discountedSubtotalCents)
  const effectivePercent =
    paymentMethod === 'cash_app' ? CASH_APP_PROCESSING_FEE_PERCENT : percent
  const normalizedPercent =
    Number.isFinite(effectivePercent) && effectivePercent > 0
      ? effectivePercent / 100
      : 0

  if ((paymentMethod !== 'cash_app' && !enabled) || normalizedPercent === 0) {
    return 0
  }

  return Math.round(
    (normalizedSubtotalCents + shippingCents) * normalizedPercent,
  )
}

export const computePersistedOrderPaymentAmounts = ({
  paymentMethod,
  discountedSubtotalCents,
  totalCents,
  taxCents = 0,
  shippingCents = 0,
  processingFeeEnabled = false,
  processingFeePercent = 0,
  cryptoFeeEnabled = false,
  cryptoFeeAcc = 1,
}: ComputePersistedOrderPaymentAmountsArgs) => {
  const processingFeeCents = computeProcessingFeeCents({
    discountedSubtotalCents,
    enabled: processingFeeEnabled,
    paymentMethod,
    percent: processingFeePercent,
    shippingCents,
  })

  if (!isCryptoPaymentMethod(paymentMethod)) {
    return {
      processingFeeCents:
        processingFeeCents > 0 ? normalizeMoneyCents(processingFeeCents) : undefined,
      cryptoFeeCents: undefined,
      totalWithCryptoFeeCents: undefined,
    }
  }

  const totalBeforeCryptoFeeCents =
    normalizeMoneyCents(discountedSubtotalCents) +
    normalizeMoneyCents(taxCents) +
    normalizeMoneyCents(shippingCents) +
    (processingFeeEnabled ? normalizeMoneyCents(processingFeeCents) : 0)
  const normalizedCryptoFeeAcc =
    Number.isFinite(cryptoFeeAcc) && cryptoFeeAcc > 0 ? cryptoFeeAcc : 1
  const totalWithCryptoFeeCents = Math.round(
    totalBeforeCryptoFeeCents *
      (cryptoFeeEnabled ? normalizedCryptoFeeAcc : 1),
  )

  return {
    processingFeeCents:
      processingFeeCents > 0 ? normalizeMoneyCents(processingFeeCents) : undefined,
    cryptoFeeCents: computeCryptoFeeCents({
      totalCents,
      totalWithCryptoFeeCents,
    }),
    totalWithCryptoFeeCents,
  }
}

export const resolveOrderPayableTotalCents = ({
  paymentMethod,
  totalCents,
  processingFeeCents,
  totalWithCryptoFeeCents,
}: ResolveOrderPayableTotalCentsArgs) => {
  if (isCryptoPaymentMethod(paymentMethod)) {
    const normalizedTotalWithCryptoFeeCents = normalizeMoneyCents(
      totalWithCryptoFeeCents,
    )

    if (normalizedTotalWithCryptoFeeCents > 0) {
      return normalizedTotalWithCryptoFeeCents
    }
  }

  if (paymentMethod === 'cash_app') {
    return Math.max(
      0,
      normalizeMoneyCents(totalCents) + normalizeMoneyCents(processingFeeCents),
    )
  }

  return normalizeMoneyCents(totalCents)
}

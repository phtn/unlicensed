type ResolveRewardShippingCostDollarsArgs = {
  tierShippingCostDollars: number
  isFirstOrder: boolean
  subtotalDollars: number
  freeShippingFirstOrderDollars: number
}

type ResolveOrderShippingCentsArgs = {
  subtotalCents: number
  isFirstOrder: boolean
  freeShippingFirstOrderDollars: number
  rewardTierShippingCostDollars?: number | null
  fallbackMinimumOrderCents: number
  fallbackShippingFeeCents: number
}

const normalizeMoney = (value: number) =>
  Number.isFinite(value) ? Math.max(0, value) : 0

export const resolveRewardShippingCostDollars = ({
  tierShippingCostDollars,
  isFirstOrder,
  subtotalDollars,
  freeShippingFirstOrderDollars,
}: ResolveRewardShippingCostDollarsArgs) => {
  if (
    isFirstOrder &&
    normalizeMoney(subtotalDollars) >=
      normalizeMoney(freeShippingFirstOrderDollars)
  ) {
    return 0
  }

  return normalizeMoney(tierShippingCostDollars)
}

export const resolveOrderShippingCents = ({
  subtotalCents,
  isFirstOrder,
  freeShippingFirstOrderDollars,
  rewardTierShippingCostDollars,
  fallbackMinimumOrderCents,
  fallbackShippingFeeCents,
}: ResolveOrderShippingCentsArgs) => {
  if (typeof rewardTierShippingCostDollars === 'number') {
    return Math.round(
      resolveRewardShippingCostDollars({
        tierShippingCostDollars: rewardTierShippingCostDollars,
        isFirstOrder,
        subtotalDollars: normalizeMoney(subtotalCents) / 100,
        freeShippingFirstOrderDollars,
      }) * 100,
    )
  }

  return normalizeMoney(subtotalCents) >=
    normalizeMoney(fallbackMinimumOrderCents)
    ? 0
    : normalizeMoney(fallbackShippingFeeCents)
}

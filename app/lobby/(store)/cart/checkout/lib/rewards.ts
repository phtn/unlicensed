import {resolveRewardShippingCostDollars} from '@/lib/checkout/shipping'

/**
 * Tier-based rewards: shipping tiers, cash back %, bundle bonus.
 * All monetary values in config and computeRewards are in dollars.
 * Callers should convert to cents where needed (e.g. shippingCents = Math.round(shippingCost * 100)).
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RewardsCartItem {
  id: string
  name: string
  price: number
  category: string
  isHighMargin?: boolean
}

export interface RewardsTier {
  minSubtotal: number
  maxSubtotal: number | null
  shippingCost: number
  cashBackPct: number
  label: string
}

export interface BundleBonus {
  enabled: boolean
  bonusPct: number
  minCategories: number
}

export interface RewardsConfig {
  tiers: RewardsTier[]
  bundleBonus: BundleBonus
  freeShippingFirstOrder: number
  minRedemption: number
  topUpProximityThreshold: number
}

export interface ComputedRewards {
  currentTier: RewardsTier
  nextTier: RewardsTier | null
  futureTiers: RewardsTier[]
  cashBackPct: number
  shippingCost: number
  cashBackAmount: number
  isBundleBonusActive: boolean
  uniqueCategories: number
  amountToNextTier: number | null
  progressPctToNext: number
  isNearThreshold: boolean
  isFirstOrder: boolean
}

export function computeCashBackAmount(
  subtotalDollars: number,
  cashBackPct: number,
): number {
  const eligibleSubtotalDollars = Math.max(0, subtotalDollars)
  return (eligibleSubtotalDollars * cashBackPct) / 100
}

// ─── Config ───────────────────────────────────────────────────────────────────

export const REWARDS_CONFIG: RewardsConfig = {
  tiers: [
    {
      minSubtotal: 0,
      maxSubtotal: 98.99,
      shippingCost: 12.99,
      cashBackPct: 1.5,
      label: 'Bronze',
    },
    {
      minSubtotal: 99,
      maxSubtotal: 148.99,
      shippingCost: 3.99,
      cashBackPct: 2.0,
      label: 'Silver',
    },
    {
      minSubtotal: 149,
      maxSubtotal: 248.99,
      shippingCost: 0,
      cashBackPct: 3.0,
      label: 'Gold',
    },
    {
      minSubtotal: 249,
      maxSubtotal: null,
      shippingCost: 0,
      cashBackPct: 5.0,
      label: 'Platinum',
    },
  ],
  bundleBonus: {enabled: true, bonusPct: 0.5, minCategories: 2},
  freeShippingFirstOrder: 49,
  minRedemption: 5,
  topUpProximityThreshold: 20,
}

// ─── Pure logic ───────────────────────────────────────────────────────────────

/**
 * @param items - Cart items (used for unique category count and bundle bonus)
 * @param subtotalDollars - Order subtotal in dollars
 * @param isFirstOrder - Whether this is the customer's first order (affects free shipping threshold)
 * @param config - Rewards config (defaults to REWARDS_CONFIG)
 */
export function computeRewards(
  items: {category: string}[],
  subtotalDollars: number,
  isFirstOrder: boolean,
  config: RewardsConfig = REWARDS_CONFIG,
): ComputedRewards {
  const tierIdx = config.tiers.findIndex(
    (t) =>
      subtotalDollars >= t.minSubtotal &&
      (t.maxSubtotal === null || subtotalDollars <= t.maxSubtotal),
  )
  const currentTier = config.tiers[tierIdx] ?? config.tiers[0]
  const nextTier =
    tierIdx < config.tiers.length - 1 ? config.tiers[tierIdx + 1] : null
  const futureTiers =
    tierIdx < config.tiers.length - 2 ? config.tiers.slice(tierIdx + 2) : []

  const uniqueCategories = new Set(items.map((i) => i.category)).size
  const isBundleBonusActive =
    config.bundleBonus.enabled &&
    uniqueCategories >= config.bundleBonus.minCategories

  const cashBackPct =
    currentTier.cashBackPct +
    (isBundleBonusActive ? config.bundleBonus.bonusPct : 0)
  const cashBackAmount = computeCashBackAmount(subtotalDollars, cashBackPct)

  const shippingCost = resolveRewardShippingCostDollars({
    tierShippingCostDollars: currentTier.shippingCost,
    isFirstOrder,
    subtotalDollars,
    freeShippingFirstOrderDollars: config.freeShippingFirstOrder,
  })

  const amountToNextTier = nextTier
    ? Math.max(0, nextTier.minSubtotal - subtotalDollars)
    : null

  const tierSpan = nextTier ? nextTier.minSubtotal - currentTier.minSubtotal : 1
  const progressInTier = subtotalDollars - currentTier.minSubtotal
  const progressPctToNext = nextTier
    ? Math.min(100, (progressInTier / tierSpan) * 100)
    : 100

  const isNearThreshold =
    amountToNextTier !== null &&
    amountToNextTier <= config.topUpProximityThreshold

  return {
    currentTier,
    nextTier,
    futureTiers,
    cashBackPct,
    shippingCost,
    cashBackAmount,
    isBundleBonusActive,
    uniqueCategories,
    amountToNextTier,
    progressPctToNext,
    isNearThreshold,
    isFirstOrder,
  }
}

/** Format dollars for display (e.g. $12.99) */
export function formatRewardsCurrency(dollars: number): string {
  return dollars.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

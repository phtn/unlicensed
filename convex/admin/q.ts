import {v} from 'convex/values'
import {query} from '../_generated/server'
import type {AdminSettings} from './d'
import {normalizeFireCollectionsValue} from './fireCollections'
import {
  DEFAULT_PRODUCT_TIERS_AS_ARRAY,
  distributeFlatTiers,
  tiersObjectToArray,
} from './productTiersDefaults'

/**
 * Get admin settings
 */
export const listAdminSettings = query({
  handler: async (ctx): Promise<AdminSettings[]> => {
    const settings = await ctx.db.query('adminSettings').collect()
    return settings
  },
})

export const getAdminSettings = query({
  args: {},
  handler: async (ctx): Promise<AdminSettings | null> => {
    const settings =
      (await ctx.db
        .query('adminSettings')
        .withIndex('by_identifier', (q) => q.eq('identifier', 'paygate'))
        .unique()) ??
      (await ctx.db
        .query('adminSettings')
        .withIndex('by_identifier', (q) => q.eq('identifier', 'statConfigs'))
        .unique()) ??
      (await ctx.db.query('adminSettings').first())

    if (!settings) {
      // Return default configs if no settings exist yet
      return {
        value: {
          statConfigs: [
            {id: 'salesToday', label: 'Sales Today', visible: true, order: 0},
            {
              id: 'pendingOrders',
              label: 'Pending Orders',
              visible: true,
              order: 1,
            },
            {id: 'deliveries', label: 'Deliveries', visible: true, order: 2},
            {
              id: 'totalRevenue',
              label: 'Total Revenue',
              visible: true,
              order: 3,
            },
            {id: 'totalUsers', label: 'Total Users', visible: true, order: 4},
            {
              id: 'totalProducts',
              label: 'Total Products',
              visible: true,
              order: 5,
            },
            {
              id: 'averageOrderValue',
              label: 'Average Order Value',
              visible: true,
              order: 6,
            },
            {
              id: 'cancelledOrders',
              label: 'Cancelled Orders',
              visible: true,
              order: 7,
            },
            {
              id: 'salesThisWeek',
              label: 'Sales This Week',
              visible: false,
              order: 8,
            },
            {
              id: 'salesThisMonth',
              label: 'Sales This Month',
              visible: false,
              order: 9,
            },
          ],
        },
        updatedAt: Date.now(),
        createdAt: Date.now(),
        createdBy: 'dev-admin',
      }
    }

    return settings
  },
})

export const getAdminByIdentifier = query({
  args: {
    identifier: v.string(),
  },
  handler: async ({db}, {identifier}): Promise<AdminSettings | null> => {
    // Try to find by identifier first
    let setting = await db
      .query('adminSettings')
      .withIndex('by_identifier', (q) => q.eq('identifier', identifier))
      .unique()

    if (
      !setting &&
      (identifier === 'productTiers' || identifier === 'statConfigs')
    ) {
      // Fall back to first document when identifier wasn't set on existing docs
      setting = (await db.query('adminSettings').first()) ?? null
    }

    // Normalize productTiers to stored format: [{ flower: [] }, { extract: [] }, { vape: [] }]
    if (setting && identifier === 'productTiers') {
      const raw = setting.value?.productTiers
      let productTiers: typeof DEFAULT_PRODUCT_TIERS_AS_ARRAY
      if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] === 'string') {
        productTiers = tiersObjectToArray(distributeFlatTiers(raw as string[]))
      } else if (
        raw &&
        typeof raw === 'object' &&
        !Array.isArray(raw) &&
        ('flower' in raw || 'extract' in raw || 'vape' in raw)
      ) {
        productTiers = tiersObjectToArray(raw as Record<string, string[]>)
      } else {
        productTiers = (
          Array.isArray(raw) ? raw : DEFAULT_PRODUCT_TIERS_AS_ARRAY
        ) as typeof DEFAULT_PRODUCT_TIERS_AS_ARRAY
      }
      return {
        ...setting,
        value: {
          ...setting.value,
          productTiers,
        },
      }
    }

    if (setting) {
      return setting
    }

    // No adminSettings at all: in-memory default for productTiers
    if (identifier === 'productTiers') {
      return {
        value: {
          productTiers: DEFAULT_PRODUCT_TIERS_AS_ARRAY,
        },
        updatedAt: Date.now(),
        createdAt: Date.now(),
        createdBy: 'dev-admin',
      }
    }

    // If no adminSettings exist at all, return default configs for 'statConfigs' identifier
    if (identifier === 'statConfigs') {
      return {
        value: {
          statConfigs: [
            {id: 'salesToday', label: 'Sales Today', visible: true, order: 0},
            {
              id: 'pendingOrders',
              label: 'Pending Orders',
              visible: true,
              order: 1,
            },
            {id: 'deliveries', label: 'Deliveries', visible: true, order: 2},
            {
              id: 'totalRevenue',
              label: 'Total Revenue',
              visible: true,
              order: 3,
            },
            {id: 'totalUsers', label: 'Total Users', visible: true, order: 4},
            {
              id: 'totalProducts',
              label: 'Total Products',
              visible: true,
              order: 5,
            },
            {
              id: 'averageOrderValue',
              label: 'Average Order Value',
              visible: true,
              order: 6,
            },
            {
              id: 'cancelledOrders',
              label: 'Cancelled Orders',
              visible: true,
              order: 7,
            },
            {
              id: 'salesThisWeek',
              label: 'Sales This Week',
              visible: false,
              order: 8,
            },
            {
              id: 'salesThisMonth',
              label: 'Sales This Month',
              visible: false,
              order: 9,
            },
          ],
        },
        updatedAt: Date.now(),
        createdAt: Date.now(),
        createdBy: 'dev-admin',
      }
    }

    // For other identifiers, return null instead of throwing
    // This allows React Query to handle it gracefully
    return null
  },
})

/**
 * Get default payment gateway (paygate | paylex | rampex) for card checkout
 * Reads from adminSettings with identifier 'payment-gateway'
 */
export const getPaymentDefaultGateway = query({
  args: {},
  handler: async ({db}): Promise<'paygate' | 'paylex' | 'rampex'> => {
    const setting = await db
      .query('adminSettings')
      .withIndex('by_identifier', (q) => q.eq('identifier', 'payment-gateway'))
      .unique()

    const v =
      setting?.value &&
      typeof setting.value === 'object' &&
      'defaultGateway' in setting.value
        ? setting.value.defaultGateway
        : undefined

    if (v === 'paygate' || v === 'paylex' || v === 'rampex') return v
    return 'paygate'
  },
})

/**
 * Get IPAPI geolocation setting
 * Returns whether IPAPI geolocation is enabled (defaults to false if not set)
 */
export const getIpapiGeolocationEnabled = query({
  args: {},
  handler: async ({db}): Promise<boolean> => {
    const setting = await db
      .query('adminSettings')
      .withIndex('by_identifier', (q) => q.eq('identifier', 'ipapiGeolocation'))
      .unique()

    if (
      setting?.value &&
      typeof setting.value === 'object' &&
      'enabled' in setting.value
    ) {
      return Boolean(setting.value.enabled)
    }

    // Default to false if not set
    return false
  },
})

/**
 * Get halt pass setting
 * Returns whether halt pass is enabled (defaults to false if not set)
 */
export const getHaltPass = query({
  args: {},
  handler: async ({db}) => {
    const setting = await db
      .query('adminSettings')
      .withIndex('by_identifier', (q) => q.eq('identifier', 'halt-pass'))
      .first()

    return setting
  },
})

export const getAdminByIdentStrict = query({
  args: {identifier: v.string()},
  handler: async ({db}, {identifier}) => {
    const setting = await db
      .query('adminSettings')
      .withIndex('by_identifier', (q) => q.eq('identifier', identifier))
      .first()

    if (!setting) {
      return {error: `NOT_FOUND`, status: 404, message: identifier}
    }

    return setting.value
  },
})

export const getFireCollectionConfig = query({
  args: {},
  handler: async ({db}) => {
    const setting = await db
      .query('adminSettings')
      .withIndex('by_identifier', (q) => q.eq('identifier', 'fireCollection'))
      .unique()

    const collections = normalizeFireCollectionsValue(setting?.value)
    const primaryCollection =
      collections.find((collection) => collection.enabled) ?? collections[0]

    return {productIds: primaryCollection?.productIds ?? []}
  },
})

export const getFireCollectionsConfig = query({
  args: {},
  handler: async ({db}) => {
    const setting = await db
      .query('adminSettings')
      .withIndex('by_identifier', (q) => q.eq('identifier', 'fireCollection'))
      .unique()

    return normalizeFireCollectionsValue(setting?.value)
  },
})

const DEFAULT_SHIPPING_FEE_CENTS = 500 // $5
const DEFAULT_MINIMUM_ORDER_CENTS = 5000 // $50 for free shipping

export const getShippingConfig = query({
  args: {},
  handler: async ({db}) => {
    const setting = await db
      .query('adminSettings')
      .withIndex('by_identifier', (q) => q.eq('identifier', 'shipping_config'))
      .unique()

    if (!setting?.value || typeof setting.value !== 'object') {
      return {
        shippingFeeCents: DEFAULT_SHIPPING_FEE_CENTS,
        minimumOrderCents: DEFAULT_MINIMUM_ORDER_CENTS,
      }
    }

    const v = setting.value as Record<string, unknown>
    return {
      shippingFeeCents:
        typeof v.shippingFeeCents === 'number'
          ? v.shippingFeeCents
          : DEFAULT_SHIPPING_FEE_CENTS,
      minimumOrderCents:
        typeof v.minimumOrderCents === 'number'
          ? v.minimumOrderCents
          : DEFAULT_MINIMUM_ORDER_CENTS,
    }
  },
})

const DEFAULT_TAX_RATE_PERCENT = 10

export const getTaxConfig = query({
  args: {},
  handler: async ({db}) => {
    const setting = await db
      .query('adminSettings')
      .withIndex('by_identifier', (q) => q.eq('identifier', 'tax_config'))
      .unique()

    if (!setting?.value || typeof setting.value !== 'object') {
      return {taxRatePercent: DEFAULT_TAX_RATE_PERCENT, active: true}
    }

    const v = setting.value as Record<string, unknown>
    return {
      taxRatePercent:
        typeof v.taxRatePercent === 'number'
          ? v.taxRatePercent
          : DEFAULT_TAX_RATE_PERCENT,
      active: typeof v.active === 'boolean' ? v.active : true,
    }
  },
})

const DEFAULT_REWARDS_TIERS = [
  {
    minSubtotal: 0,
    maxSubtotal: 98.99,
    shippingCost: 12.99,
    cashBackPct: 1.5,
    label: 'Starter',
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
] as const

const DEFAULT_BUNDLE_BONUS = {enabled: true, bonusPct: 0.5, minCategories: 2}
const DEFAULT_FREE_SHIPPING_FIRST_ORDER = 49
const DEFAULT_MIN_REDEMPTION = 5
const DEFAULT_TOP_UP_PROXIMITY = 20

export const getRewardsConfig = query({
  args: {},
  handler: async ({db}) => {
    const setting = await db
      .query('adminSettings')
      .withIndex('by_identifier', (q) => q.eq('identifier', 'rewards_config'))
      .unique()

    if (!setting?.value || typeof setting.value !== 'object') {
      return {
        tiers: [...DEFAULT_REWARDS_TIERS],
        bundleBonus: {...DEFAULT_BUNDLE_BONUS},
        freeShippingFirstOrder: DEFAULT_FREE_SHIPPING_FIRST_ORDER,
        minRedemption: DEFAULT_MIN_REDEMPTION,
        topUpProximityThreshold: DEFAULT_TOP_UP_PROXIMITY,
      }
    }

    const v = setting.value as Record<string, unknown>

    const rawTiers = Array.isArray(v.tiers) ? v.tiers : []
    const tiers = rawTiers.map((t: unknown) => {
      const row =
        t && typeof t === 'object' ? (t as Record<string, unknown>) : {}
      return {
        minSubtotal: typeof row.minSubtotal === 'number' ? row.minSubtotal : 0,
        maxSubtotal:
          row.maxSubtotal === null || typeof row.maxSubtotal === 'number'
            ? row.maxSubtotal
            : 0,
        shippingCost:
          typeof row.shippingCost === 'number' ? row.shippingCost : 0,
        cashBackPct: typeof row.cashBackPct === 'number' ? row.cashBackPct : 0,
        label: typeof row.label === 'string' ? row.label : 'Tier',
      }
    })
    if (tiers.length === 0) {
      tiers.push(...DEFAULT_REWARDS_TIERS)
    }

    const rawBundle =
      v.bundleBonus && typeof v.bundleBonus === 'object'
        ? (v.bundleBonus as Record<string, unknown>)
        : {}
    const bundleBonus = {
      enabled:
        typeof rawBundle.enabled === 'boolean'
          ? rawBundle.enabled
          : DEFAULT_BUNDLE_BONUS.enabled,
      bonusPct:
        typeof rawBundle.bonusPct === 'number'
          ? rawBundle.bonusPct
          : DEFAULT_BUNDLE_BONUS.bonusPct,
      minCategories:
        typeof rawBundle.minCategories === 'number'
          ? rawBundle.minCategories
          : DEFAULT_BUNDLE_BONUS.minCategories,
    }

    return {
      tiers,
      bundleBonus,
      freeShippingFirstOrder:
        typeof v.freeShippingFirstOrder === 'number'
          ? v.freeShippingFirstOrder
          : DEFAULT_FREE_SHIPPING_FIRST_ORDER,
      minRedemption:
        typeof v.minRedemption === 'number'
          ? v.minRedemption
          : DEFAULT_MIN_REDEMPTION,
      topUpProximityThreshold:
        typeof v.topUpProximityThreshold === 'number'
          ? v.topUpProximityThreshold
          : DEFAULT_TOP_UP_PROXIMITY,
    }
  },
})

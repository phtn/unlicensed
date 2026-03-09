import {v} from 'convex/values'
import {mutation} from '../_generated/server'
import type {MutationCtx} from '../_generated/server'
import {safeGet} from '../utils/id_validation'
import {
  paymentGatewayConfigsSchema,
  paygateSettingsSchema,
  StatConfig,
  statConfigSchema,
} from './d'
import {DEFAULT_PRODUCT_TIERS_AS_ARRAY} from './productTiersDefaults'

const DEFAULT_STAT_CONFIGS: Array<StatConfig> = [
  {id: 'salesToday', label: 'Sales Today', visible: true, order: 0},
  {id: 'pendingOrders', label: 'Pending Orders', visible: true, order: 1},
  {id: 'deliveries', label: 'Deliveries', visible: true, order: 2},
  {id: 'totalRevenue', label: 'Total Revenue', visible: true, order: 3},
  {id: 'totalUsers', label: 'Total Users', visible: true, order: 4},
  {id: 'totalProducts', label: 'Total Products', visible: true, order: 5},
  {
    id: 'averageOrderValue',
    label: 'Average Order Value',
    visible: true,
    order: 6,
  },
  {id: 'cancelledOrders', label: 'Cancelled Orders', visible: true, order: 7},
  {id: 'salesThisWeek', label: 'Sales This Week', visible: false, order: 8},
  {id: 'salesThisMonth', label: 'Sales This Month', visible: false, order: 9},
]

/**
 * Ensure statConfigs are seeded (idempotent - safe to call multiple times)
 * This can be called manually to ensure statConfigs exist in the database
 */
export const ensureStatConfigsSeeded = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if statConfigs already exist
    const existing = await ctx.db
      .query('adminSettings')
      .withIndex('by_identifier', (q) => q.eq('identifier', 'statConfigs'))
      .unique()

    if (existing) {
      return {success: true, message: 'statConfigs already exist'}
    }

    // Check for legacy settings without identifier
    const legacySettings = await ctx.db.query('adminSettings').first()

    if (legacySettings) {
      // Update legacy settings to add identifier
      await ctx.db.patch(legacySettings._id, {
        identifier: 'statConfigs',
      })
      return {success: true, message: 'Updated legacy settings with identifier'}
    }

    // Create new settings
    await ctx.db.insert('adminSettings', {
      identifier: 'statConfigs',
      value: {statConfigs: DEFAULT_STAT_CONFIGS},
      updatedAt: Date.now(),
      createdAt: Date.now(),
      createdBy: 'ensureStatConfigsSeeded',
    })

    return {success: true, message: 'Created new statConfigs'}
  },
})

/**
 * Ensure productTiers are seeded (idempotent - safe to call multiple times).
 * Seeds adminSettings with identifier 'productTiers'; runtime source of truth is this setting, not app code.
 */
export const ensureProductTiersSeeded = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query('adminSettings')
      .withIndex('by_identifier', (q) => q.eq('identifier', 'productTiers'))
      .unique()

    if (existing) {
      return {success: true, message: 'productTiers already exist'}
    }

    await ctx.db.insert('adminSettings', {
      identifier: 'productTiers',
      value: {productTiers: DEFAULT_PRODUCT_TIERS_AS_ARRAY},
      updatedAt: Date.now(),
      createdAt: Date.now(),
      createdBy: 'ensureProductTiersSeeded',
    })

    return {success: true, message: 'Created new productTiers'}
  },
})

/**
 * Initialize or get admin settings
 */
export const getOrCreateAdminSettings = mutation({
  args: {uid: v.string()},
  handler: async (ctx, {uid}) => {
    // Check if statConfigs already exist
    const settings = await ctx.db
      .query('adminSettings')
      .withIndex('by_identifier', (q) => q.eq('identifier', 'statConfigs'))
      .unique()

    if (settings) {
      return settings
    }

    // Check for legacy settings without identifier
    const legacySettings = await ctx.db.query('adminSettings').first()

    if (legacySettings) {
      // Update legacy settings to add identifier
      await ctx.db.patch(legacySettings._id, {
        identifier: 'statConfigs',
      })
      return await safeGet(ctx.db, 'adminSettings', legacySettings._id)
    }

    // Create new settings
    const settingsId = await ctx.db.insert('adminSettings', {
      identifier: 'statConfigs',
      value: {statConfigs: DEFAULT_STAT_CONFIGS},
      updatedAt: Date.now(),
      createdAt: Date.now(),
      createdBy: uid,
    })
    return await safeGet(ctx.db, 'adminSettings', settingsId)
  },
})

/**
 * Update stat visibility
 */
export const updateStatVisibility = mutation({
  args: {
    statId: v.string(),
    visible: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Ensure statConfigs exist first
    let settings = await ctx.db
      .query('adminSettings')
      .withIndex('by_identifier', (q) => q.eq('identifier', 'statConfigs'))
      .unique()

    if (!settings) {
      // Check for legacy settings
      const legacySettings = await ctx.db.query('adminSettings').first()
      if (legacySettings) {
        await ctx.db.patch(legacySettings._id, {
          identifier: 'statConfigs',
        })
        settings = await safeGet(ctx.db, 'adminSettings', legacySettings._id)
      } else {
        // Create new settings
        const updatedConfigs = DEFAULT_STAT_CONFIGS.map((config) =>
          config.id === args.statId
            ? {...config, visible: args.visible}
            : config,
        )
        const settingsId = await ctx.db.insert('adminSettings', {
          identifier: 'statConfigs',
          value: {statConfigs: updatedConfigs},
          updatedAt: Date.now(),
          createdAt: Date.now(),
        })
        settings = await safeGet(ctx.db, 'adminSettings', settingsId)
      }
    }

    if (!settings) {
      throw new Error('Failed to create settings')
    }

    const currentConfigs =
      (settings.value?.statConfigs as StatConfig[] | undefined) ??
      DEFAULT_STAT_CONFIGS
    const updatedConfigs = currentConfigs.map((config) =>
      config.id === args.statId ? {...config, visible: args.visible} : config,
    )

    await ctx.db.patch(settings._id, {
      value: {
        ...(settings.value ?? {}),
        statConfigs: updatedConfigs,
      },
      updatedAt: Date.now(),
    })

    return {success: true}
  },
})

/**
 * Update stat order
 */
export const updateStatOrder = mutation({
  args: {
    statConfigs: v.array(statConfigSchema),
  },
  handler: async (ctx, {statConfigs}) => {
    // Ensure statConfigs exist first
    let settings = await ctx.db
      .query('adminSettings')
      .withIndex('by_identifier', (q) => q.eq('identifier', 'statConfigs'))
      .unique()

    if (!settings) {
      // Check for legacy settings
      const legacySettings = await ctx.db.query('adminSettings').first()
      if (legacySettings) {
        await ctx.db.patch(legacySettings._id, {
          identifier: 'statConfigs',
        })
        settings = await safeGet(ctx.db, 'adminSettings', legacySettings._id)
      } else {
        // Create new settings
        const settingsId = await ctx.db.insert('adminSettings', {
          identifier: 'statConfigs',
          value: {statConfigs},
          updatedAt: Date.now(),
          createdAt: Date.now(),
        })
        settings = await safeGet(ctx.db, 'adminSettings', settingsId)
      }
    }

    if (!settings) {
      throw new Error('Failed to create settings')
    }

    await ctx.db.patch(settings._id, {
      value: {
        ...(settings.value ?? {}),
        statConfigs,
      },
      updatedAt: Date.now(),
    })

    return {success: true}
  },
})

/**
 * Update PayGate settings
 */
export const updatePayGateSettings = mutation({
  args: {
    paygate: paygateSettingsSchema,
  },
  handler: async (ctx, args) => {
    let settings = await ctx.db.query('adminSettings').first()

    if (!settings) {
      const settingsId = await ctx.db.insert('adminSettings', {
        value: {paygate: args.paygate},
        updatedAt: Date.now(),
      })
      settings = await safeGet(ctx.db, 'adminSettings', settingsId)
    } else {
      await ctx.db.patch(settings._id, {
        value: {
          ...(settings.value ?? {}),
          paygate: args.paygate,
        },
        updatedAt: Date.now(),
      })
    }

    return {success: true}
  },
})

/**
 * Update payment gateway configs (apiUrl, checkoutUrl per gateway, defaultGateway).
 * Syncs apiUrl/checkoutUrl to gateways table — canonical source for checkout URLs.
 */
export const updatePaymentGatewayConfigs = mutation({
  args: {
    configs: paymentGatewayConfigsSchema,
  },
  handler: async (ctx, {configs}) => {
    const settings = await ctx.db.query('adminSettings').first()
    const now = Date.now()

    if (!settings) {
      await ctx.db.insert('adminSettings', {
        value: {
          paygate: configs.paygate,
          paylex: configs.paylex,
          rampex: configs.rampex,
          defaultGateway: configs.defaultGateway,
        },
        updatedAt: now,
      })
      await syncGatewayUrlsToGateways(ctx, configs, now)
      return {success: true}
    }

    const current = settings.value ?? {}
    const nextPaygate =
      configs.paygate !== undefined
        ? {
            ...(current.paygate && typeof current.paygate === 'object'
              ? (current.paygate as Record<string, unknown>)
              : {}),
            ...configs.paygate,
          }
        : undefined
    const nextValue = {
      ...current,
      ...(nextPaygate !== undefined && {paygate: nextPaygate}),
      ...(configs.paylex !== undefined && {paylex: configs.paylex}),
      ...(configs.rampex !== undefined && {rampex: configs.rampex}),
      ...(configs.defaultGateway !== undefined && {
        defaultGateway: configs.defaultGateway,
      }),
    }

    await ctx.db.patch(settings._id, {
      value: nextValue,
      updatedAt: now,
    })

    await syncGatewayUrlsToGateways(ctx, configs, now)
    return {success: true}
  },
})

/** Sync apiUrl/checkoutUrl from admin configs to gateways table. */
async function syncGatewayUrlsToGateways(
  ctx: MutationCtx,
  configs: {
    paygate?: {apiUrl?: string; checkoutUrl?: string}
    paylex?: {apiUrl?: string; checkoutUrl?: string}
    rampex?: {apiUrl?: string; checkoutUrl?: string}
  },
  now: number,
): Promise<void> {
  const entries = [
    ['paygate', configs.paygate],
    ['paylex', configs.paylex],
    ['rampex', configs.rampex],
  ] as const
  for (const [gateway, cfg] of entries) {
    if (!cfg || (cfg.apiUrl === undefined && cfg.checkoutUrl === undefined))
      continue
    const doc = await ctx.db
      .query('gateways')
      .withIndex('by_gateway', (q) => q.eq('gateway', gateway))
      .first()
    if (doc) {
      const patch: Record<string, unknown> = {updatedAt: now}
      if (cfg.apiUrl !== undefined) patch.apiUrl = cfg.apiUrl
      if (cfg.checkoutUrl !== undefined) patch.checkoutUrl = cfg.checkoutUrl
      await ctx.db.patch(doc._id, patch)
    }
  }
}

/**
 * Seed IPAPI geolocation setting (idempotent - safe to call multiple times)
 * Creates the setting with enabled: false if it doesn't exist
 */
export const ensureIpapiGeolocationSeeded = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if ipapiGeolocation setting already exists
    const existing = await ctx.db
      .query('adminSettings')
      .withIndex('by_identifier', (q) => q.eq('identifier', 'ipapiGeolocation'))
      .unique()

    if (existing) {
      return {success: true, message: 'ipapiGeolocation setting already exists'}
    }

    // Create new setting with enabled: false
    await ctx.db.insert('adminSettings', {
      identifier: 'ipapiGeolocation',
      value: {enabled: false},
      updatedAt: Date.now(),
      createdAt: Date.now(),
      createdBy: 'ensureIpapiGeolocationSeeded',
    })

    return {success: true, message: 'Created new ipapiGeolocation setting'}
  },
})

/**
 * Update IPAPI geolocation enabled status
 */
export const updateIpapiGeolocationEnabled = mutation({
  args: {
    enabled: v.boolean(),
  },
  handler: async (ctx, {enabled}) => {
    const settings = await ctx.db
      .query('adminSettings')
      .withIndex('by_identifier', (q) => q.eq('identifier', 'ipapiGeolocation'))
      .unique()

    if (!settings) {
      // Create new setting if it doesn't exist
      await ctx.db.insert('adminSettings', {
        identifier: 'ipapiGeolocation',
        value: {enabled},
        updatedAt: Date.now(),
        createdAt: Date.now(),
        createdBy: 'updateIpapiGeolocationEnabled',
      })
    } else {
      // Update existing setting
      await ctx.db.patch(settings._id, {
        value: {
          ...(settings.value ?? {}),
          enabled,
        },
        updatedAt: Date.now(),
      })
    }

    return {success: true}
  },
})

/**
 * Update default gateway for identifier 'payment-gateway'
 */
export const updatePaymentGatewayDefault = mutation({
  args: {
    defaultGateway: v.union(
      v.literal('paygate'),
      v.literal('paylex'),
      v.literal('rampex'),
    ),
  },
  handler: async (ctx, {defaultGateway}) => {
    const setting = await ctx.db
      .query('adminSettings')
      .withIndex('by_identifier', (q) =>
        q.eq('identifier', 'payment-gateway'),
      )
      .unique()

    const now = Date.now()
    const nextValue = {
      ...(setting?.value && typeof setting.value === 'object'
        ? (setting.value as Record<string, unknown>)
        : {}),
      defaultGateway,
    }

    if (setting) {
      await ctx.db.patch(setting._id, {
        value: nextValue,
        updatedAt: now,
      })
    } else {
      await ctx.db.insert('adminSettings', {
        identifier: 'payment-gateway',
        value: nextValue,
        updatedAt: now,
        createdAt: now,
      })
    }

    return {success: true}
  },
})

export const updateAdminByIdentifier = mutation({
  args: {
    identifier: v.string(),
    value: v.any(),
    uid: v.string(),
  },
  handler: async (ctx, {identifier, value, uid}) => {
    const settings = await ctx.db
      .query('adminSettings')
      .withIndex('by_identifier', (q) => q.eq('identifier', identifier))
      .unique()

    if (!settings) {
      // Create new setting if it doesn't exist
      await ctx.db.insert('adminSettings', {
        identifier,
        value,
        updatedAt: Date.now(),
        createdAt: Date.now(),
        createdBy: uid,
      })
    } else {
      // Update existing setting
      await ctx.db.patch(settings._id, {
        value,
        updatedAt: Date.now(),
        updatedBy: uid,
      })
    }

    return {success: true}
  },
})

export const updateFireCollectionProducts = mutation({
  args: {
    productIds: v.array(v.string()),
    uid: v.optional(v.string()),
  },
  handler: async (ctx, {productIds, uid}) => {
    const setting = await ctx.db
      .query('adminSettings')
      .withIndex('by_identifier', (q) => q.eq('identifier', 'fireCollection'))
      .unique()

    const now = Date.now()
    const normalizedProductIds = Array.from(
      new Set(
        productIds
          .map((productId) => productId.trim())
          .filter((productId) => productId.length > 0),
      ),
    )

    const value = {productIds: normalizedProductIds}

    if (!setting) {
      await ctx.db.insert('adminSettings', {
        identifier: 'fireCollection',
        value,
        updatedAt: now,
        createdAt: now,
        createdBy: uid,
      })

      return {success: true}
    }

    await ctx.db.patch(setting._id, {
      value,
      updatedAt: now,
      updatedBy: uid,
    })

    return {success: true}
  },
})

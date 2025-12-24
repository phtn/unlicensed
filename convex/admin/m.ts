import {v} from 'convex/values'
import {mutation} from '../_generated/server'
import {paygateSettingsSchema, StatConfig, statConfigSchema} from './d'

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
 * Initialize or get admin settings
 */
export const getOrCreateAdminSettings = mutation({
  args: {uid: v.string()},
  handler: async (ctx, {uid}) => {
    // Check if statConfigs already exist
    let settings = await ctx.db
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
      return await ctx.db.get(legacySettings._id)
    }

    // Create new settings
    const settingsId = await ctx.db.insert('adminSettings', {
      identifier: 'statConfigs',
      value: {statConfigs: DEFAULT_STAT_CONFIGS},
      updatedAt: Date.now(),
      createdAt: Date.now(),
      createdBy: uid,
    })
    return await ctx.db.get(settingsId)
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
        settings = await ctx.db.get(legacySettings._id)
      } else {
        // Create new settings
        const updatedConfigs = DEFAULT_STAT_CONFIGS.map((config) =>
          config.id === args.statId ? {...config, visible: args.visible} : config,
        )
        const settingsId = await ctx.db.insert('adminSettings', {
          identifier: 'statConfigs',
          value: {statConfigs: updatedConfigs},
          updatedAt: Date.now(),
          createdAt: Date.now(),
        })
        settings = await ctx.db.get(settingsId)
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
        settings = await ctx.db.get(legacySettings._id)
      } else {
        // Create new settings
        const settingsId = await ctx.db.insert('adminSettings', {
          identifier: 'statConfigs',
          value: {statConfigs},
          updatedAt: Date.now(),
          createdAt: Date.now(),
        })
        settings = await ctx.db.get(settingsId)
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
      settings = await ctx.db.get(settingsId)
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
    let settings = await ctx.db
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

import {mutation} from '../_generated/server'
import {v} from 'convex/values'
import {statConfigSchema, paygateSettingsSchema} from './d'

const DEFAULT_STAT_CONFIGS = [
  {id: 'salesToday', label: 'Sales Today', visible: true, order: 0},
  {id: 'pendingOrders', label: 'Pending Orders', visible: true, order: 1},
  {id: 'deliveries', label: 'Deliveries', visible: true, order: 2},
  {id: 'totalRevenue', label: 'Total Revenue', visible: true, order: 3},
  {id: 'totalUsers', label: 'Total Users', visible: true, order: 4},
  {id: 'totalProducts', label: 'Total Products', visible: true, order: 5},
  {id: 'averageOrderValue', label: 'Average Order Value', visible: true, order: 6},
  {id: 'cancelledOrders', label: 'Cancelled Orders', visible: true, order: 7},
  {id: 'salesThisWeek', label: 'Sales This Week', visible: false, order: 8},
  {id: 'salesThisMonth', label: 'Sales This Month', visible: false, order: 9},
]

/**
 * Initialize or get admin settings
 */
export const getOrCreateAdminSettings = mutation({
  args: {},
  handler: async (ctx) => {
    let settings = await ctx.db.query('adminSettings').first()

    if (!settings) {
      const settingsId = await ctx.db.insert('adminSettings', {
        statConfigs: DEFAULT_STAT_CONFIGS,
        updatedAt: Date.now(),
      })
      settings = await ctx.db.get(settingsId)
    }

    return settings
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
    let settings = await ctx.db.query('adminSettings').first()

    if (!settings) {
      const settingsId = await ctx.db.insert('adminSettings', {
        statConfigs: DEFAULT_STAT_CONFIGS,
        updatedAt: Date.now(),
      })
      settings = await ctx.db.get(settingsId)
    }

    if (!settings) {
      throw new Error('Failed to create settings')
    }

    const updatedConfigs = settings.statConfigs.map((config) =>
      config.id === args.statId ? {...config, visible: args.visible} : config,
    )

    await ctx.db.patch(settings._id, {
      statConfigs: updatedConfigs,
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
  handler: async (ctx, args) => {
    let settings = await ctx.db.query('adminSettings').first()

    if (!settings) {
      const settingsId = await ctx.db.insert('adminSettings', {
        statConfigs: DEFAULT_STAT_CONFIGS,
        updatedAt: Date.now(),
      })
      settings = await ctx.db.get(settingsId)
    }

    if (!settings) {
      throw new Error('Failed to create settings')
    }

    await ctx.db.patch(settings._id, {
      statConfigs: args.statConfigs,
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
        statConfigs: DEFAULT_STAT_CONFIGS,
        paygate: args.paygate,
        updatedAt: Date.now(),
      })
      settings = await ctx.db.get(settingsId)
    } else {
      await ctx.db.patch(settings._id, {
        paygate: args.paygate,
        updatedAt: Date.now(),
      })
    }

    return {success: true}
  },
})



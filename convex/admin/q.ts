import {v} from 'convex/values'
import {query} from '../_generated/server'
import type {AdminSettings} from './d'

/**
 * Get admin settings
 */
export const getAdminSettings = query({
  args: {},
  handler: async (ctx): Promise<AdminSettings | null> => {
    const settings = await ctx.db.query('adminSettings').first()

    if (!settings) {
      // Return default configs if no settings exist yet
      return {
        value: {
          statsConfig: [
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
    const setting = await db
      .query('adminSettings')
      .withIndex('by_identifier', (q) => q.eq('identifier', identifier))
      .unique()

    if (setting) {
      return setting
    }

    // If not found by identifier, fall back to first adminSettings document
    // This handles the case where identifier field wasn't set on existing documents
    const fallbackAdmin = await db.query('adminSettings').first()

    if (fallbackAdmin) {
      return fallbackAdmin
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

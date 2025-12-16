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
        statConfigs: [
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
        paygate: undefined,
        updatedAt: Date.now(),
      }
    }

    return settings
  },
})



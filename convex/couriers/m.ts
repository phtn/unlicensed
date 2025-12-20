import {v} from 'convex/values'
import {mutation} from '../_generated/server'

export const createCourier = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    active: v.boolean(),
    trackingUrlTemplate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now()

    // Check if courier with this code already exists
    const existing = await ctx.db
      .query('couriers')
      .withIndex('by_code', (q) => q.eq('code', args.code))
      .unique()

    if (existing) {
      throw new Error('Courier with this code already exists')
    }

    const courierId = await ctx.db.insert('couriers', {
      name: args.name,
      code: args.code,
      active: args.active,
      trackingUrlTemplate: args.trackingUrlTemplate,
      createdAt: now,
      updatedAt: now,
    })

    return courierId
  },
})

export const updateCourier = mutation({
  args: {
    id: v.id('couriers'),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    active: v.optional(v.boolean()),
    trackingUrlTemplate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const {id, ...updates} = args

    // If code is being updated, check for conflicts
    if (updates.code !== undefined) {
      const existing = await ctx.db
        .query('couriers')
        .withIndex('by_code', (q) => q.eq('code', updates.code!))
        .unique()

      if (existing && existing._id !== id) {
        throw new Error('Courier with this code already exists')
      }
    }

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    })
  },
})

export const deleteCourier = mutation({
  args: {
    id: v.id('couriers'),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id)
  },
})


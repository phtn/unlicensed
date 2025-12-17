import {v} from 'convex/values'
import {mutation} from '../_generated/server'

export const createStaff = mutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
    position: v.string(),
    accessRoles: v.array(v.string()),
    active: v.boolean(),
    userId: v.optional(v.id('users')),
  },
  handler: async (ctx, args) => {
    const now = Date.now()

    // Check if staff with this email already exists
    const existing = await ctx.db
      .query('staff')
      .withIndex('by_email', (q) => q.eq('email', args.email))
      .unique()

    if (existing) {
      throw new Error('Staff with this email already exists')
    }

    const staffId = await ctx.db.insert('staff', {
      email: args.email,
      name: args.name,
      position: args.position,
      accessRoles: args.accessRoles,
      active: args.active,
      userId: args.userId,
      createdAt: now,
      updatedAt: now,
    })

    return staffId
  },
})

export const updateStaff = mutation({
  args: {
    id: v.id('staff'),
    name: v.optional(v.string()),
    position: v.optional(v.string()),
    accessRoles: v.optional(v.array(v.string())),
    active: v.optional(v.boolean()),
    userId: v.optional(v.id('users')),
  },
  handler: async (ctx, args) => {
    const {id, ...updates} = args

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    })
  },
})

export const deleteStaff = mutation({
  args: {
    id: v.id('staff'),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id)
  },
})

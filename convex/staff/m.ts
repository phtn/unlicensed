import {v} from 'convex/values'
import {mutation} from '../_generated/server'

export const createStaff = mutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
    position: v.string(),
    division: v.optional(v.string()),
    accessRoles: v.array(v.string()),
    active: v.boolean(),
    avatarUrl: v.optional(v.string()),
    userId: v.optional(v.id('users')),
    currentUserEmail: v.string(), // Email of the user creating the staff member
  },
  handler: async (ctx, args) => {
    // Check authorization: only admin or manager can create staff
    const currentUserStaff = await ctx.db
      .query('staff')
      .withIndex('by_email', (q) => q.eq('email', args.currentUserEmail))
      .unique()

    if (!currentUserStaff) {
      throw new Error('Unauthorized: You must be a staff member to create staff')
    }

    if (!currentUserStaff.active) {
      throw new Error('Unauthorized: Your staff account is inactive')
    }

    const hasAdminOrManagerRole =
      currentUserStaff.accessRoles.includes('admin') ||
      currentUserStaff.accessRoles.includes('manager')

    if (!hasAdminOrManagerRole) {
      throw new Error(
        'Unauthorized: Only admin or manager roles can create staff members',
      )
    }

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
      division: args.division,
      accessRoles: args.accessRoles,
      active: args.active,
      avatarUrl: args.avatarUrl,
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
    division: v.optional(v.string()),
    accessRoles: v.optional(v.array(v.string())),
    active: v.optional(v.boolean()),
    avatarUrl: v.optional(v.string()),
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

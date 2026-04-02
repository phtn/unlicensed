import {v} from 'convex/values'
import type {MutationCtx} from '../_generated/server'
import {mutation} from '../_generated/server'
import {findStaffByEmail, hasAdminAccessRole, normalizeStaffEmail} from './lib'

async function requireStaffAdminOrManager(
  ctx: MutationCtx,
  currentUserEmail: string,
) {
  const currentUserStaff = await findStaffByEmail(ctx, currentUserEmail)

  if (!currentUserStaff) {
    throw new Error('Unauthorized: You must be a staff member to manage staff')
  }

  if (!currentUserStaff.active) {
    throw new Error('Unauthorized: Your staff account is inactive')
  }

  const hasAdminOrManagerRole = hasAdminAccessRole(currentUserStaff.accessRoles)

  if (!hasAdminOrManagerRole) {
    throw new Error(
      'Unauthorized: Only admin or manager roles can manage staff members',
    )
  }

  return currentUserStaff
}

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
    await requireStaffAdminOrManager(ctx, args.currentUserEmail)
    const normalizedEmail = normalizeStaffEmail(args.email)

    if (!normalizedEmail) {
      throw new Error('Staff email is required')
    }

    const now = Date.now()

    // Check if staff with this email already exists
    const existing = await findStaffByEmail(ctx, normalizedEmail)

    if (existing) {
      throw new Error('Staff with this email already exists')
    }

    const staffId = await ctx.db.insert('staff', {
      email: normalizedEmail,
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
    currentUserEmail: v.string(),
    name: v.optional(v.string()),
    position: v.optional(v.string()),
    division: v.optional(v.string()),
    accessRoles: v.optional(v.array(v.string())),
    active: v.optional(v.boolean()),
    avatarUrl: v.optional(v.string()),
    userId: v.optional(v.id('users')),
  },
  handler: async (ctx, args) => {
    const {id, currentUserEmail, ...updates} = args

    await requireStaffAdminOrManager(ctx, currentUserEmail)

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    })
  },
})

export const deleteStaff = mutation({
  args: {
    id: v.id('staff'),
    currentUserEmail: v.string(),
  },
  handler: async (ctx, args) => {
    await requireStaffAdminOrManager(ctx, args.currentUserEmail)
    await ctx.db.delete(args.id)
  },
})

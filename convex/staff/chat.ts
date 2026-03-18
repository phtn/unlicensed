import type {Doc} from '../_generated/dataModel'
import type {MutationCtx} from '../_generated/server'

const getUserByEmail = async (ctx: MutationCtx, email: string) =>
  ctx.db
    .query('users')
    .withIndex('by_email', (q) => q.eq('email', email))
    .first()

const getPreferredStaffFid = (
  staff: Doc<'staff'>,
  user: Doc<'users'> | null,
) => {
  if (user?.firebaseId?.trim()) {
    return user.firebaseId.trim()
  }

  if (user?.fid?.trim()) {
    return user.fid.trim()
  }

  if (staff.email?.trim()) {
    return staff.email.trim().toLowerCase()
  }

  return null
}

export const resolveStaffChatUser = async (
  ctx: MutationCtx,
  staff: Doc<'staff'>,
) => {
  let staffUser =
    (staff.userId ? await ctx.db.get(staff.userId) : null) ??
    (staff.email ? await getUserByEmail(ctx, staff.email) : null)

  if (!staffUser && !staff.email) {
    throw new Error('Staff member does not have an email for chat setup')
  }

  if (!staffUser && staff.email) {
    const now = Date.now()
    const fallbackName =
      staff.name?.trim() || staff.email.split('@')[0] || 'Staff member'
    const normalizedEmail = staff.email.trim().toLowerCase()

    const staffUserId = await ctx.db.insert('users', {
      email: normalizedEmail,
      name: fallbackName,
      fid: normalizedEmail,
      ...(staff.avatarUrl ? {photoUrl: staff.avatarUrl} : {}),
      isActive: staff.active,
      createdAt: now,
      updatedAt: now,
    })

    if (staff.userId !== staffUserId) {
      await ctx.db.patch(staff._id, {
        userId: staffUserId,
        updatedAt: now,
      })
    }

    staffUser = await ctx.db.get(staffUserId)
  }

  if (!staffUser) {
    throw new Error('Staff member does not have a linked user account to chat')
  }

  const staffUserFid = getPreferredStaffFid(staff, staffUser)
  if (!staffUserFid) {
    throw new Error('Staff user has no chat identifier')
  }

  const nextUserUpdates: Partial<Doc<'users'>> = {}
  if (staffUser.fid !== staffUserFid) {
    nextUserUpdates.fid = staffUserFid
  }
  if (staffUser.email !== staff.email && staff.email) {
    nextUserUpdates.email = staff.email.trim().toLowerCase()
  }
  if (!staffUser.name?.trim() && staff.name?.trim()) {
    nextUserUpdates.name = staff.name.trim()
  }
  if (!staffUser.photoUrl && staff.avatarUrl) {
    nextUserUpdates.photoUrl = staff.avatarUrl
  }
  if (staffUser.isActive !== staff.active) {
    nextUserUpdates.isActive = staff.active
  }

  if (Object.keys(nextUserUpdates).length > 0) {
    await ctx.db.patch(staffUser._id, {
      ...nextUserUpdates,
      updatedAt: Date.now(),
    })
    staffUser = (await ctx.db.get(staffUser._id)) ?? staffUser
  }

  if (staff.userId !== staffUser._id) {
    await ctx.db.patch(staff._id, {
      userId: staffUser._id,
      updatedAt: Date.now(),
    })
  }

  return {
    user: staffUser,
    fid: staffUserFid,
  }
}

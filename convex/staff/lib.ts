import type { Doc } from '../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../_generated/server'

type StaffDbCtx = Pick<QueryCtx, 'db'> | Pick<MutationCtx, 'db'>

const ADMIN_PANEL_ROLES = new Set(['admin', 'manager', 'sysadmin'])

export function normalizeStaffEmail(
  email: string | null | undefined,
): string | null {
  const normalized = email?.trim().toLowerCase()
  return normalized ? normalized : null
}

export function hasAdminAccessRole(
  accessRoles?: readonly string[] | null,
): boolean {
  if (!accessRoles?.length) return false

  return accessRoles.some((role) =>
    ADMIN_PANEL_ROLES.has(role.trim().toLowerCase()),
  )
}

export async function findStaffByEmail(
  ctx: StaffDbCtx,
  email: string | null | undefined,
): Promise<Doc<'staff'> | null> {
  const normalizedEmail = normalizeStaffEmail(email)
  if (!normalizedEmail) return null

  const exactMatch = await ctx.db
    .query('staff')
    .withIndex('by_email', (q) => q.eq('email', normalizedEmail))
    .unique()

  if (exactMatch) {
    return exactMatch
  }

  const staffMembers = await ctx.db.query('staff').collect()
  return (
    staffMembers.find(
      (staff) => normalizeStaffEmail(staff.email) === normalizedEmail,
    ) ?? null
  )
}

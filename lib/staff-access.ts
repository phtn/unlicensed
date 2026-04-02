type StaffLike =
  | {
      active?: boolean | null
      accessRoles?: readonly string[] | null
    }
  | null
  | undefined

const ADMIN_PANEL_ROLES = new Set(['admin', 'manager', 'sysadmin'])

export function hasAdminAccessRole(
  accessRoles?: readonly string[] | null,
): boolean {
  if (!accessRoles?.length) return false

  return accessRoles.some((role) =>
    ADMIN_PANEL_ROLES.has(role.trim().toLowerCase()),
  )
}

export function isActiveStaffMember(staff: StaffLike): boolean {
  return !!staff?.active
}

export function canAccessAdminPanel(staff: StaffLike): boolean {
  return isActiveStaffMember(staff) && hasAdminAccessRole(staff?.accessRoles)
}

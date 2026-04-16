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

// ---------------------------------------------------------------------------
// Fine-grained permission matrix
// ---------------------------------------------------------------------------

/**
 * All discrete permissions in the system.
 * Add new permissions here as features are gated.
 */
export type StaffPermission =
  | 'manage_staff'        // create, update, deactivate staff records
  | 'manage_users'        // view and edit customer records (notes, wholesale, etc.)
  | 'manage_orders'       // update order status, assign deliveries
  | 'manage_products'     // create, edit, archive products and inventory
  | 'manage_settings'     // system-wide admin settings (paygate, rewards config, etc.)
  | 'manage_emails'       // trigger and monitor email blasts
  | 'view_reports'        // access analytics and stats dashboards

/**
 * Maps each staff role to the permissions it grants.
 * A role grants the union of all listed permissions.
 *
 * Roles are not hierarchical — each is defined independently so permissions
 * can be adjusted per role without affecting others.
 */
export const ROLE_PERMISSIONS: Record<string, readonly StaffPermission[]> = {
  admin: [
    'manage_staff',
    'manage_users',
    'manage_orders',
    'manage_products',
    'manage_settings',
    'manage_emails',
    'view_reports',
  ],
  manager: [
    'manage_users',
    'manage_orders',
    'manage_products',
    'manage_emails',
    'view_reports',
  ],
  sysadmin: [
    'manage_staff',
    'manage_settings',
    'view_reports',
  ],
  supervisor: [
    'manage_orders',
    'view_reports',
  ],
  developer: [
    'manage_settings',
    'view_reports',
  ],
  courier: [
    'manage_orders',
  ],
  staff: [
    'manage_orders',
    'view_reports',
  ],
  viewer: [
    'view_reports',
  ],
}

/**
 * Returns true if any of the given access roles grants the requested permission.
 */
export function hasPermission(
  accessRoles: readonly string[] | null | undefined,
  permission: StaffPermission,
): boolean {
  if (!accessRoles?.length) return false

  return accessRoles.some((role) => {
    const granted = ROLE_PERMISSIONS[role.trim().toLowerCase()]
    return granted?.includes(permission) ?? false
  })
}

/**
 * Returns the full set of permissions granted by the given access roles.
 */
export function getPermissions(
  accessRoles: readonly string[] | null | undefined,
): Set<StaffPermission> {
  const result = new Set<StaffPermission>()
  if (!accessRoles?.length) return result

  for (const role of accessRoles) {
    const granted = ROLE_PERMISSIONS[role.trim().toLowerCase()]
    granted?.forEach((p) => result.add(p))
  }

  return result
}

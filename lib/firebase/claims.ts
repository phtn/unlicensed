/**
 * Firebase Custom Claims — canonical type definitions and helpers.
 *
 * This file is server-only. Never import it in client components.
 *
 * Byte budget: worst-case fully-populated claims object is ~145 bytes,
 * well within Firebase's 1000-byte limit on custom claims JSON.
 *
 * Claim lifecycle:
 *   `admin`  — ONLY set/revoked via Master Monitor (OG or TOP-G masters)
 *   `staff`  — set via /api/admin/staff/[staffId]/sync-claims
 *   `bulk`   — set when users.wholesale is toggled by a staff admin
 */

export interface FirebaseCustomClaims {
  /**
   * Super-admin gate.
   * Can ONLY be set or revoked via the Master Monitor admin-claim endpoint.
   * Presence of this key grants access to Master Monitor and top-level admin APIs.
   */
  admin?: true

  /**
   * Staff identity snapshot.
   * Mirrors the Convex `staff` record for fast server-side routing decisions.
   * The Convex staff record remains the source of truth — re-sync when it changes.
   */
  staff?: {
    /** Mirrors staff.accessRoles (e.g. ['admin', 'editor', 'viewer']) */
    roles: string[]
    /** Mirrors staff.position */
    position?: string
    /** Mirrors staff.division */
    division?: string
    /** Mirrors staff.active — false when a staff member is deactivated */
    active: boolean
  }

  /**
   * Bulk/wholesale pricing access.
   * Mirrors the Convex users.wholesale field.
   */
  bulk?: true
}

/**
 * Claim keys that cannot be set via the generic /api/admin/users/[uid]/claims endpoint.
 * These must be managed through their dedicated endpoints.
 */
export const PROTECTED_CLAIM_KEYS: ReadonlySet<string> = new Set(['admin'])

/**
 * Build the `staff` sub-object for a Firebase custom claims update
 * from a Convex staff record shape.
 */
export function buildStaffClaims(staff: {
  accessRoles: string[]
  position: string
  division?: string | null
  active: boolean
}): NonNullable<FirebaseCustomClaims['staff']> {
  return {
    roles: staff.accessRoles,
    position: staff.position || undefined,
    division: staff.division ?? undefined,
    active: staff.active,
  }
}

/**
 * Merge a patch (everything except `admin`) into existing claims.
 * The `admin` key from existing claims is always preserved as-is.
 * The caller is never allowed to set `admin` via this helper.
 */
export function mergeFirebaseClaims(
  existing: Record<string, unknown>,
  patch: Omit<FirebaseCustomClaims, 'admin'>,
): FirebaseCustomClaims {
  const {admin, ...rest} = existing as FirebaseCustomClaims

  const merged: FirebaseCustomClaims = {...rest, ...patch}

  // Always carry forward the admin flag if it was already set
  if (admin === true) {
    merged.admin = true
  }

  return merged
}

/**
 * Type-safe check for whether a claims object carries admin: true.
 */
export function isAdminClaim(claims: unknown): boolean {
  if (!claims || typeof claims !== 'object') return false
  return (claims as Record<string, unknown>)['admin'] === true
}

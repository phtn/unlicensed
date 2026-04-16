import {getAdminAuth} from '@/lib/firebase/admin'
import {PROTECTED_CLAIM_KEYS} from '@/lib/firebase/claims'
import {requireStaffAdminRequest} from '@/lib/firebase/server-auth'
import {NextRequest, NextResponse} from 'next/server'

/**
 * API Route to set custom claims for a Firebase user
 *
 * POST /api/admin/users/[uid]/claims
 * Body: { claims: { role?: string, bulk?: boolean, ... } }
 *
 * Requires a verified Firebase server session or bearer token for an active
 * staff member with admin access.
 *
 * NOTE: Protected claim keys (e.g. `admin`) cannot be set via this endpoint.
 * Use the dedicated Master Monitor endpoint for those.
 */
export async function POST(
  request: NextRequest,
  {params}: {params: Promise<{uid: string}>},
) {
  try {
    const auth = await requireStaffAdminRequest(request)
    if (!auth.ok) return auth.response

    const {uid} = await params
    const body = await request.json()
    const {claims} = body

    if (!uid) {
      return NextResponse.json({error: 'User ID is required'}, {status: 400})
    }

    if (!claims || typeof claims !== 'object') {
      return NextResponse.json(
        {error: 'Claims object is required'},
        {status: 400},
      )
    }

    // Reject any attempt to set protected claims via this generic endpoint
    const protectedKeys = [...PROTECTED_CLAIM_KEYS].filter((key) => key in claims)
    if (protectedKeys.length > 0) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: `Protected claims [${protectedKeys.join(', ')}] can only be managed via the Master Monitor settings.`,
          protectedKeys,
        },
        {status: 403},
      )
    }

    const adminAuth = getAdminAuth()

    // Read-modify-write: preserve existing claims (including protected ones)
    const existingUser = await adminAuth.getUser(uid)
    const existingClaims = (existingUser.customClaims ?? {}) as Record<string, unknown>

    // Merge patch into existing, never overwriting protected keys from existing
    const protectedExisting: Record<string, unknown> = {}
    for (const key of PROTECTED_CLAIM_KEYS) {
      if (key in existingClaims) {
        protectedExisting[key] = existingClaims[key]
      }
    }

    await adminAuth.setCustomUserClaims(uid, {
      ...existingClaims,
      ...claims,
      ...protectedExisting, // protected keys always win
    })

    const updated = await adminAuth.getUser(uid)

    return NextResponse.json({
      success: true,
      uid,
      customClaims: updated.customClaims,
    })
  } catch (error) {
    console.error('Error setting custom claims:', error)
    return NextResponse.json(
      {
        error: 'Failed to set custom claims',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      {status: 500},
    )
  }
}

/**
 * GET /api/admin/users/[uid]/claims
 * Get current custom claims for a user
 */
export async function GET(
  request: NextRequest,
  {params}: {params: Promise<{uid: string}>},
) {
  try {
    const auth = await requireStaffAdminRequest(request)
    if (!auth.ok) return auth.response

    const {uid} = await params

    if (!uid) {
      return NextResponse.json({error: 'User ID is required'}, {status: 400})
    }

    const adminAuth = getAdminAuth()
    const user = await adminAuth.getUser(uid)

    return NextResponse.json({
      uid,
      customClaims: user.customClaims || {},
    })
  } catch (error) {
    console.error('Error getting custom claims:', error)
    return NextResponse.json(
      {
        error: 'Failed to get custom claims',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      {status: 500},
    )
  }
}

/**
 * DELETE /api/admin/users/[uid]/claims
 * Remove all non-protected custom claims from a user.
 *
 * NOTE: Cannot be used on users who have `admin: true` — revoke admin first
 * via the Master Monitor before clearing other claims.
 */
export async function DELETE(
  request: NextRequest,
  {params}: {params: Promise<{uid: string}>},
) {
  try {
    const auth = await requireStaffAdminRequest(request)
    if (!auth.ok) return auth.response

    const {uid} = await params

    if (!uid) {
      return NextResponse.json({error: 'User ID is required'}, {status: 400})
    }

    const adminAuth = getAdminAuth()

    // Read existing claims before wiping
    const existingUser = await adminAuth.getUser(uid)
    const existingClaims = (existingUser.customClaims ?? {}) as Record<string, unknown>

    // Refuse to wipe claims if protected keys are present
    const presentProtectedKeys = [...PROTECTED_CLAIM_KEYS].filter(
      (key) => existingClaims[key] !== undefined,
    )
    if (presentProtectedKeys.length > 0) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: `Cannot bulk-clear claims while protected claims [${presentProtectedKeys.join(', ')}] are set. Revoke those via the Master Monitor first.`,
          protectedKeys: presentProtectedKeys,
        },
        {status: 403},
      )
    }

    await adminAuth.setCustomUserClaims(uid, {})

    return NextResponse.json({
      success: true,
      uid,
      message: 'Custom claims removed',
    })
  } catch (error) {
    console.error('Error removing custom claims:', error)
    return NextResponse.json(
      {
        error: 'Failed to remove custom claims',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      {status: 500},
    )
  }
}

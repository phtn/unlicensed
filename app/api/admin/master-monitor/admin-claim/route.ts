import {api} from '@/convex/_generated/api'
import {getAdminAuth} from '@/lib/firebase/admin'
import {requireFirebaseRequestAuth} from '@/lib/firebase/server-auth'
import {
  canAccessMasterMonitor,
  getMasterMonitorEntries,
  getMasterMonitorEmails,
  getMasterTypeForEmail,
  MASTER_MONITOR_IDENTIFIER,
  type MasterType,
} from '@/lib/master-monitor-access'
import {ConvexHttpClient} from 'convex/browser'
import {NextRequest, NextResponse} from 'next/server'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

/**
 * Admin Claims — dedicated endpoint for managing `admin: true` Firebase custom claim.
 *
 * Access: Master Monitor members only (OG or TOP-G master type).
 * SB masters have read access to the Master Monitor UI but cannot modify admin claims.
 *
 * GET  /api/admin/master-monitor/admin-claim
 *      List all Firebase users that currently have `admin: true` claim.
 *
 * POST /api/admin/master-monitor/admin-claim
 *      Body: { uid: string }  — grant `admin: true` to a Firebase user.
 *      Accepts a Firebase UID or an email address (resolved server-side).
 *
 * DELETE /api/admin/master-monitor/admin-claim
 *        Body: { uid: string }  — revoke `admin` claim from a Firebase user.
 */

type AdminClaimAuthResult =
  | {ok: true; actorEmail: string; actorType: MasterType}
  | {ok: false; response: NextResponse}

async function requireAdminClaimEditor(
  request: NextRequest,
): Promise<AdminClaimAuthResult> {
  const requestAuth = await requireFirebaseRequestAuth(request)
  if (!requestAuth.ok) return requestAuth

  const email = requestAuth.user.email?.trim().toLowerCase()
  if (!email) {
    return {
      ok: false,
      response: NextResponse.json({error: 'Unauthorized'}, {status: 401}),
    }
  }

  const [masterMonitorSetting, staff] = await Promise.all([
    convex.query(api.admin.q.getAdminByIdentifier, {
      identifier: MASTER_MONITOR_IDENTIFIER,
    }),
    convex.query(api.staff.q.getStaffByEmail, {email}),
  ])

  const masterEntries = getMasterMonitorEntries(masterMonitorSetting)
  const masterEmails = getMasterMonitorEmails(masterMonitorSetting)

  if (!canAccessMasterMonitor({staff, email, masterEmails})) {
    return {
      ok: false,
      response: NextResponse.json(
        {error: 'Only active master staff can manage admin claims.'},
        {status: 403},
      ),
    }
  }

  const actorType = getMasterTypeForEmail(email, masterEntries)
  if (actorType === 'SB' || actorType === null) {
    return {
      ok: false,
      response: NextResponse.json(
        {error: 'Only OG and TOP-G masters can manage admin claims.'},
        {status: 403},
      ),
    }
  }

  return {ok: true, actorEmail: email, actorType}
}

/**
 * Resolve a Firebase user by UID or email.
 * Always tries UID lookup first (Firebase UIDs are arbitrary strings and can
 * contain '@'). Falls back to email lookup only when the UID attempt returns
 * a "user-not-found" error AND the input contains '@'.
 */
async function resolveFirebaseUser(uidOrEmail: string) {
  const adminAuth = getAdminAuth()
  const input = uidOrEmail.trim()

  try {
    return await adminAuth.getUser(input)
  } catch (err: unknown) {
    const code =
      err && typeof err === 'object' && 'code' in err
        ? (err as {code: string}).code
        : null

    // Only fall back to email if the UID was genuinely not found and the
    // input looks like an email address
    if (code === 'auth/user-not-found' && input.includes('@')) {
      return adminAuth.getUserByEmail(input.toLowerCase())
    }

    throw err
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminClaimEditor(request)
    if (!auth.ok) return auth.response

    const adminAuth = getAdminAuth()
    const adminUsers: Array<{uid: string; email: string | undefined}> = []
    let pageToken: string | undefined

    do {
      const result = await adminAuth.listUsers(1000, pageToken)
      for (const firebaseUser of result.users) {
        const claims = firebaseUser.customClaims as
          | Record<string, unknown>
          | undefined
        if (claims?.admin === true) {
          adminUsers.push({uid: firebaseUser.uid, email: firebaseUser.email})
        }
      }
      pageToken = result.pageToken
    } while (pageToken)

    return NextResponse.json({adminUsers})
  } catch (error) {
    console.error('Error listing admin claim users:', error)
    return NextResponse.json(
      {
        error: 'Failed to list admin claim users',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      {status: 500},
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminClaimEditor(request)
    if (!auth.ok) return auth.response

    const body = await request.json().catch(() => null)
    const uidOrEmail: unknown = body?.uid

    if (typeof uidOrEmail !== 'string' || !uidOrEmail.trim()) {
      return NextResponse.json(
        {error: 'uid (or email) is required'},
        {status: 400},
      )
    }

    const targetUser = await resolveFirebaseUser(uidOrEmail)
    const existingClaims = (targetUser.customClaims ?? {}) as Record<
      string,
      unknown
    >

    await getAdminAuth().setCustomUserClaims(targetUser.uid, {
      ...existingClaims,
      admin: true,
    })

    return NextResponse.json({
      success: true,
      uid: targetUser.uid,
      email: targetUser.email,
      admin: true,
    })
  } catch (error) {
    console.error('Error granting admin claim:', error)
    return NextResponse.json(
      {
        error: 'Failed to grant admin claim',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      {status: 500},
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdminClaimEditor(request)
    if (!auth.ok) return auth.response

    const body = await request.json().catch(() => null)
    const uidOrEmail: unknown = body?.uid

    if (typeof uidOrEmail !== 'string' || !uidOrEmail.trim()) {
      return NextResponse.json(
        {error: 'uid (or email) is required'},
        {status: 400},
      )
    }

    const targetUser = await resolveFirebaseUser(uidOrEmail)
    const existingClaims = (targetUser.customClaims ?? {}) as Record<
      string,
      unknown
    >

    // Destructure out admin, preserve everything else
    const {admin: _removed, ...remainingClaims} = existingClaims
    await getAdminAuth().setCustomUserClaims(targetUser.uid, remainingClaims)

    return NextResponse.json({
      success: true,
      uid: targetUser.uid,
      email: targetUser.email,
      admin: false,
    })
  } catch (error) {
    console.error('Error revoking admin claim:', error)
    return NextResponse.json(
      {
        error: 'Failed to revoke admin claim',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      {status: 500},
    )
  }
}

import {api} from '@/convex/_generated/api'
import {requireFirebaseRequestAuth} from '@/lib/firebase/server-auth'
import {
  canAccessMasterMonitor,
  getMasterMonitorEntries,
  getMasterMonitorEmails,
  getMasterRosterChangeAuthorization,
  MASTER_MONITOR_IDENTIFIER,
  serializeMasterMonitorEntries,
  type MasterEntry,
} from '@/lib/master-monitor-access'
import {ConvexHttpClient} from 'convex/browser'
import {NextRequest, NextResponse} from 'next/server'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

type AuthResult =
  | {ok: true; email: string; uid: string; currentEntries: MasterEntry[]}
  | {ok: false; response: NextResponse}

async function requireAuthorizedMasterEditor(
  request: NextRequest,
): Promise<AuthResult> {
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
  const currentEntries = getMasterMonitorEntries(masterMonitorSetting)
  const masterEmails = getMasterMonitorEmails(masterMonitorSetting)

  if (!canAccessMasterMonitor({staff, email, masterEmails})) {
    return {
      ok: false,
      response: NextResponse.json(
        {error: 'Only active master staff can manage this roster.'},
        {status: 403},
      ),
    }
  }

  return {ok: true, email, uid: requestAuth.user.uid, currentEntries}
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthorizedMasterEditor(request)
    if (!auth.ok) return auth.response

    const body = (await request.json().catch(() => null)) as
      | {
          masters?: unknown
        }
      | null

    if (!body || !Array.isArray(body.masters)) {
      return NextResponse.json(
        {error: 'Masters array is required.'},
        {status: 400},
      )
    }

    const masters = serializeMasterMonitorEntries(body.masters as MasterEntry[])
    const nextEntries = getMasterMonitorEntries({
      value: {masters},
    })
    const authorization = getMasterRosterChangeAuthorization({
      actorEmail: auth.email,
      currentEntries: auth.currentEntries,
      nextEntries,
    })

    if (!authorization.allowed) {
      return NextResponse.json(
        {
          error: authorization.reason || 'You do not have permission to make that change.',
        },
        {status: 403},
      )
    }

    await convex.mutation(api.admin.m.updateAdminByIdentifier, {
      identifier: MASTER_MONITOR_IDENTIFIER,
      value: {masters},
      uid: auth.uid,
    })

    return NextResponse.json({
      success: true,
      masters: nextEntries,
    })
  } catch (error) {
    console.error('Failed to update master monitor settings:', error)
    return NextResponse.json(
      {
        error: 'Failed to update master monitor settings.',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      {status: 500},
    )
  }
}

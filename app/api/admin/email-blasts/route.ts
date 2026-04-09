import {api} from '@/convex/_generated/api'
import {getAdminAuth} from '@/lib/firebase/admin'
import {canAccessAdminPanel} from '@/lib/staff-access'
import {ConvexHttpClient} from 'convex/browser'
import {NextRequest, NextResponse} from 'next/server'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

type AuthResult =
  | {ok: true; email: string; uid: string}
  | {ok: false; response: NextResponse}

function getBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return null
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length).trim() || null
  }
  return authHeader.trim() || null
}

async function requireStaffAdmin(request: NextRequest): Promise<AuthResult> {
  const token = getBearerToken(request)
  if (!token) {
    return {
      ok: false,
      response: NextResponse.json({error: 'Unauthorized'}, {status: 401}),
    }
  }

  const adminAuth = getAdminAuth()
  const decoded = await adminAuth.verifyIdToken(token)
  const email = decoded.email?.trim().toLowerCase()

  if (!email) {
    return {
      ok: false,
      response: NextResponse.json({error: 'Unauthorized'}, {status: 401}),
    }
  }

  const staff = await convex.query(api.staff.q.getStaffByEmail, {email})
  if (!canAccessAdminPanel(staff)) {
    return {
      ok: false,
      response: NextResponse.json({error: 'Forbidden'}, {status: 403}),
    }
  }

  return {ok: true, email, uid: decoded.uid}
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireStaffAdmin(request)
    if (!auth.ok) return auth.response

    const body = (await request.json().catch(() => null)) as
      | {
          emailSettingId?: unknown
          mailingListId?: unknown
        }
      | null

    if (
      !body ||
      typeof body.emailSettingId !== 'string' ||
      typeof body.mailingListId !== 'string'
    ) {
      return NextResponse.json(
        {error: 'emailSettingId and mailingListId are required.'},
        {status: 400},
      )
    }

    const blastId = await convex.mutation(api.emailBlasts.m.start, {
      emailSettingId: body.emailSettingId as never,
      mailingListId: body.mailingListId as never,
      initiatedByUid: auth.uid,
      initiatedByEmail: auth.email,
    })

    return NextResponse.json({
      success: true,
      blastId,
    })
  } catch (error) {
    console.error('Failed to start email blast:', error)
    return NextResponse.json(
      {
        error: 'Failed to start email blast.',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      {status: 500},
    )
  }
}

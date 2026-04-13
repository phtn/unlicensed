import {api} from '@/convex/_generated/api'
import {requireStaffAdminRequest} from '@/lib/firebase/server-auth'
import {ConvexHttpClient} from 'convex/browser'
import {NextRequest, NextResponse} from 'next/server'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export async function POST(request: NextRequest) {
  try {
    const auth = await requireStaffAdminRequest(request)
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

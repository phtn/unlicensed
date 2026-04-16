import {api} from '@/convex/_generated/api'
import type {Id} from '@/convex/_generated/dataModel'
import {getAdminAuth} from '@/lib/firebase/admin'
import {buildStaffClaims, mergeFirebaseClaims} from '@/lib/firebase/claims'
import {requireStaffAdminRequest} from '@/lib/firebase/server-auth'
import {ConvexHttpClient} from 'convex/browser'
import {NextRequest, NextResponse} from 'next/server'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

/**
 * POST /api/admin/staff/[staffId]/sync-claims
 *
 * On-demand sync of a Convex staff record's role data into Firebase custom claims.
 * Reads the staff record, resolves the linked Firebase user by email, then merges
 * { staff: { roles, position, division, active } } into that user's existing claims.
 *
 * The `admin` claim is never touched — it can only be set/revoked via Master Monitor.
 *
 * Requires an active staff member with admin access.
 */
export async function POST(
  request: NextRequest,
  {params}: {params: Promise<{staffId: string}>},
) {
  try {
    const auth = await requireStaffAdminRequest(request)
    if (!auth.ok) return auth.response

    const {staffId} = await params

    if (!staffId) {
      return NextResponse.json({error: 'staffId is required'}, {status: 400})
    }

    // Fetch the staff record from Convex
    const staffRecord = await convex.query(api.staff.q.getStaffMember, {
      id: staffId as Id<'staff'>,
    })

    if (!staffRecord) {
      return NextResponse.json({error: 'Staff record not found'}, {status: 404})
    }

    if (!staffRecord.email) {
      return NextResponse.json(
        {
          error: 'Staff record has no email address',
          message: 'An email address is required to resolve the Firebase user.',
        },
        {status: 422},
      )
    }

    const adminAuth = getAdminAuth()

    let firebaseUser
    try {
      firebaseUser = await adminAuth.getUserByEmail(
        staffRecord.email.trim().toLowerCase(),
      )
    } catch {
      return NextResponse.json(
        {
          error: 'Firebase user not found',
          message: `No Firebase user found for email: ${staffRecord.email}`,
        },
        {status: 404},
      )
    }

    const existingClaims = (firebaseUser.customClaims ?? {}) as Record<
      string,
      unknown
    >

    const staffClaims = buildStaffClaims({
      accessRoles: staffRecord.accessRoles,
      position: staffRecord.position,
      division: staffRecord.division,
      active: staffRecord.active,
    })

    const mergedClaims = mergeFirebaseClaims(existingClaims, {
      staff: staffClaims,
    })

    await adminAuth.setCustomUserClaims(firebaseUser.uid, mergedClaims)

    return NextResponse.json({
      success: true,
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      customClaims: mergedClaims,
    })
  } catch (error) {
    console.error('Error syncing staff claims:', error)
    return NextResponse.json(
      {
        error: 'Failed to sync staff claims',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      {status: 500},
    )
  }
}

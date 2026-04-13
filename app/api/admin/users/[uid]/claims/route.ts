import {getAdminAuth} from '@/lib/firebase/admin'
import {requireStaffAdminRequest} from '@/lib/firebase/server-auth'
import {NextRequest, NextResponse} from 'next/server'

/**
 * API Route to set custom claims for a Firebase user
 *
 * POST /api/admin/users/[uid]/claims
 * Body: { claims: { role?: string, admin?: boolean, ... } }
 *
 * Requires a verified Firebase server session or bearer token for an active
 * staff member.
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

    const adminAuth = getAdminAuth()

    // Set custom claims
    await adminAuth.setCustomUserClaims(uid, claims)

    // Get updated user to verify
    const user = await adminAuth.getUser(uid)

    return NextResponse.json({
      success: true,
      uid,
      customClaims: user.customClaims,
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
 * Remove all custom claims from a user
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

    // Remove all custom claims by setting an empty object
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

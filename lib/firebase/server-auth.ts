import 'server-only'

import {api} from '@/convex/_generated/api'
import {canAccessAdminPanel} from '@/lib/staff-access'
import {ConvexHttpClient} from 'convex/browser'
import type {DecodedIdToken} from 'firebase-admin/auth'
import {cookies} from 'next/headers'
import type {NextRequest} from 'next/server'
import {NextResponse} from 'next/server'
import {getFirebaseAdminAuth} from './admin'
import {firebaseSessionCookieName} from './session'

export type FirebaseServerUser = DecodedIdToken

export type FirebaseRequestAuthResult =
  | {ok: true; user: FirebaseServerUser}
  | {ok: false; response: NextResponse}

export type FirebaseStaffAuthResult =
  | {ok: true; email: string; uid: string; user: FirebaseServerUser}
  | {ok: false; response: NextResponse}

export type FirebaseStaffServerSession = {
  email: string
  uid: string
  user: FirebaseServerUser
}

function getConvexHttpClient() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL ?? process.env.CONVEX_URL

  if (!convexUrl) {
    throw new Error('Convex URL is not configured.')
  }

  return new ConvexHttpClient(convexUrl)
}

function getBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return null

  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length).trim() || null
  }

  return authHeader.trim() || null
}

function unauthorizedResponse() {
  return NextResponse.json({error: 'Unauthorized'}, {status: 401})
}

function serverAuthUnavailableResponse() {
  return NextResponse.json(
    {error: 'Firebase Admin credentials are not configured.'},
    {status: 500},
  )
}

async function verifyFirebaseIdToken(
  idToken: string,
): Promise<FirebaseServerUser | null> {
  const auth = getFirebaseAdminAuth()

  if (!auth) {
    throw new Error('Firebase Admin credentials are not configured.')
  }

  try {
    return await auth.verifyIdToken(idToken, true)
  } catch {
    return null
  }
}

export async function verifyFirebaseSessionCookie(
  sessionCookie: string,
): Promise<FirebaseServerUser | null> {
  const auth = getFirebaseAdminAuth()

  if (!auth) {
    throw new Error('Firebase Admin credentials are not configured.')
  }

  try {
    return await auth.verifySessionCookie(sessionCookie, true)
  } catch {
    return null
  }
}

export async function getFirebaseServerSession(): Promise<FirebaseServerUser | null> {
  const store = await cookies()
  const sessionCookie = store.get(firebaseSessionCookieName)?.value

  if (!sessionCookie) {
    return null
  }

  return verifyFirebaseSessionCookie(sessionCookie)
}

export async function requireFirebaseRequestAuth(
  request: NextRequest,
): Promise<FirebaseRequestAuthResult> {
  const auth = getFirebaseAdminAuth()

  if (!auth) {
    return {ok: false, response: serverAuthUnavailableResponse()}
  }

  const bearerToken = getBearerToken(request)
  const sessionCookie = request.cookies.get(firebaseSessionCookieName)?.value

  if (!bearerToken && !sessionCookie) {
    return {ok: false, response: unauthorizedResponse()}
  }

  try {
    const user = bearerToken
      ? await auth.verifyIdToken(bearerToken, true)
      : await auth.verifySessionCookie(sessionCookie!, true)

    return {ok: true, user}
  } catch {
    return {ok: false, response: unauthorizedResponse()}
  }
}

export async function requireStaffAdminRequest(
  request: NextRequest,
): Promise<FirebaseStaffAuthResult> {
  const auth = await requireFirebaseRequestAuth(request)

  if (!auth.ok) {
    return auth
  }

  const email = auth.user.email?.trim().toLowerCase()

  if (!email) {
    return {ok: false, response: unauthorizedResponse()}
  }

  const staff = await getConvexHttpClient().query(api.staff.q.getStaffByEmail, {
    email,
  })

  if (!canAccessAdminPanel(staff)) {
    return {
      ok: false,
      response: NextResponse.json({error: 'Forbidden'}, {status: 403}),
    }
  }

  return {ok: true, email, uid: auth.user.uid, user: auth.user}
}

export async function getFirebaseStaffServerSession(): Promise<FirebaseStaffServerSession | null> {
  const user = await getFirebaseServerSession()
  const email = user?.email?.trim().toLowerCase()

  if (!user || !email) {
    return null
  }

  const staff = await getConvexHttpClient().query(api.staff.q.getStaffByEmail, {
    email,
  })

  if (!canAccessAdminPanel(staff)) {
    return null
  }

  return {email, uid: user.uid, user}
}

export async function getVerifiedFirebaseIdToken(
  idToken: string,
): Promise<FirebaseServerUser | null> {
  return verifyFirebaseIdToken(idToken)
}

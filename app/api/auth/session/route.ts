import {getFirebaseAdminAuth} from '@/lib/firebase/admin'
import {
  firebaseSessionCookieMaxAgeMs,
  firebaseSessionCookieMaxAgeSeconds,
  firebaseSessionCookieName,
} from '@/lib/firebase/session'
import {NextResponse, type NextRequest} from 'next/server'

export const runtime = 'nodejs'

type SessionBody = {
  idToken?: unknown
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const auth = getFirebaseAdminAuth()

    if (!auth) {
      // Allow auth to work without server session support in environments
      // where Firebase Admin credentials are intentionally unavailable.
      return new NextResponse(null, {status: 204})
    }

    const body = (await request.json().catch(() => null)) as SessionBody | null
    const idToken = body?.idToken

    if (typeof idToken !== 'string' || idToken.trim().length === 0) {
      return jsonResponse({error: 'Missing Firebase ID token.'}, 400)
    }

    let sessionCookie: string

    try {
      await auth.verifyIdToken(idToken, true)
      sessionCookie = await auth.createSessionCookie(idToken, {
        expiresIn: firebaseSessionCookieMaxAgeMs,
      })
    } catch {
      return jsonResponse({error: 'Invalid Firebase ID token.'}, 401)
    }

    const response = jsonResponse({ok: true})
    response.cookies.set(firebaseSessionCookieName, sessionCookie, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: firebaseSessionCookieMaxAgeSeconds,
    })
    return response
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unable to create a Firebase session.'
    return jsonResponse({error: message}, 500)
  }
}

export async function DELETE() {
  const response = jsonResponse({ok: true})

  response.cookies.set(firebaseSessionCookieName, '', {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0,
  })

  return response
}

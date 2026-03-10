import {settlePaygateCallback} from '@/app/api/paygate/settlement'
import {ConvexHttpClient} from 'convex/browser'
import {NextRequest, NextResponse} from 'next/server'

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL

if (!convexUrl) {
  throw new Error('NEXT_PUBLIC_CONVEX_URL is required for gateway webhook')
}

const convex = new ConvexHttpClient(convexUrl)

const toPayload = (searchParams: URLSearchParams): Record<string, unknown> =>
  Object.fromEntries(searchParams.entries())

const parsePostPayload = async (
  request: NextRequest,
): Promise<Record<string, unknown>> => {
  const contentType = request.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    const json = await request.json()
    if (json && typeof json === 'object') {
      return json as Record<string, unknown>
    }
    return {}
  }

  if (contentType.includes('application/x-www-form-urlencoded')) {
    const form = await request.formData()
    return Object.fromEntries(form.entries())
  }

  const text = await request.text()
  if (!text.trim()) return {}

  try {
    const parsed = JSON.parse(text) as unknown
    if (parsed && typeof parsed === 'object') {
      return parsed as Record<string, unknown>
    }
  } catch {
    const params = new URLSearchParams(text)
    if ([...params.keys()].length > 0) {
      return Object.fromEntries(params.entries())
    }
  }

  return {}
}

const okTextResponse = () =>
  new NextResponse('ok', {
    status: 200,
    headers: {'Content-Type': 'text/plain; charset=utf-8'},
  })

export async function GET(request: NextRequest) {
  const payload = toPayload(request.nextUrl.searchParams)
  if (Object.keys(payload).length === 0) {
    return NextResponse.json({
      message: 'Gateway webhook endpoint is active',
      methods: ['GET', 'POST'],
    })
  }

  try {
    const result = await settlePaygateCallback(convex, payload)
    if (!result.ok) {
      return NextResponse.json(
        {error: result.error, details: result.details},
        {status: result.status},
      )
    }

    return okTextResponse()
  } catch (error) {
    console.error('Gateway GET callback error:', error)
    return NextResponse.json(
      {
        error: 'Failed to process gateway callback',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      {status: 500},
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await parsePostPayload(request)
    const result = await settlePaygateCallback(convex, payload)

    if (!result.ok) {
      return NextResponse.json(
        {error: result.error, details: result.details},
        {status: result.status},
      )
    }

    return NextResponse.json({
      success: true,
      updated: result.updated,
      orderId: result.orderId,
      orderNumber: result.orderNumber,
      paymentStatus: result.paymentStatus,
    })
  } catch (error) {
    console.error('Gateway POST webhook error:', error)
    return NextResponse.json(
      {
        error: 'Failed to process gateway webhook',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      {status: 500},
    )
  }
}

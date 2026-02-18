import {afterAll, beforeAll, beforeEach, describe, expect, mock, test} from 'bun:test'
import {NextRequest} from 'next/server'

type Call = [fn: unknown, args: unknown]

let queryQueue: unknown[] = []
let mutationQueue: unknown[] = []
let fetchQueue: Response[] = []

const queryCalls: Call[] = []
const mutationCalls: Call[] = []
const fetchCalls: Array<[input: RequestInfo | URL, init?: RequestInit]> = []

const resetState = () => {
  queryQueue = []
  mutationQueue = []
  fetchQueue = []
  queryCalls.length = 0
  mutationCalls.length = 0
  fetchCalls.length = 0
}

const dequeue = (queue: unknown[], label: string) => {
  if (queue.length === 0) {
    throw new Error(`Unexpected ${label} call`)
  }
  return queue.shift()
}

mock.module('convex/browser', () => {
  class MockConvexHttpClient {
    constructor(_url: string) {}

    async query(fn: unknown, args: unknown) {
      queryCalls.push([fn, args])
      return dequeue(queryQueue, 'query')
    }

    async mutation(fn: unknown, args: unknown) {
      mutationCalls.push([fn, args])
      return dequeue(mutationQueue, 'mutation')
    }
  }

  return {ConvexHttpClient: MockConvexHttpClient}
})

const originalFetch = globalThis.fetch

const mockFetch: typeof fetch = async (input, init) => {
  fetchCalls.push([input, init])
  const nextResponse = dequeue(fetchQueue as unknown[], 'fetch') as Response
  return nextResponse
}

type RouteModule = typeof import('../app/api/paygate/checkout/route')
let post: RouteModule['POST']

const createRequest = (body: unknown) =>
  new NextRequest('https://store.example/api/paygate/checkout', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(body),
  })

const order = {
  _id: 'orders_test_123',
  orderNumber: 'ORD-1001',
  totalCents: 12500,
  contactEmail: 'buyer@example.com',
  payment: {
    method: 'cards',
    status: 'pending',
  },
}

const account = {
  hexAddress: '0xmerchantwallet',
  defaultProvider: 'moonpay',
  topTenProviders: [{id: 'moonpay', provider_name: 'MoonPay'}],
}

const adminSettings = {
  value: {
    paygate: {
      apiUrl: 'https://api.proxy.example',
      checkoutUrl: 'https://checkout.proxy.example',
    },
  },
}

beforeAll(async () => {
  process.env.NEXT_PUBLIC_CONVEX_URL = 'https://convex.example'
  globalThis.fetch = mockFetch
  ;({POST: post} = await import('../app/api/paygate/checkout/route'))
})

afterAll(() => {
  globalThis.fetch = originalFetch
})

beforeEach(() => {
  resetState()
})

describe('Pay with cards checkout route', () => {
  test('returns 400 when orderId is missing', async () => {
    const response = await post(createRequest({}))
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload).toEqual({error: 'Missing orderId'})
    expect(queryCalls).toHaveLength(0)
    expect(fetchCalls).toHaveLength(0)
    expect(mutationCalls).toHaveLength(0)
  })

  test('returns 409 when order is already paid', async () => {
    queryQueue.push({
      ...order,
      payment: {
        ...order.payment,
        status: 'completed',
      },
    })

    const response = await post(createRequest({orderId: order._id}))
    const payload = await response.json()

    expect(response.status).toBe(409)
    expect(payload).toEqual({error: 'Order payment is already completed'})
    expect(queryCalls).toHaveLength(1)
    expect(fetchCalls).toHaveLength(0)
    expect(mutationCalls).toHaveLength(0)
  })

  test('returns 400 when requested provider is not pre-selected', async () => {
    queryQueue.push(order, account)

    const response = await post(
      createRequest({
        orderId: order._id,
        providerId: 'rampnetwork',
      }),
    )
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload).toEqual({
      error: 'Provider "rampnetwork" is not pre-selected',
    })
    expect(queryCalls).toHaveLength(2)
    expect(fetchCalls).toHaveLength(0)
    expect(mutationCalls).toHaveLength(0)
  })

  test('initializes card checkout and stores processing payment state', async () => {
    queryQueue.push(order, account, adminSettings)
    fetchQueue.push(
      new Response(
        JSON.stringify({
          address_in: 'encrypted-wallet',
          polygon_address_in: '0xpolygonwallet',
          callback_url: 'https://paygate.example/callback',
          ipn_token: 'ipn_123',
        }),
        {
          status: 200,
          headers: {'Content-Type': 'application/json'},
        },
      ),
    )
    mutationQueue.push(null)

    const response = await post(createRequest({orderId: order._id}))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)
    expect(payload.provider).toBe('moonpay')
    expect(String(payload.paymentUrl)).toContain(
      'https://checkout.proxy.example/process-payment.php?',
    )
    expect(String(payload.paymentUrl)).toContain('provider=moonpay')

    expect(fetchCalls).toHaveLength(1)
    const walletRequestUrl = new URL(String(fetchCalls[0][0]))
    expect(walletRequestUrl.origin).toBe('https://api.proxy.example')
    expect(walletRequestUrl.pathname).toBe('/control/wallet.php')
    expect(walletRequestUrl.searchParams.get('address')).toBe(account.hexAddress)
    const callback = walletRequestUrl.searchParams.get('callback')
    expect(callback).toBeTruthy()
    const callbackUrl = new URL(callback!)
    expect(callbackUrl.pathname).toBe('/api/paygate/webhook')
    expect(callbackUrl.searchParams.get('order_doc_id')).toBe(order._id)
    expect(callbackUrl.searchParams.get('provider')).toBe('moonpay')

    expect(mutationCalls).toHaveLength(1)
    const mutationArgs = mutationCalls[0][1] as {
      orderId: string
      payment: {
        status: string
        gateway?: {
          provider?: string
          paymentUrl?: string
          metadata?: Record<string, unknown>
        }
      }
    }

    expect(mutationArgs.orderId).toBe(order._id)
    expect(mutationArgs.payment.status).toBe('processing')
    expect(mutationArgs.payment.gateway?.provider).toBe('moonpay')
    expect(String(mutationArgs.payment.gateway?.paymentUrl)).toContain(
      'provider=moonpay',
    )
    expect(mutationArgs.payment.gateway?.metadata?.provider).toBe('moonpay')
    expect(mutationArgs.payment.gateway?.metadata?.ipnToken).toBe('ipn_123')
  })

  test('returns 502 when wallet API response is missing address_in', async () => {
    queryQueue.push(order, account, adminSettings)
    fetchQueue.push(
      new Response(JSON.stringify({ipn_token: 'ipn_123'}), {
        status: 200,
        headers: {'Content-Type': 'application/json'},
      }),
    )

    const response = await post(createRequest({orderId: order._id}))
    const payload = await response.json()

    expect(response.status).toBe(502)
    expect(payload).toEqual({
      error: 'PayGate wallet response missing address_in',
    })
    expect(mutationCalls).toHaveLength(0)
  })
})

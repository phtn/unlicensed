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
  addressIn: 'encrypted-wallet-token',
  polygonAddressIn: '0xpolygonwallet',
  ipnToken: 'ipn_123',
  callbackUrl: 'https://store.example/api/paygate/webhook',
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
    queryQueue.push(order, adminSettings, account)

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
    expect(queryCalls).toHaveLength(3)
    expect(fetchCalls).toHaveLength(0)
    expect(mutationCalls).toHaveLength(0)
  })

  test('initializes card checkout using predefined account values (no wallet API call)', async () => {
    queryQueue.push(order, adminSettings, account)
    mutationQueue.push(null)

    const response = await post(createRequest({orderId: order._id}))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)
    expect(payload.provider).toBe('moonpay')
    expect(fetchCalls).toHaveLength(0)

    const paymentUrl = String(payload.paymentUrl)
    expect(paymentUrl).toContain(
      'https://checkout.proxy.example/process-payment.php?',
    )
    expect(paymentUrl).toContain('provider=moonpay')
    expect(paymentUrl).toContain(`address=${encodeURIComponent(account.addressIn)}`)
    expect(paymentUrl).toContain('amount=125.00')
    expect(paymentUrl).toContain(`email=${encodeURIComponent(order.contactEmail)}`)

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
    expect(mutationArgs.payment.gateway?.metadata?.ipnToken).toBe(
      account.ipnToken,
    )
    expect(mutationArgs.payment.gateway?.metadata?.encryptedAddressIn).toBe(
      account.addressIn,
    )
    expect(mutationArgs.payment.gateway?.metadata?.polygonAddressIn).toBe(
      account.polygonAddressIn,
    )
  })

  test('normalizes double-encoded address_in to single encoding in payment URL', async () => {
    const doubleEncodedAddress =
      'er7V4AChAPTof%252F%252BVxW9tcAEtsGvW1%252Fvi2KhJ7RWCJPhjriKxRF6Qa%252FuojUrfY66vRMWKHYHjepT4rvqpD%252FFwVA%253D%253D'
    const accountWithEncodedAddress = {
      ...account,
      addressIn: doubleEncodedAddress,
    }
    queryQueue.push(order, adminSettings, accountWithEncodedAddress)
    mutationQueue.push(null)

    const response = await post(createRequest({orderId: order._id}))
    const payload = await response.json()

    expect(response.status).toBe(200)
    const paymentUrl = String(payload.paymentUrl)
    expect(paymentUrl).toContain('address=')
    expect(paymentUrl).not.toContain('%252F')
    expect(paymentUrl).not.toContain('%253D')
    expect(paymentUrl).toContain('%2F')
    expect(paymentUrl).toContain('%3D')
  })

  test('returns 400 when account has no addressIn', async () => {
    const accountWithoutAddressIn = {
      ...account,
      addressIn: '',
      polygonAddressIn: account.polygonAddressIn,
    }
    queryQueue.push(order, adminSettings, accountWithoutAddressIn)

    const response = await post(createRequest({orderId: order._id}))
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload).toEqual({
      error: 'PayGate account address_in is not configured',
    })
    expect(fetchCalls).toHaveLength(0)
    expect(mutationCalls).toHaveLength(0)
  })
})

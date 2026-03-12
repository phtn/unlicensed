import {beforeAll, beforeEach, describe, expect, mock, test} from 'bun:test'
import {NextRequest} from 'next/server'

type Call = [fn: unknown, args: unknown]

let queryQueue: unknown[] = []
let mutationQueue: unknown[] = []

const queryCalls: Call[] = []
const mutationCalls: Call[] = []

const resetState = () => {
  queryQueue = []
  mutationQueue = []
  queryCalls.length = 0
  mutationCalls.length = 0
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

type WebhookRouteModule = typeof import('../app/api/gateways/webhook/route')

let post: WebhookRouteModule['POST']

const createRequest = (body: unknown) =>
  new NextRequest('https://store.example/api/gateways/webhook', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(body),
  })

const baseOrder = {
  _id: 'orders_test_123',
  orderNumber: 'ORD-1001',
  totalCents: 12500,
  createdAt: 1700000000000,
  contactEmail: 'buyer@example.com',
  shippingAddress: {
    firstName: 'Jane',
    lastName: 'Doe',
  },
  payment: {
    method: 'crypto_commerce',
    status: 'pending',
  },
}

beforeAll(async () => {
  process.env.NEXT_PUBLIC_CONVEX_URL = 'https://convex.example'
  ;({POST: post} = await import('../app/api/gateways/webhook/route'))
})

beforeEach(() => {
  resetState()
})

describe('PayGate webhook settlement', () => {
  test('marks pay with crypto as completed and delegates email delivery to Convex', async () => {
    queryQueue.push(baseOrder)
    mutationQueue.push(null)

    const response = await post(
      createRequest({
        order_id: baseOrder.orderNumber,
        status: 'completed',
        txid_in:
          '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        value_usd: '125',
      }),
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toMatchObject({
      success: true,
      updated: true,
      orderId: baseOrder._id,
      orderNumber: baseOrder.orderNumber,
      paymentStatus: 'completed',
    })

    expect(mutationCalls).toHaveLength(1)
  })

  test('does not change settlement behavior for later completed callbacks', async () => {
    queryQueue.push({
      ...baseOrder,
      payment: {
        ...baseOrder.payment,
        status: 'completed',
      },
    })
    mutationQueue.push(null)

    const response = await post(
      createRequest({
        order_id: baseOrder.orderNumber,
        status: 'completed',
        txid_in:
          '0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      }),
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toMatchObject({
      success: true,
      updated: true,
      paymentStatus: 'completed',
    })

    expect(mutationCalls).toHaveLength(1)
  })

  test('does not change settlement behavior for non-crypto methods', async () => {
    queryQueue.push({
      ...baseOrder,
      payment: {
        method: 'cards',
        status: 'pending',
      },
    })
    mutationQueue.push(null)

    const response = await post(
      createRequest({
        order_id: baseOrder.orderNumber,
        status: 'completed',
      }),
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toMatchObject({
      success: true,
      updated: true,
      paymentStatus: 'completed',
    })

    expect(mutationCalls).toHaveLength(1)
  })
})

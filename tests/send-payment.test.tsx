import type {Order} from '@/app/admin/(routes)/ops/types'
import type {Id} from '@/convex/_generated/dataModel'
import {fireEvent, render, screen, waitFor} from './test-utils'
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  mock,
  test,
} from 'bun:test'
import type {
  ButtonHTMLAttributes,
  ComponentProps,
  HTMLAttributes,
  ReactNode,
} from 'react'

type QueryCall = [fn: unknown, args: unknown]

const queryCalls: QueryCall[] = []
const updatePaymentCalls: Array<{
  orderId: Id<'orders'>
  payment: Order['payment']
}> = []
const fetchCalls: Array<[input: RequestInfo | URL, init?: RequestInit]> = []

let useQueryImpl: (fn: unknown, args: unknown) => unknown = () => undefined
let fetchQueue: Response[] = []

function registerModuleMocks() {
  mock.module('convex/react', () => ({
    useQuery: (fn: unknown, args: unknown) => {
      queryCalls.push([fn, args])
      return useQueryImpl(fn, args)
    },
    useMutation: () => async () => null,
  }))

  mock.module('@/components/appkit/search-params-context', () => ({
    SearchParamsProvider: ({children}: {children: ReactNode}) => children,
    useSearchParams: () => ({params: new URLSearchParams()}),
  }))

  mock.module('@base-ui/react/tabs', () => ({
    Tabs: {
      Root: ({children}: {children: ReactNode}) => <div>{children}</div>,
      List: ({children}: {children: ReactNode}) => <div>{children}</div>,
      Tab: ({children, ...props}: ButtonHTMLAttributes<HTMLButtonElement>) => (
        <button type='button' {...props}>
          {children}
        </button>
      ),
      Panel: ({children}: {children: ReactNode}) => <div>{children}</div>,
      Indicator: (props: HTMLAttributes<HTMLDivElement>) => <div {...props} />,
    },
  }))

  mock.module('motion/react', () => ({
    motion: {
      div: ({children, ...props}: HTMLAttributes<HTMLDivElement>) => (
        <div {...props}>{children}</div>
      ),
    },
  }))

  mock.module('@/lib/icons', () => ({
    Icon: ({
      name,
      ...props
    }: HTMLAttributes<HTMLSpanElement> & {name: string}) => (
      <span data-icon={name} {...props} />
    ),
  }))

  mock.module('next/navigation', () => ({
    useParams: () => ({orderId: 'orders_test_123'}),
    useSearchParams: () => new URLSearchParams(),
    useRouter: () => ({push: () => {}, replace: () => {}, back: () => {}}),
    usePathname: () => '/lobby/order/orders_test_123/send',
  }))
}

const originalFetch = globalThis.fetch
const originalPreconnect = originalFetch.preconnect

const mockFetch = Object.assign(
  async (input: RequestInfo | URL, init?: RequestInit) => {
    fetchCalls.push([input, init])
    const nextResponse = fetchQueue.shift()
    if (!nextResponse) {
      throw new Error('Unexpected fetch call')
    }
    return nextResponse
  },
  {
    preconnect: (...args: Parameters<typeof fetch.preconnect>) =>
      originalPreconnect?.(...args),
  },
) satisfies typeof fetch

let SendToPanel: typeof import('@/app/lobby/(store)/order/[orderId]/send/send').SendToPanel
let buildVerificationCandidates: typeof import('@/app/lobby/(store)/order/[orderId]/send/send').buildVerificationCandidates
let normalizePaymentReference: typeof import('@/app/lobby/(store)/order/[orderId]/send/send').normalizePaymentReference
let toOrderTxData: typeof import('@/app/lobby/(store)/order/[orderId]/send/send').toOrderTxData

const orderId = 'orders_test_123' as Id<'orders'>

const baseOrder = {
  _id: orderId,
  _creationTime: 1,
  userId: null,
  orderNumber: 'ORD-1001',
  uuid: 'uuid-1001',
  orderStatus: 'pending_payment',
  items: [],
  subtotalCents: 10000,
  taxCents: 0,
  shippingCents: 0,
  totalCents: 10000,
  shippingAddress: {
    id: 'ship_1',
    type: 'shipping',
    firstName: 'Jamie',
    lastName: 'Buyer',
    addressLine1: '101 Main St',
    city: 'Los Angeles',
    state: 'CA',
    zipCode: '90001',
    country: 'US',
  },
  contactEmail: 'buyer@example.com',
  payment: {
    method: 'crypto_transfer',
    status: 'pending',
  },
  createdAt: 1,
  updatedAt: 1,
} satisfies Order

function renderSendToPanel(
  overrides?: Partial<ComponentProps<typeof SendToPanel>>,
) {
  return render(
    <SendToPanel
      qrDataUrl={null}
      walletAddress='0xWallet'
      copyFn={() => {}}
      isCopied={false}
      order={baseOrder}
      network='ethereum'
      orderId={orderId}
      updatePayment={async (args) => {
        updatePaymentCalls.push(args)
        return null
      }}
      getBySymbol={() => ({price: 2500})}
      relayedPaymentHashRef={{current: null}}
      relayWallets={{}}
      tokenSelected={null}
      {...overrides}
    />,
  )
}

beforeAll(async () => {
  globalThis.fetch = mockFetch
  registerModuleMocks()
  const sendModule =
    await import('@/app/lobby/(store)/order/[orderId]/send/send')
  SendToPanel = sendModule.SendToPanel
  buildVerificationCandidates = sendModule.buildVerificationCandidates
  normalizePaymentReference = sendModule.normalizePaymentReference
  toOrderTxData = sendModule.toOrderTxData
})

afterAll(() => {
  mock.restore()
  globalThis.fetch = originalFetch
})

beforeEach(() => {
  queryCalls.length = 0
  updatePaymentCalls.length = 0
  fetchCalls.length = 0
  fetchQueue = []
  useQueryImpl = (_fn, args) => (args === 'skip' ? undefined : null)
})

describe('send.tsx', () => {
  test('normalizes hash references and preserves non-hash values', () => {
    const rawHash = 'ABCDEF12'.repeat(8)

    expect(normalizePaymentReference(`  ${rawHash} `)).toBe(
      `0x${rawHash.toLowerCase()}`,
    )
    expect(normalizePaymentReference('tx:custom-reference')).toBe(
      'tx:custom-reference',
    )
    expect(normalizePaymentReference('   ')).toBeNull()
  })

  test('builds verification candidates with relay wallets before wallet fallback', () => {
    expect(
      buildVerificationCandidates({
        network: 'polygon',
        initialToken: 'usdc',
        walletAddress: '0xPrimaryWallet',
        relayWallets: {
          polygonusdc: '0xRelayUsdc',
          polygonusdt: '0xRelayUsdt',
        },
      }),
    ).toEqual([
      {paymentToken: 'usdc', expectedRecipient: '0xRelayUsdc'},
      {paymentToken: 'usdt', expectedRecipient: '0xRelayUsdt'},
      {paymentToken: 'ethereum', expectedRecipient: '0xPrimaryWallet'},
    ])
  })

  test('shows a duplicate hash error and disables submit before verification', async () => {
    const rawHash = 'A'.repeat(64)
    const normalizedHash = `0x${rawHash.toLowerCase()}`

    useQueryImpl = (_fn, args) => {
      if (args === 'skip') {
        return undefined
      }

      const request = args as {
        transactionId: string
        excludeOrderId: Id<'orders'>
      }

      if (request.transactionId === normalizedHash) {
        return {
          orderId: 'orders_dup_1' as Id<'orders'>,
          orderNumber: 'ORD-2002',
        }
      }

      return null
    }

    renderSendToPanel()

    fireEvent.change(screen.getByLabelText('TxHash'), {
      target: {value: rawHash},
    })

    await waitFor(() => {
      expect(
        screen.getByText(
          'This transaction hash is already linked to order ORD-2002.',
        ),
      ).toBeInTheDocument()
    })

    expect(queryCalls.at(-1)?.[1]).toEqual({
      transactionId: normalizedHash,
      excludeOrderId: orderId,
    })
    expect(screen.getByRole('button', {name: 'Verify Payment'})).toBeDisabled()

    fireEvent.click(screen.getByRole('button', {name: 'Verify Payment'}))

    expect(fetchCalls).toHaveLength(0)
    expect(updatePaymentCalls).toHaveLength(0)
  })

  test('verifies the transaction, updates payment, and relays once', async () => {
    const rawHash = 'b'.repeat(64)

    fetchQueue.push(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            id: `0x${rawHash}`,
            from: '0xFrom',
            to: '0xWallet',
            value: '4000000000000000000',
            gasUsed: '21000',
            gasPrice: '1000000000',
            status: 'success',
            blockNumber: '12345',
            contractAddress: null,
          },
        }),
        {
          status: 200,
          headers: {'Content-Type': 'application/json'},
        },
      ),
      new Response(JSON.stringify({success: true}), {
        status: 200,
        headers: {'Content-Type': 'application/json'},
      }),
    )

    renderSendToPanel()

    fireEvent.change(screen.getByLabelText('TxHash'), {
      target: {value: rawHash},
    })
    fireEvent.click(screen.getByRole('button', {name: 'Verify Payment'}))

    await waitFor(() => {
      expect(updatePaymentCalls).toHaveLength(1)
    })

    expect(fetchCalls).toHaveLength(2)
    expect(fetchCalls[0]?.[0]).toBe('/api/crypto/verify-tx')
    expect(fetchCalls[1]?.[0]).toBe('/api/relay')

    const verifyBody = JSON.parse(String(fetchCalls[0]?.[1]?.body)) as {
      txnHash: string
      network: string
      paymentToken?: string
      expectedRecipient?: string
    }
    expect(verifyBody.txnHash).toBe(rawHash)
    expect(verifyBody.network).toBe('ethereum')
    expect(verifyBody.paymentToken).toBe('ethereum')
    expect(verifyBody.expectedRecipient).toBe('0xwallet')

    expect(updatePaymentCalls[0]).toEqual({
      orderId,
      payment: {
        ...baseOrder.payment,
        status: 'completed',
        transactionId: `0x${rawHash}`,
        asset: 'ETH',
        chain: 'ethereum',
        paidAt: expect.any(Number),
        tx: toOrderTxData({
          id: `0x${rawHash}`,
          from: '0xFrom',
          to: '0xWallet',
          value: '4000000000000000000',
          gasUsed: '21000',
          gasPrice: '1000000000',
          status: 'success',
          blockNumber: '12345',
          contractAddress: null,
        }),
      },
    })

    const relayBody = JSON.parse(String(fetchCalls[1]?.[1]?.body)) as {
      paymentHash: string
      chainId: number
      token: string
    }
    expect(relayBody).toEqual({
      paymentHash: `0x${rawHash}`,
      chainId: 1,
      token: 'ethereum',
    })
  })
})

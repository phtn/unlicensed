import {api} from '@/convex/_generated/api'
import type {Id} from '@/convex/_generated/dataModel'
import {
  getGatewayApiUrls,
  type GatewayId,
} from '@/lib/paygate/config'
import {ConvexHttpClient} from 'convex/browser'
import {NextRequest, NextResponse} from 'next/server'

type CheckoutRequest = {
  orderId?: string
  providerId?: string
  currency?: string
}

type WalletResponse = {
  address_in?: string
  polygon_address_in?: string
  callback_url?: string
  ipn_token?: string
  error?: string
}

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL

if (!convexUrl) {
  throw new Error('NEXT_PUBLIC_CONVEX_URL is required for PayGate checkout')
}

const convex = new ConvexHttpClient(convexUrl)

const getString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

type GatewayUrlRecord = {apiUrl?: string; checkoutUrl?: string}

const getAdminValueRecord = async (): Promise<Record<string, unknown> | undefined> => {
  const adminSettings = await convex.query(api.admin.q.getAdminSettings, {})
  return adminSettings?.value && typeof adminSettings.value === 'object'
    ? (adminSettings.value as Record<string, unknown>)
    : undefined
}

const getAdminGatewayRecord = (
  valueRecord: Record<string, unknown> | undefined,
  gateway: GatewayId,
): GatewayUrlRecord | null => {
  const key = gateway
  const record =
    valueRecord?.[key] && typeof valueRecord[key] === 'object'
      ? (valueRecord[key] as Record<string, unknown>)
      : undefined
  if (!record) return null
  const apiUrl = getString(record.apiUrl)
  const checkoutUrl = getString(record.checkoutUrl)
  if (!apiUrl && !checkoutUrl) return null
  return {apiUrl: apiUrl ?? undefined, checkoutUrl: checkoutUrl ?? undefined}
}

const getAdminDefaultGateway = (
  valueRecord: Record<string, unknown> | undefined,
): GatewayId => {
  const v = valueRecord?.defaultGateway
  if (v === 'paygate' || v === 'paylex' || v === 'rampex') return v
  return 'paygate'
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CheckoutRequest
    const orderId = getString(body.orderId)

    if (!orderId) {
      return NextResponse.json({error: 'Missing orderId'}, {status: 400})
    }

    const order = await convex.query(api.orders.q.getById, {
      id: orderId as Id<'orders'>,
    })

    if (!order) {
      return NextResponse.json({error: 'Order not found'}, {status: 404})
    }

    if (order.payment.status === 'completed') {
      return NextResponse.json(
        {error: 'Order payment is already completed'},
        {status: 409},
      )
    }

    const adminValue = await getAdminValueRecord()
    const defaultGateway = getAdminDefaultGateway(adminValue)
    const account = await convex.query(
      api.paygateAccounts.q.getDefaultAccount,
      {gateway: defaultGateway},
    )
    if (!account) {
      return NextResponse.json(
        {error: 'Default PayGate account is not configured'},
        {status: 400},
      )
    }

    const merchantWallet = getString(account.hexAddress)
    if (!merchantWallet) {
      return NextResponse.json(
        {error: 'PayGate merchant wallet is not configured'},
        {status: 400},
      )
    }

    const topProviders = account.topTenProviders ?? []
    const requestedProvider = getString(body.providerId)
    const defaultProvider =
      getString(account.defaultProvider) || topProviders[0]?.id || 'moonpay'

    if (
      requestedProvider &&
      topProviders.length > 0 &&
      !topProviders.some((provider) => provider.id === requestedProvider)
    ) {
      return NextResponse.json(
        {error: `Provider "${requestedProvider}" is not pre-selected`},
        {status: 400},
      )
    }

    const provider = requestedProvider || defaultProvider
    const currency = getString(body.currency) || 'USD'
    const amount = (order.totalCents / 100).toFixed(2)

    // Use the account's gateway — each gateway (PayGate, Paylex, Rampex) has its own API;
    // wallet addresses are registered per gateway. Using the wrong gateway's API causes
    // "Provided wallet address is not allowed" because the wallet is unknown to that API.
    const gateway = (account.gateway ?? 'paygate') as GatewayId
    const adminGateway = getAdminGatewayRecord(adminValue, gateway)
    const {apiUrl, checkoutUrl} = getGatewayApiUrls(gateway, adminGateway)

    const callbackUrl = new URL('/api/paygate/webhook', request.nextUrl.origin)
    callbackUrl.searchParams.set('order_id', order.orderNumber)
    callbackUrl.searchParams.set('order_doc_id', order._id)
    callbackUrl.searchParams.set('provider', provider)

    const walletParams = new URLSearchParams({
      address: merchantWallet,
      callback: callbackUrl.toString(),
    })

    const walletResponse = await fetch(
      `${apiUrl}/control/wallet.php?${walletParams.toString()}`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      },
    )

    const walletData = (await walletResponse.json().catch(() => null)) as
      | WalletResponse
      | null

    if (!walletResponse.ok) {
      return NextResponse.json(
        {
          error: 'Failed to create PayGate checkout wallet',
          details: walletData?.error || 'Unexpected wallet API response',
        },
        {status: 502},
      )
    }

    if (!walletData?.address_in) {
      return NextResponse.json(
        {error: walletData?.error || 'PayGate wallet response missing address_in'},
        {status: 502},
      )
    }

    const paymentParams = new URLSearchParams({
      address: walletData.address_in,
      amount,
      provider,
      email: order.contactEmail,
      currency,
    })
    const paymentUrl = `${checkoutUrl}/process-payment.php?${paymentParams.toString()}`

    await convex.mutation(api.orders.m.updatePayment, {
      orderId: order._id,
      payment: {
        ...order.payment,
        status: 'processing',
        gatewayId: walletData.ipn_token || order.payment.gatewayId,
        gateway: {
          ...(order.payment.gateway ?? {
            name: gateway,
            id: walletData.polygon_address_in || walletData.address_in,
            provider,
            status: 'processing',
          }),
          name: gateway,
          id:
            walletData.polygon_address_in ||
            walletData.address_in ||
            order.payment.gateway?.id ||
            gateway,
          provider,
          status: 'processing',
          sessionId: walletData.ipn_token || order.payment.gateway?.sessionId,
          paymentUrl,
          transactionId: order.payment.gateway?.transactionId,
          metadata: {
            ...(order.payment.gateway?.metadata ?? {}),
            callbackUrl: walletData.callback_url || callbackUrl.toString(),
            ipnToken: walletData.ipn_token,
            encryptedAddressIn: walletData.address_in,
            polygonAddressIn: walletData.polygon_address_in,
            provider,
            checkoutInitializedAt: Date.now(),
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      paymentUrl,
      provider,
      orderNumber: order.orderNumber,
    })
  } catch (error) {
    console.error('PayGate checkout initialization error:', error)
    return NextResponse.json(
      {
        error: 'Failed to initialize checkout',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      {status: 500},
    )
  }
}

import {api} from '@/convex/_generated/api'
import type {Id} from '@/convex/_generated/dataModel'
import {getGatewayApiUrls, type GatewayId} from '@/lib/paygate/config'
import {ConvexHttpClient} from 'convex/browser'
import {NextRequest, NextResponse} from 'next/server'

type CheckoutRequest = {
  orderId?: string
  providerId?: string
  currency?: string
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

/** Normalize address_in to raw form so URLSearchParams encodes once (avoids double encoding) */
const normalizeAddressForUrl = (address: string): string => {
  try {
    let prev = address
    let curr = decodeURIComponent(prev)
    while (curr !== prev) {
      prev = curr
      curr = decodeURIComponent(prev)
    }
    return curr
  } catch {
    return address
  }
}

type GatewayUrlRecord = {apiUrl?: string; checkoutUrl?: string}

/** Ensure checkout base URL is valid and has no trailing slash (avoids double slashes in path). */
const normalizeCheckoutBaseUrl = (url: string): string => {
  const trimmed = url.trim()
  if (!trimmed || (!trimmed.startsWith('http://') && !trimmed.startsWith('https://'))) {
    throw new Error(
      `Invalid gateway checkout URL: must be an absolute URL (https://...). Check Convex gateways table for gateway checkoutUrl.`,
    )
  }
  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed
}

/** Get gateway URLs from Convex gateways table (canonical source). Falls back to env/defaults via getGatewayApiUrls. */
const getGatewayUrlRecord = async (
  gateway: GatewayId,
): Promise<GatewayUrlRecord | null> => {
  const gatewayDoc = await convex.query(api.gateways.q.getByGateway, {
    gateway,
  })
  if (!gatewayDoc) return null
  const apiUrl = getString(gatewayDoc.apiUrl)
  const checkoutUrl = getString(gatewayDoc.checkoutUrl)
  if (!apiUrl && !checkoutUrl) return null
  return {apiUrl: apiUrl ?? undefined, checkoutUrl: checkoutUrl ?? undefined}
}

const getAdminValueRecord = async (): Promise<
  Record<string, unknown> | undefined
> => {
  const adminSettings = await convex.query(api.admin.q.getAdminSettings, {})
  return adminSettings?.value && typeof adminSettings.value === 'object'
    ? (adminSettings.value as Record<string, unknown>)
    : undefined
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

    const addressIn = getString(account.addressIn)
    if (!addressIn) {
      return NextResponse.json(
        {error: 'PayGate account address_in is not configured'},
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
    const gatewayUrlRecord = await getGatewayUrlRecord(gateway)
    const {checkoutUrl: rawCheckoutUrl} = getGatewayApiUrls(
      gateway,
      gatewayUrlRecord,
    )
    const checkoutUrl = normalizeCheckoutBaseUrl(rawCheckoutUrl)

    const callbackUrl = new URL('/api/paygate/webhook', request.nextUrl.origin)
    callbackUrl.searchParams.set('order_id', order.orderNumber)
    callbackUrl.searchParams.set('order_doc_id', order._id)
    callbackUrl.searchParams.set('provider', provider)

    const paymentParams = new URLSearchParams({
      address: normalizeAddressForUrl(addressIn),
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
        gatewayId: getString(account.ipnToken) || order.payment.gatewayId,
        gateway: {
          ...(order.payment.gateway ?? {
            name: gateway,
            id: getString(account.polygonAddressIn) || addressIn || gateway,
            provider,
            status: 'processing',
          }),
          name: gateway,
          id:
            getString(account.polygonAddressIn) ||
            addressIn ||
            order.payment.gateway?.id ||
            gateway,
          provider,
          status: 'processing',
          sessionId:
            getString(account.ipnToken) || order.payment.gateway?.sessionId,
          paymentUrl,
          transactionId: order.payment.gateway?.transactionId,
          metadata: {
            ...(order.payment.gateway?.metadata ?? {}),
            callbackUrl: callbackUrl.toString(),
            ipnToken: getString(account.ipnToken),
            encryptedAddressIn: addressIn,
            polygonAddressIn: getString(account.polygonAddressIn),
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

// {
//   "address_in": "er7V4AChAPTof%2F%2BVxW9tcAEtsGvW1%2Fvi2KhJ7RWCJPhjriKxRF6Qa%2FuojUrfY66vRMWKHYHjepT4rvqpD%2FFwVA%3D%3D",
//   "polygon_address_in": "0x9CE298FDEf44518b7d833050f41A5E6E338c4C58",
//   "callback_url": "http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fpaygate%2Fcallback",
//   "ipn_token": "ZEE2cW95d2IyYks3UlR6dDVCazVRemNTM1V4TFljSm9mZVJVOGM3S0xUelRTd1RwMDVxdEZ2dHN4LXFkQldjMTdPbGhKRlNFTGFB"
// }

// er7V4AChAPTof%2F%2BVxW9tcAEtsGvW1%2Fvi2KhJ7RWCJPhjriKxRF6Qa%2FuojUrfY66vRMWKHYHjepT4rvqpD%2FFwVA%3D%3D
// https://checkout.paygate.to/process-payment.php?address=er7V4AChAPTof%2F%2BVxW9tcAEtsGvW1%2Fvi2KhJ7RWCJPhjriKxRF6Qa%2FuojUrfY66vRMWKHYHjepT4rvqpD%2FFwVA%3D%3D&amount=100&provider=wert&email=phtn458%40gmail.com&currency=USD

// er7V4AChAPTof%2F%2BVxW9tcAEtsGvW1%2Fvi2KhJ7RWCJPhjriKxRF6Qa%2FuojUrfY66vRMWKHYHjepT4rvqpD%2FFwVA%3D%3D
// er7V4AChAPTof%252F%252BVxW9tcAEtsGvW1%252Fvi2KhJ7RWCJPhjriKxRF6Qa%252FuojUrfY66vRMWKHYHjepT4rvqpD%252FFwVA%253D%253D

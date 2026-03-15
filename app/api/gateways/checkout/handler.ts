import {api} from '@/convex/_generated/api'
import type {Id} from '@/convex/_generated/dataModel'
import {computeOrderTotalCents} from '@/lib/checkout/processing-fee'
import {getGatewayApiUrls, type GatewayId} from '@/lib/paygate/config'
import {ConvexHttpClient} from 'convex/browser'
import {NextRequest, NextResponse} from 'next/server'

type CheckoutRequest = {
  orderId?: string
  providerId?: string
  currency?: string
}

const formatGatewayLabel = (gateway: GatewayId): string =>
  gateway.charAt(0).toUpperCase() + gateway.slice(1)

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL

if (!convexUrl) {
  throw new Error('NEXT_PUBLIC_CONVEX_URL is required for gateway checkout')
}

const convex = new ConvexHttpClient(convexUrl)

const getString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

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

const normalizeCheckoutBaseUrl = (url: string): string => {
  const trimmed = url.trim()
  if (
    !trimmed ||
    (!trimmed.startsWith('http://') && !trimmed.startsWith('https://'))
  ) {
    throw new Error(
      'Invalid gateway checkout URL: must be an absolute URL (https://...). Check Convex gateways table for gateway checkoutUrl.',
    )
  }
  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed
}

export async function handleGatewayCheckout(request: NextRequest) {
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

    const defaultGateway = await convex.query(
      api.admin.q.getPaymentDefaultGateway,
      {},
    )
    const defaultGatewayLabel = formatGatewayLabel(defaultGateway)
    const gatewayDoc = await convex.query(api.gateways.q.getByGateway, {
      gateway: defaultGateway,
    })
    if (!gatewayDoc) {
      return NextResponse.json(
        {error: `Default ${defaultGatewayLabel} gateway is not configured`},
        {status: 400},
      )
    }

    const accounts = gatewayDoc.accounts ?? []
    const account = accounts.find((item) => item.isDefault) ?? accounts[0]
    if (!account) {
      return NextResponse.json(
        {error: `Default ${defaultGatewayLabel} account is not configured`},
        {status: 400},
      )
    }

    const addressIn = getString(account.addressIn)
    const gateway = (gatewayDoc.gateway ?? defaultGateway) as GatewayId
    const gatewayLabel = formatGatewayLabel(gateway)

    if (!addressIn) {
      return NextResponse.json(
        {error: `${gatewayLabel} account address_in is not configured`},
        {status: 400},
      )
    }

    const topProviders = gatewayDoc.topTenProviders ?? []
    const requestedProvider = getString(body.providerId)
    const defaultProvider =
      getString(gatewayDoc.defaultProvider) || topProviders[0]?.id || 'moonpay'

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
    const amountCents =
      order.payment.method === 'cards'
        ? computeOrderTotalCents({
            subtotalCents: order.subtotalCents,
            taxCents: order.taxCents,
            shippingCents: order.shippingCents,
            discountCents: order.discountCents,
            totalCents: order.totalCents,
          })
        : order.totalCents
    const amount = (amountCents / 100).toFixed(2)
    const {checkoutUrl: rawCheckoutUrl} = getGatewayApiUrls(gateway, {
      apiUrl: getString(gatewayDoc.apiUrl),
      checkoutUrl: getString(gatewayDoc.checkoutUrl),
    })
    const checkoutUrl = normalizeCheckoutBaseUrl(rawCheckoutUrl)

    const callbackUrl = new URL('/api/gateways/webhook', request.nextUrl.origin)
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
      gateway,
      paymentUrl,
      provider,
      orderNumber: order.orderNumber,
    })
  } catch (error) {
    console.error('Gateway checkout initialization error:', error)
    return NextResponse.json(
      {
        error: 'Failed to initialize checkout',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      {status: 500},
    )
  }
}

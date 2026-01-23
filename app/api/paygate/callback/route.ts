import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {ConvexHttpClient} from 'convex/browser'
import {NextRequest, NextResponse} from 'next/server'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

/**
 * PayGate Callback Handler
 *
 * Handles callback events from PayGate after payment completion.
 * PayGate redirects users to this endpoint with payment status information.
 *
 * Reference: https://documenter.getpostman.com/view/14826208/2sA3Bj9aBi#49c49ed2-387f-4b40-9237-e68fd0152ae3
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // Extract callback parameters (PayGate may send these as query params)
    const sessionId =
      searchParams.get('session_id') || searchParams.get('sessionId')
    const orderId = searchParams.get('order_id') || searchParams.get('orderId')
    const transactionId =
      searchParams.get('transaction_id') || searchParams.get('transactionId')
    const status = searchParams.get('status')
    const amount = searchParams.get('amount')
    const currency = searchParams.get('currency')
    const paidAt = searchParams.get('paid_at') || searchParams.get('paidAt')

    // Extract order identifier
    const orderIdentifier = orderId
    const sessionIdentifier = sessionId

    if (!orderIdentifier && !sessionIdentifier) {
      // Redirect to error page if no identifiers
      return NextResponse.redirect(
        new URL('/order/payment?error=missing_parameters', request.url),
      )
    }

    // Find order by order number or session ID
    let order = null
    if (orderIdentifier) {
      order = await convex.query(api.orders.q.getOrderByNumber, {
        orderNumber: orderIdentifier,
      })
    }

    // If order not found by order number, try to find by session ID
    // We need to search all orders with PayGate session ID
    if (!order && sessionIdentifier) {
      // Note: This is a limitation - we'd need a query by paygateSessionId
      // For now, we'll try to extract order ID from session ID if it follows a pattern
      // or redirect to error page
      const sessionOrderMatch = sessionIdentifier.match(/session_(.+)/)
      if (sessionOrderMatch && sessionOrderMatch[1]) {
        const potentialOrderId = sessionOrderMatch[1]
        // Validate Convex ID format (starts with 'j' or 'k' followed by alphanumeric)
        if (/^[jk][a-z0-9]{24}$/.test(potentialOrderId)) {
          try {
            order = await convex.query(api.orders.q.getOrderByNumber, {
              orderNumber: potentialOrderId as `${string}`,
            })
          } catch {
            // Invalid order ID format or order not found
          }
        }
      }

      if (!order) {
        // Redirect to error page
        return NextResponse.redirect(
          new URL('/order/payment?error=order_not_found', request.url),
        )
      }
    }

    if (!order) {
      return NextResponse.redirect(
        new URL('/order/payment?error=order_not_found', request.url),
      )
    }

    // Map PayGate status to our payment status
    let paymentStatus:
      | 'pending'
      | 'processing'
      | 'completed'
      | 'failed'
      | 'refunded'
      | 'partially_refunded' = 'pending'

    const paygateStatus = (status || '').toLowerCase()
    if (
      paygateStatus === 'completed' ||
      paygateStatus === 'paid' ||
      paygateStatus === 'success'
    ) {
      paymentStatus = 'completed'
    } else if (
      paygateStatus === 'failed' ||
      paygateStatus === 'error' ||
      paygateStatus === 'canceled' ||
      paygateStatus === 'cancelled'
    ) {
      paymentStatus = 'failed'
    } else if (paygateStatus === 'processing' || paygateStatus === 'pending') {
      paymentStatus = paygateStatus === 'processing' ? 'processing' : 'pending'
    } else if (paygateStatus === 'refunded') {
      paymentStatus = 'refunded'
    }

    // Update order payment status if status changed
    if (paymentStatus !== order.payment.status) {
      await convex.mutation(api.orders.m.updatePayment, {
        orderId: order._id,
        payment: {
          ...order.payment,
          status: paymentStatus,
          transactionId: transactionId || order.payment.transactionId,
          paidAt:
            paymentStatus === 'completed'
              ? paidAt
                ? parseInt(paidAt, 10)
                : Date.now()
              : order.payment.paidAt,
        },
      })
    }

    // Redirect based on payment status
    if (paymentStatus === 'completed') {
      // Redirect to order confirmation page
      return NextResponse.redirect(
        new URL(`/account/orders/${order._id}?payment=success`, request.url),
      )
    } else if (paymentStatus === 'failed') {
      // Redirect back to payment page with error
      return NextResponse.redirect(
        new URL(`/order/${order._id}/payment?payment=failed`, request.url),
      )
    } else {
      // Still processing or pending - redirect to payment page
      return NextResponse.redirect(
        new URL(`/order/${order._id}/payment?payment=pending`, request.url),
      )
    }
  } catch (error) {
    console.error('PayGate callback error:', error)
    // Redirect to error page
    return NextResponse.redirect(
      new URL('/order/payment?error=callback_failed', request.url),
    )
  }
}

/**
 * Handle POST requests for callback events
 * PayGate may send POST requests with JSON payload for callback events
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // PayGate callback payload structure
    const {
      session_id,
      sessionId,
      transaction_id,
      transactionId,
      order_id,
      orderId,
      status,
      amount,
      currency,
      paid_at,
      paidAt,
      event_type,
      eventType,
    } = body

    // Extract order identifier
    const orderIdentifier = order_id || orderId
    const sessionIdentifier = session_id || sessionId

    if (!orderIdentifier && !sessionIdentifier) {
      return NextResponse.json(
        {error: 'Missing order_id or session_id'},
        {status: 400},
      )
    }

    // Find order by order number or session ID
    let order = null
    if (orderIdentifier) {
      order = await convex.query(api.orders.q.getOrderByNumber, {
        orderNumber: orderIdentifier,
      })
    }

    // If order not found by order number, try to find by session ID
    if (!order && sessionIdentifier) {
      const sessionOrderMatch = sessionIdentifier.match(/session_(.+)/)
      if (sessionOrderMatch && sessionOrderMatch[1]) {
        const potentialOrderId = sessionOrderMatch[1]
        // Validate Convex ID format (starts with 'j' or 'k' followed by alphanumeric)
        if (/^[jk][a-z0-9]{24}$/.test(potentialOrderId)) {
          try {
            order = await convex.query(api.orders.q.getById, {
              id: potentialOrderId as Id<'orders'>,
            })
          } catch {
            // Invalid order ID format or order not found
          }
        }
      }

      if (!order) {
        return NextResponse.json(
          {error: 'Order not found by session ID'},
          {status: 404},
        )
      }
    }

    if (!order) {
      return NextResponse.json({error: 'Order not found'}, {status: 404})
    }

    // Map PayGate status to our payment status
    let paymentStatus:
      | 'pending'
      | 'processing'
      | 'completed'
      | 'failed'
      | 'refunded'
      | 'partially_refunded' = 'pending'

    const paygateStatus = (status || '').toLowerCase()
    const eventTypeLower = (event_type || eventType || '').toLowerCase()

    // Handle event types (payment_success, payment_failed, etc.)
    if (
      paygateStatus === 'completed' ||
      paygateStatus === 'paid' ||
      paygateStatus === 'success' ||
      eventTypeLower === 'payment_success' ||
      eventTypeLower === 'payment.completed'
    ) {
      paymentStatus = 'completed'
    } else if (
      paygateStatus === 'failed' ||
      paygateStatus === 'error' ||
      paygateStatus === 'canceled' ||
      paygateStatus === 'cancelled' ||
      eventTypeLower === 'payment_failed' ||
      eventTypeLower === 'payment.failed'
    ) {
      paymentStatus = 'failed'
    } else if (
      paygateStatus === 'processing' ||
      paygateStatus === 'pending' ||
      eventTypeLower === 'payment_processing' ||
      eventTypeLower === 'payment.processing'
    ) {
      paymentStatus = paygateStatus === 'processing' ? 'processing' : 'pending'
    } else if (
      paygateStatus === 'refunded' ||
      eventTypeLower === 'payment_refunded' ||
      eventTypeLower === 'payment.refunded'
    ) {
      paymentStatus = 'refunded'
    }

    // Update order payment status if status changed
    if (paymentStatus !== order.payment.status) {
      await convex.mutation(api.orders.m.updatePayment, {
        orderId: order._id,
        payment: {
          ...order.payment,
          status: paymentStatus,
          transactionId:
            transaction_id || transactionId || order.payment.transactionId,
          paidAt:
            paymentStatus === 'completed'
              ? paid_at || paidAt || Date.now()
              : order.payment.paidAt,
        },
      })
    }

    return NextResponse.json({
      success: true,
      orderId: order._id,
      status: paymentStatus,
    })
  } catch (error) {
    console.error('PayGate callback POST error:', error)
    return NextResponse.json(
      {
        error: 'Callback processing failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      {status: 500},
    )
  }
}

import {NextRequest, NextResponse} from 'next/server'
import {ConvexHttpClient} from 'convex/browser'
import {api} from '@/convex/_generated/api'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

/**
 * PayGate Webhook Handler
 * 
 * Handles payment status updates from PayGate.
 * PayGate will call this endpoint when payment status changes.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // PayGate webhook payload structure (may vary)
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
    let order
    if (orderIdentifier) {
      order = await convex.query(api.orders.q.getOrderByNumber, {
        orderNumber: orderIdentifier,
      })
    }

    // If order not found by order number, try to find by session ID
    // Note: This requires a query by payment.paygateSessionId
    // For now, we'll rely on order number matching
    if (!order && sessionIdentifier) {
      // We'd need a query to find by session ID, but for now
      // PayGate should send order_id in webhook
      return NextResponse.json(
        {error: 'Order not found by session ID. Please include order_id in webhook.'},
        {status: 404},
      )
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
    if (paygateStatus === 'completed' || paygateStatus === 'paid') {
      paymentStatus = 'completed'
    } else if (paygateStatus === 'failed' || paygateStatus === 'error') {
      paymentStatus = 'failed'
    } else if (paygateStatus === 'processing' || paygateStatus === 'pending') {
      paymentStatus = paygateStatus === 'processing' ? 'processing' : 'pending'
    } else if (paygateStatus === 'refunded') {
      paymentStatus = 'refunded'
    }

    // Update order payment status
    await convex.mutation(api.orders.m.updatePayment, {
      orderId: order._id,
      payment: {
        ...order.payment,
        status: paymentStatus,
        transactionId: transaction_id || transactionId || order.payment.transactionId,
        paygateTransactionId: transaction_id || transactionId,
        paidAt:
          paymentStatus === 'completed'
            ? paid_at || paidAt || Date.now()
            : order.payment.paidAt,
      },
    })

    return NextResponse.json({success: true, orderId: order._id})
  } catch (error) {
    console.error('PayGate webhook error:', error)
    return NextResponse.json(
      {
        error: 'Webhook processing failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      {status: 500},
    )
  }
}

// Also support GET for webhook verification/testing
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'PayGate webhook endpoint is active',
    method: 'POST',
  })
}

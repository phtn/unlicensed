import {api} from '@/convex/_generated/api'
import {Doc, Id} from '@/convex/_generated/dataModel'
import {useMutation} from 'convex/react'
import {useCallback, useEffect, useRef} from 'react'

interface UseHelioPaymentHandlerOptions {
  orderId: Id<'orders'>
  order: Doc<'orders'> | null | undefined
  enabled?: boolean
}

export const useHelioPaymentHandler = ({
  orderId,
  order,
  enabled = true,
}: UseHelioPaymentHandlerOptions) => {
  const updatePayment = useMutation(api.orders.m.updatePayment)
  const createCheckoutLog = useMutation(api.checkoutLogs.m.createCheckoutLog)

  const orderRef = useRef(order)
  const orderIdRef = useRef(orderId)
  const isMountedRef = useRef(true)

  useEffect(() => {
    if (order) orderRef.current = order
    orderIdRef.current = orderId
  }, [order, orderId])

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const handlePaymentSuccess = useCallback(
    (event: {
      data: unknown
      transaction: string
      paymentPK?: string
      swapTransactionSignature?: string
      blockchainSymbol?: unknown
      redirectUrl?: string
    }) => {
      if (!enabled) return

      setTimeout(() => {
        if (!isMountedRef.current) return

        const currentOrder = orderRef.current
        const currentOrderId = orderIdRef.current

        if (!currentOrder) return

        const data = event.data as
          | {
              transactionSignature?: string
              status?: string
              statusToken?: string
            }
          | null
          | undefined

        const transactionId =
          event.transaction ||
          event.swapTransactionSignature ||
          data?.transactionSignature ||
          undefined

        updatePayment({
          orderId: currentOrderId,
          payment: {
            ...currentOrder.payment,
            method: 'crypto_commerce',
            status: 'completed',
            transactionId,
            paidAt: Date.now(),
          },
        }).catch(console.error)

        createCheckoutLog({
          orderId: currentOrderId,
          orderNumber: currentOrder.orderNumber,
          status: 'payment_completed',
          userId: currentOrder.userId ?? null,
          paymentMethod: 'crypto',
          transactionId,
          metadata: {
            blockchainSymbol: event.blockchainSymbol,
            statusToken: data?.statusToken,
            transactionSignature: data?.transactionSignature,
            paymentPK: event.paymentPK,
            swapTransactionSignature: event.swapTransactionSignature,
            redirectUrl: event.redirectUrl,
          },
          createdAt: Date.now(),
        }).catch(console.error)
      }, 0)
    },
    [enabled, updatePayment, createCheckoutLog],
  )

  const handlePaymentError = useCallback(
    (event: unknown) => {
      if (!enabled) return

      setTimeout(() => {
        if (!isMountedRef.current) return

        const currentOrder = orderRef.current
        const currentOrderId = orderIdRef.current

        if (!currentOrder) return

        const errorData = event as
          | {
              errorMessage?: string
              transaction?: string
              error?: string
              message?: string
            }
          | null
          | undefined

        const errorMessage =
          errorData?.errorMessage ||
          errorData?.error ||
          errorData?.message ||
          'Payment failed'

        let transactionId = errorData?.transaction
        if (!transactionId && errorMessage) {
          const txMatch = errorMessage.match(/\(?tx:\s*(0x[a-fA-F0-9]+)\)?/i)
          if (txMatch?.[1]) {
            transactionId = txMatch[1]
          }
        }

        transactionId = transactionId || currentOrder.payment.transactionId

        updatePayment({
          orderId: currentOrderId,
          payment: {
            ...currentOrder.payment,
            method: 'crypto_commerce',
            status: 'failed',
            transactionId,
          },
        }).catch(console.error)

        createCheckoutLog({
          orderId: currentOrderId,
          orderNumber: currentOrder.orderNumber,
          status: 'failed',
          userId: currentOrder.userId ?? null,
          paymentMethod: 'crypto',
          transactionId,
          error: errorMessage,
          errorType: 'payment_error',
          errorDetails: {
            errorMessage,
            transactionId,
            rawEvent: JSON.stringify(event),
          },
          createdAt: Date.now(),
        }).catch(console.error)
      }, 0)
    },
    [enabled, updatePayment, createCheckoutLog],
  )

  return {
    handlePaymentSuccess,
    handlePaymentError,
  }
}

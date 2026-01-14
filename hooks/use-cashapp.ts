import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {useAction} from 'convex/react'
import {useCallback, useState} from 'react'

interface UseCashAppReturn {
  initiatePayment: (args: {
    orderId: Id<'orders'>
    returnUrl: string
    cancelUrl?: string
  }) => Promise<{
    success: boolean
    paymentId?: string
    applicationId?: string
    locationId?: string
    error?: string
  }>
  checkPaymentStatus: (args: {orderId: Id<'orders'>}) => Promise<{
    status: string
    paymentId?: string
    transactionId?: string
    paidAt?: number
    message?: string
  }>
  loading: boolean
  error: Error | null
}

export function useCashApp(): UseCashAppReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const initiatePaymentAction = useAction(
    api.orders.cashapp.initiateCashAppPayment,
  )
  const checkPaymentStatusAction = useAction(
    api.orders.cashapp.checkCashAppPaymentStatus,
  )

  const initiatePayment = useCallback(
    async (args: {
      orderId: Id<'orders'>
      returnUrl: string
      cancelUrl?: string
    }) => {
      try {
        setLoading(true)
        setError(null)
        const result = await initiatePaymentAction(args)
        return result
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error('Failed to initiate payment')
        setError(error)
        return {
          success: false,
          error: error.message,
        }
      } finally {
        setLoading(false)
      }
    },
    [initiatePaymentAction],
  )

  const checkPaymentStatus = useCallback(
    async (args: {orderId: Id<'orders'>}) => {
      try {
        setLoading(true)
        setError(null)
        const result = await checkPaymentStatusAction(args)
        return result
      } catch (err) {
        const error =
          err instanceof Error
            ? err
            : new Error('Failed to check payment status')
        setError(error)
        return {
          status: 'failed',
          message: error.message,
        }
      } finally {
        setLoading(false)
      }
    },
    [checkPaymentStatusAction],
  )

  return {
    initiatePayment,
    checkPaymentStatus,
    loading,
    error,
  }
}

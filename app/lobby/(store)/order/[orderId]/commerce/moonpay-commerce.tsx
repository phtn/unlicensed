'use client'

import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {HelioCheckout, type HelioEmbedConfig} from '@heliofi/checkout-react'
import {useMutation, useQuery} from 'convex/react'
import {useParams} from 'next/navigation'
import {useCallback, useMemo} from 'react'

export const MoonpayCheckout = () => {
  const params = useParams()
  const orderId = params.orderId as Id<'orders'>
  const order = useQuery(api.orders.q.getById, {id: orderId})

  // Mutations
  const updatePayment = useMutation(api.orders.m.updatePayment)
  const createCheckoutLog = useMutation(api.checkoutLogs.m.createCheckoutLog)

  // Convert totalCents to dollars
  const totalAmountDollars = useMemo(() => {
    if (order?.totalCents) {
      return (order.totalCents / 100).toFixed(2)
    }
    return null
  }, [order?.totalCents])

  // Calculate final value with 6.5% fee (1.065 multiplier)
  const finalValue = useMemo(() => {
    if (totalAmountDollars) {
      return String(Number(totalAmountDollars) * 1.065)
    }
    return undefined
  }, [totalAmountDollars])

  // Handle successful payment
  const handlePaymentSuccess = useCallback(
    async (event: {
      transaction?: string
      data?: {
        transactionSignature?: string
        status?: string
        statusToken?: string
      }
      blockchainSymbol?: string
    }) => {
      if (!order) {
        console.error('[PAYMENT SUCCESS] Order not found')
        return
      }

      try {
        // Extract transaction ID from event
        const transactionId =
          event.transaction ||
          event.data?.transactionSignature ||
          undefined

        // Update order payment status to completed
        await updatePayment({
          orderId,
          payment: {
            ...order.payment,
            method: 'crypto', // Helio/Moonpay uses crypto
            status: 'completed',
            transactionId,
            paidAt: Date.now(),
          },
        })

        // Create checkout log entry for successful payment
        await createCheckoutLog({
          orderId,
          orderNumber: order.orderNumber,
          status: 'payment_completed',
          userId: order.userId ?? null,
          paymentMethod: 'crypto',
          transactionId,
          metadata: {
            blockchainSymbol: event.blockchainSymbol,
            statusToken: event.data?.statusToken,
            transactionSignature: event.data?.transactionSignature,
          },
          createdAt: Date.now(),
        })

        console.log('[PAYMENT SUCCESS] Order payment updated', {
          orderId,
          transactionId,
        })
      } catch (error) {
        console.error('[PAYMENT SUCCESS ERROR]', error)
      }
    },
    [order, orderId, updatePayment, createCheckoutLog],
  )

  const config = useMemo(
    () =>
      ({
        amount: finalValue,
        paylinkId: '696d4e0f434ff17c7e72d8bf', // prod 6965158db7930fd0715fa44a
        theme: {themeMode: 'dark'},
        primaryColor: '#fc81fe',
        neutralColor: '#19241c',
        stretchFullWidth: true,
        network: 'test',
        onSuccess: handlePaymentSuccess,
        onError: (event) => console.log('[ERR]', event),
        onPending: (event) => console.log('[PENDING]', event),
        onCancel: () => console.log('Cancelled payment'),
        onStartPayment: () => console.log('Starting payment'),
      }) as HelioEmbedConfig,
    [finalValue, handlePaymentSuccess],
  )

  return (
    <main className='h-screen mt-16 bg-black'>
      <div className=''>
        <div className='max-w-xl mx-auto py-12 bg-black rounded-[3rem]'>
          <HelioCheckout config={config} />
        </div>
      </div>
    </main>
  )
}

const eg_success = {
  transaction:
    '0xd3a3dddf886f96fee1b3eee4d823218859d91cf098e5464c481cbcab81a04721',
  data: {
    content: {},
    transactionSignature:
      '0xd3a3dddf886f96fee1b3eee4d823218859d91cf098e5464c481cbcab81a04721',
    status: 'SUCCESS',
    statusToken:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0cmFuc2FjdGlvblNpZ25hdHVyZSI6IjB4ZDNhM2RkZGY4ODZmOTZmZWUxYjNlZWU0ZDgyMzIxODg1OWQ5MWNmMDk4ZTU0NjRjNDgxY2JjYWI4MWEwNDcyMSIsInRyYW5zYWN0aW9uSWQiOiI2OTZkNTJiOTY3ZjliYjYwNGJjY2I3MmUiLCJpYXQiOjE3Njg3NzIyODgsImV4cCI6MTc2ODc3OTQ4OH0.wQ2cHjRXB5PvUfMd3fJzTjjR8RAG_vkf9hZ6ygl-0HY',
  },
  blockchainSymbol: 'ETH',
}

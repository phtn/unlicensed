'use client'

import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {currencyConverter} from '@/utils/currency'
import {HelioCheckout, type HelioEmbedConfig} from '@heliofi/checkout-react'
import {useQuery} from 'convex/react'
import {useParams} from 'next/navigation'
import {useMemo} from 'react'

// const YAMASHITA = '696e6a845fbfe4a62883799f'
const SAKURA = '696d4e0f434ff17c7e72d8bf'
// const PRO = '6965158db7930fd0715fa44a'

export const MoonpayCheckout = () => {
  const params = useParams()
  const orderId = params.orderId as Id<'orders'>
  const order = useQuery(api.orders.q.getById, {id: orderId})

  // Set to false to disable Convex updates and isolate memory leak
  // const ENABLE_CONVEX_UPDATES = false

  // const {handlePaymentSuccess, handlePaymentError} = useHelioPaymentHandler({
  //   orderId,
  //   order,
  //   enabled: ENABLE_CONVEX_UPDATES,
  // })

  const totalAmountDollars = useMemo(() => {
    if (order?.totalCents) {
      return (order.totalCents / 100).toFixed(2)
    }
    return null
  }, [order?.totalCents])

  const finalValue = useMemo(
    () => currencyConverter(totalAmountDollars),
    [totalAmountDollars],
  )

  const config = useMemo((): HelioEmbedConfig | null => {
    if (!finalValue) return null

    return {
      amount: finalValue,
      paylinkId: SAKURA,
      theme: {themeMode: 'dark'},
      primaryColor: '#fc81fe',
      neutralColor: '#19241c',
      stretchFullWidth: true,
      network: 'test',
      onSuccess: (event) => console.log(event),
      onError: (event) => console.log(event),
      onPending: (event) => console.log('[PENDING]', event),
      onCancel: () => console.log('Cancelled payment'),
      onStartPayment: () => console.log('Starting payment'),
    }
  }, [finalValue])

  if (order === undefined) {
    return (
      <main className='h-screen mt-16 bg-black flex items-center justify-center'>
        <div className='text-white'>Loading order...</div>
      </main>
    )
  }

  if (!order || !config) {
    return (
      <main className='h-screen mt-16 bg-black flex items-center justify-center'>
        <div className='text-white'>
          {!order ? 'Order not found' : 'Unable to load payment'}
        </div>
      </main>
    )
  }

  return (
    <main className='h-screen mt-16 bg-black'>
      <div className='max-w-xl mx-auto py-12 bg-black rounded-[3rem]'>
        <HelioCheckout config={config} />
      </div>
    </main>
  )
}

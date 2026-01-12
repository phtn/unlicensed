'use client'

import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {HelioCheckout, type HelioEmbedConfig} from '@heliofi/checkout-react'
import {useQuery} from 'convex/react'
import {useParams} from 'next/navigation'
import {useMemo} from 'react'

export const MoonpayCheckout = () => {
  const params = useParams()
  const orderId = params.orderId as Id<'orders'>
  const order = useQuery(api.orders.q.getById, {id: orderId})

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

  const config = useMemo(
    () =>
      ({
        amount: finalValue,
        paylinkId: '6965158db7930fd0715fa44a',
        theme: {themeMode: 'dark'},
        primaryColor: '#fc81fe',
        neutralColor: '#19241c',
        stretchFullWidth: true,
        network: 'main',
      }) as HelioEmbedConfig,
    [finalValue],
  )

  return (
    <main className='h-140 mt-28'>
      <div className=''>
        <div className='max-w-xl mx-auto border border-brand py-0 rounded-3xl'>
          <HelioCheckout config={config} />
        </div>
      </div>
    </main>
  )
}

//https://moonpay.hel.io/pay/6965158db7930fd0715fa44a

/*
<div className='hidden max-w-xl mx-auto'>
        <div>
          <div className='mr-6'>
            {!totalAmountDollars ? (
              <Icon name='spinner-dots' className='size-8 text-brand mr-8' />
            ) : (
              <span className='font-brk hidden'>{`USD $${totalAmountDollars}`}</span>
            )}
          </div>
        </div>
      </div>
*/

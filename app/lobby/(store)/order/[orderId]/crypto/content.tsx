'use client'

import {Loader} from '@/components/expermtl/loader'
import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {Button, Card, CardBody} from '@heroui/react'
import {useQuery} from 'convex/react'
import NextLink from 'next/link'
import {useParams} from 'next/navigation'
import {OrderSummaryWidget} from './order-summary'
import {CryptoPay} from './pay'

export const Content = () => {
  const params = useParams()
  const orderId = params.orderId as Id<'orders'>
  const order = useQuery(api.orders.q.getById, {id: orderId})

  if (order === undefined) {
    return (
      <div className='h-screen w-screen overflow-hidden pt-100 lg:pt-28 px-4 sm:px-6 lg:px-8 py-8'>
        <Loader />
      </div>
    )
  }

  if (!order) {
    return (
      <main className='min-h-screen pt-16 lg:pt-28 px-4 sm:px-6 lg:px-8 py-8'>
        <div className='mx-auto max-w-3xl'>
          <Card radius='sm' shadow='none'>
            <CardBody className='p-6 space-y-4'>
              <h1 className='text-xl font-space'>Order not found</h1>
              <Button as={NextLink} href='/account/orders' color='primary'>
                View Orders
              </Button>
            </CardBody>
          </Card>
        </div>
      </main>
    )
  }

  const paymentMethod = String(order.payment.method)
  const isCryptoPaymentMethod =
    paymentMethod === 'crypto_commerce' ||
    paymentMethod === 'crypto_transfer' ||
    paymentMethod === 'crypto-payment'

  if (!isCryptoPaymentMethod) {
    const fallbackHref =
      paymentMethod === 'cards'
        ? `/lobby/order/${orderId}/cards`
        : paymentMethod === 'cash_app'
          ? `/lobby/order/${orderId}/cashapp`
          : `/lobby/order/${orderId}/commerce`

    return (
      <main className='min-h-screen pt-16 lg:pt-28 px-4 sm:px-6 lg:px-8 py-8'>
        <div className='mx-auto max-w-3xl'>
          <Card radius='sm' shadow='none'>
            <CardBody className='p-6 space-y-4'>
              <h1 className='text-xl font-space'>Invalid payment route</h1>
              <p className='text-sm text-default-500'>
                This order uses{' '}
                <span className='font-mono'>{paymentMethod}</span> and cannot be
                paid on the crypto transfer screen.
              </p>
              <Button as={NextLink} href={fallbackHref} color='primary'>
                Go to payment page
              </Button>
            </CardBody>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className='min-h-screen pt-16 lg:pt-28 px-4 sm:px-6 lg:px-8 py-8 bg-black'>
      <div className='flex md:gap-4 mx-auto max-w-7xl'>
        <OrderSummaryWidget />
        <CryptoPay />
      </div>
    </main>
  )
}

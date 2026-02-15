'use client'

import {Loader} from '@/components/expermtl/loader'
import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {Button, Card, CardBody} from '@heroui/react'
import {useQuery} from 'convex/react'
import {AnimatePresence, motion} from 'motion/react'
import NextLink from 'next/link'
import {useParams} from 'next/navigation'
import {CheckoutSuccess} from './checkout-success'
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

  const isPaymentCompleted = order.payment.status === 'completed'

  return (
    <main className='min-h-screen pt-16 lg:pt-28 px-4 sm:px-6 lg:px-8 py-8 bg-black'>
      <div className='relative md:mx-auto md:max-w-7xl min-h-[36rem] md:min-h-[40rem] overflow-hidden'>
        <AnimatePresence initial={false} mode='sync'>
          {!isPaymentCompleted ? (
            <motion.div
              key='crypto-checkout'
              initial={{opacity: 1, y: 0}}
              animate={{opacity: 1, y: 0}}
              exit={{opacity: 0, y: -110}}
              transition={{duration: 0.5, ease: [0.22, 1, 0.36, 1]}}
              className='md:flex'>
              <OrderSummaryWidget />
              <CryptoPay />
            </motion.div>
          ) : (
            <motion.div
              key='crypto-success'
              initial={{opacity: 0, y: '100%'}}
              animate={{opacity: 1, y: 0}}
              exit={{opacity: 0, y: '100%'}}
              transition={{duration: 0.55, ease: [0.22, 1, 0.36, 1]}}
              className='absolute inset-0 z-20 flex items-center justify-center'>
              <CheckoutSuccess
                orderNumber={order.orderNumber}
                transactionId={order.payment.transactionId}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}

'use client'

import {Id} from '@/convex/_generated/dataModel'
import {Icon} from '@/lib/icons'
import {formatPrice} from '@/utils/formatPrice'
import {Button, Card, CardBody, Divider} from '@heroui/react'
import {memo, ViewTransition} from 'react'
import {PointsBalance} from '../../rewards-summary'
import {FormData} from '../types'
import {PaymentMethod} from './payment-method'

// This component is part of the checkout flow, showing payment method and order button

interface OrderSummaryCardProps {
  subtotal: number
  tax: number
  shipping: number
  total: number
  isAuthenticated: boolean
  isLoading: boolean
  isPending: boolean
  orderId: string | null
  paymentMethod: FormData['paymentMethod']
  onPaymentMethodChange: (value: FormData['paymentMethod']) => void
  onPlaceOrderClick: () => void
  userId?: Id<'users'>
  pointsBalance: PointsBalance | undefined
  onOpen?: () => void
}

export const OrderSummaryCard = memo(function OrderSummaryCard({
  subtotal,
  tax,
  shipping,
  total,
  isAuthenticated,
  isLoading,
  isPending,
  orderId,
  // paymentMethod,
  onPaymentMethodChange,
  onPlaceOrderClick,
  pointsBalance,
  onOpen,
}: OrderSummaryCardProps) {
  const handleOnChange = (value: FormData['paymentMethod']) => {
    onPaymentMethodChange(value)
  }

  return (
    <div className='lg:sticky lg:top-24 h-fit'>
      <Card
        shadow='none'
        className='dark:bg-dark-table/40 border border-foreground/20'>
        <CardBody className='relative space-y-4 p-4 md:p-8'>
          <div className="absolute w-500 h-full scale-x-50 top-0 -left-150 inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 scale-100 pointer-events-none" />
          <h2 className='text-2xl font-normal font-bone'>Order Summary</h2>
          <Divider />
          <ViewTransition>
            <div className='space-y-2 font-sans'>
              <div className='flex justify-between font-okxs text-sm'>
                <span className=''>Subtotal</span>
                <span className=''>
                  <span className='opacity-80'>$</span>
                  {formatPrice(subtotal)}
                </span>
              </div>
              <div className='flex justify-between font-okxs text-sm'>
                <span className=''>Tax</span>

                <span className=''>
                  <span className='opacity-80'>$</span>
                  {formatPrice(tax)}
                </span>
              </div>
              <div className='flex justify-between font-okxs text-sm'>
                <span className=''>Shipping</span>
                <span className=''>
                  {shipping === 0 ? (
                    <span className='bg-limited px-1.5 uppercase rounded-sm font-bone text-dark-gray border border-dark-gray'>
                      Free
                    </span>
                  ) : (
                    <>
                      <span className='opacity-60'>$</span>
                      {formatPrice(shipping)}
                    </>
                  )}
                </span>
              </div>
              <div className='flex justify-between font-okxs text-sm dark:purple-300/10 rounded-md'>
                <span className='text-foreground'>Reward Points</span>
                <span className=''>${pointsBalance?.availablePoints ?? 0}</span>
              </div>
            </div>
          </ViewTransition>
          <Divider />
          <div className='flex justify-between font-medium font-okxs'>
            <span className=''>Total</span>
            <span className='font-medium'>${formatPrice(total)}</span>
          </div>

          {/* Payment Method Selection */}
          {isAuthenticated && (
            <>
              <Divider />
              <div className='py-5'>
                <PaymentMethod onChange={handleOnChange} />
              </div>
            </>
          )}

          {!isAuthenticated && (
            <div
              id='auth-check'
              onClick={onOpen}
              className='flex items-center justify-center space-x-1 p-3 bg-brand/10 border border-brand/10 rounded-lg cursor-pointer'>
              <Icon name='user' className='size-3.5' />
              <p className='text-sm hover:underline underline-offset-4'>
                <span className='font-bold'>Sign in</span> to proceed to
                checkout
              </p>
            </div>
          )}
          <Button
            size='lg'
            radius='md'
            variant='solid'
            className='w-full font-polysans text-lg font-semibold bg-foreground dark:bg-brand text-white h-14 mb-2'
            onPress={onPlaceOrderClick}
            isDisabled={!isAuthenticated || isLoading || isPending}
            isLoading={isLoading || isPending}>
            <span className='drop-shadow-sm'>
              {orderId ? 'Order Placed!' : 'Place Order'}
            </span>
          </Button>
        </CardBody>
      </Card>
    </div>
  )
})

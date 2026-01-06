'use client'

import {Id} from '@/convex/_generated/dataModel'
import {formatPrice} from '@/utils/formatPrice'
import {Button, Card, CardBody, Divider} from '@heroui/react'
import {ViewTransition} from 'react'
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
}

export function OrderSummaryCard({
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
              <div className='flex justify-between text-sm'>
                <span className='opacity-80 font-brk'>Subtotal</span>
                <span className='font-space'>${formatPrice(subtotal)}</span>
              </div>
              <div className='flex justify-between text-sm'>
                <span className='opacity-80 font-brk'>Tax</span>
                <span className='font-space'>${formatPrice(tax)}</span>
              </div>
              <div className='flex justify-between text-sm'>
                <span className='opacity-80 font-brk'>Shipping</span>
                <span className='font-space'>
                  {shipping === 0 ? (
                    <span className='bg-teal-500 px-1.5 uppercase rounded-sm font-semibold text-white'>
                      Free
                    </span>
                  ) : (
                    `$${formatPrice(shipping)}`
                  )}
                </span>
              </div>
              <div className='flex justify-between text-sm dark:purple-300/10 rounded-md'>
                <span className='text-foreground font-brk'>Reward Points</span>
                <span className='font-space'>
                  ${pointsBalance?.availablePoints ?? 0}
                </span>
              </div>
            </div>
          </ViewTransition>
          <Divider />
          <div className='flex justify-between font-semibold font-space'>
            <span className='font-brk'>Total</span>
            <span className='font-space'>${formatPrice(total)}</span>
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
            <div className='p-3 bg-warning/10 border border-warning/20 rounded-lg'>
              <p className='text-sm text-warning'>
                Sign in to proceed to checkout
              </p>
            </div>
          )}
          <Button
            size='lg'
            radius='md'
            variant='solid'
            className='w-full font-semibold bg-foreground dark:bg-featured text-background h-14'
            onPress={onPlaceOrderClick}
            isDisabled={!isAuthenticated || isLoading || isPending}
            isLoading={isLoading || isPending}>
            {orderId ? 'Order Placed!' : 'Place Order'}
          </Button>
        </CardBody>
      </Card>
    </div>
  )
}

'use client'

import {formatPrice} from '@/utils/formatPrice'
import {Card, CardBody, Divider} from '@heroui/react'
import {ViewTransition} from 'react'

interface OrderSummaryProps {
  subtotal: number
  tax: number
  shipping: number
  total: number
}

export function OrderSummary({
  subtotal,
  tax,
  shipping,
  total,
}: OrderSummaryProps) {
  return (
    <div className='lg:sticky lg:top-24 h-fit'>
      <Card>
        <CardBody className='space-y-4 p-8'>
          <h2 className='text-xl font-semibold'>Order Summary</h2>
          <Divider />
          <ViewTransition>
            <div className='space-y-2 font-space'>
              <div className='flex justify-between text-sm'>
                <span className='text-color-muted'>Subtotal</span>
                <span>${formatPrice(subtotal)}</span>
              </div>
              <div className='flex justify-between text-sm'>
                <span className='text-color-muted'>Tax</span>
                <span>${formatPrice(tax)}</span>
              </div>
              <div className='flex justify-between text-sm'>
                <span className='text-color-muted'>Shipping</span>
                <span>
                  {shipping === 0 ? (
                    <span className='text-teal-500'>Free</span>
                  ) : (
                    `$${formatPrice(shipping)}`
                  )}
                </span>
              </div>
            </div>
          </ViewTransition>
          <Divider />
          <div className='flex justify-between text-lg font-semibold font-space'>
            <span>Total</span>
            <span>${formatPrice(total)}</span>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}


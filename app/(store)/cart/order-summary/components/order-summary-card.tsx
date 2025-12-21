'use client'

import {Id} from '@/convex/_generated/dataModel'
import {formatPrice} from '@/utils/formatPrice'
import {
  Button,
  Card,
  CardBody,
  Divider,
  Link,
  Select,
  SelectItem,
} from '@heroui/react'
import {ViewTransition} from 'react'
import {FormData} from '../types'

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
  paymentMethod,
  onPaymentMethodChange,
  onPlaceOrderClick,
}: OrderSummaryCardProps) {
  return (
    <div className='lg:sticky lg:top-24 h-fit'>
      <Card>
        <CardBody className='space-y-4 p-8'>
          <h2 className='text-xl font-semibold'>Order Summarr</h2>
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

          {/* Payment Method Selection */}
          {isAuthenticated && (
            <>
              <Divider />
              <div>
                <Select
                  label='Payment Method'
                  selectedKeys={[paymentMethod]}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string
                    onPaymentMethodChange(selected as FormData['paymentMethod'])
                  }}
                  isDisabled={isLoading || isPending || !!orderId}>
                  <SelectItem key='credit_card'>Credit Card</SelectItem>
                  <SelectItem key='crypto'>Cryptocurrency</SelectItem>
                  <SelectItem key='cashapp'>CashApp</SelectItem>
                </Select>
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
            radius='sm'
            variant='solid'
            className='w-full font-semibold bg-foreground text-background'
            onPress={onPlaceOrderClick}
            isDisabled={!isAuthenticated || isLoading || isPending}
            isLoading={isLoading || isPending}>
            {orderId ? 'Order Placed!' : 'Place Order'}
          </Button>
          <Button
            radius='sm'
            variant='flat'
            className='w-full'
            as={Link}
            href='/'>
            Continue Shopping
          </Button>
        </CardBody>
      </Card>
    </div>
  )
}

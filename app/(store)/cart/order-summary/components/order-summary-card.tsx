'use client'

import {api} from '@/convex/_generated/api'
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
import {useQuery} from 'convex/react'
import {Sparkles} from 'lucide-react'
import {useMemo, ViewTransition} from 'react'
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
  userId,
}: OrderSummaryCardProps) {
  // Get user's points balance and next visit multiplier
  const pointsBalance = useQuery(
    api.rewards.q.getUserPointsBalance,
    userId ? {userId} : 'skip',
  )

  const nextVisitMultiplier = useQuery(
    api.rewards.q.getNextVisitMultiplier,
    userId ? {userId} : 'skip',
  )

  // Calculate estimated points (assuming all products are eligible)
  // In reality, we'd need to check each product, but for UI purposes we'll estimate
  const estimatedPoints = useMemo(() => {
    if (!nextVisitMultiplier || !isAuthenticated) return null
    // Convert subtotal from cents to dollars, then multiply by multiplier
    // Points = (subtotal in dollars) × multiplier, rounded to nearest integer
    const points = Math.round((subtotal / 100) * nextVisitMultiplier.multiplier)
    return points
  }, [subtotal, nextVisitMultiplier, isAuthenticated])
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

          <div className='flex justify-between text-lg font-semibold font-space'>
            <span>Points Balance</span>
            <span>{pointsBalance?.availablePoints}</span>
          </div>
          {/* Estimated Points */}
          {isAuthenticated &&
            estimatedPoints !== null &&
            nextVisitMultiplier && (
              <>
                <Divider />
                <div className='flex items-center justify-between text-sm p-3 bg-purple-500/10 dark:bg-purple-500/20 rounded-lg border border-purple-500/20'>
                  <div className='flex items-center gap-2'>
                    <Sparkles className='size-4 text-purple-600 dark:text-purple-400' />
                    <span className='text-default-600 dark:text-default-400'>
                      Estimated Points
                    </span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <span className='font-semibold text-purple-600 dark:text-purple-400'>
                      {estimatedPoints.toLocaleString()}
                    </span>
                    <span className='text-xs text-default-500'>
                      ({nextVisitMultiplier.multiplier}x)
                    </span>
                  </div>
                </div>
                {nextVisitMultiplier.message && (
                  <p className='text-xs text-default-500 text-center'>
                    {nextVisitMultiplier.message}
                  </p>
                )}
              </>
            )}

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

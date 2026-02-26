'use client'

import {Id} from '@/convex/_generated/dataModel'
import {Icon} from '@/lib/icons'
import {formatPrice} from '@/utils/formatPrice'
import {Button, Card, CardBody, Divider} from '@heroui/react'
import {memo, ViewTransition} from 'react'
import {
  type NVMultiplier,
  PointsBalance,
  RewardsSummary,
} from '../../rewards-summary'
import type {ComputedRewards, RewardsCartItem} from '../lib/rewards'
import type {FormData, RewardsVariant} from '../types'
import {CheckoutRewardsContent} from './checkout-rewards-content'
import {CheckoutRewardsSummary} from './checkout-rewards-summary'
import {PaymentMethods} from './payment-method'

export type {RewardsVariant}

interface OrderSummaryCardProps {
  subtotal: number
  tax: number
  shipping: number
  total: number
  showTaxRow?: boolean
  isAuthenticated: boolean
  isLoading: boolean
  isPending: boolean
  orderId: string | null
  paymentMethod: FormData['paymentMethod']
  onPaymentMethodChange: (value: FormData['paymentMethod']) => void
  onPlaceOrderClick: VoidFunction
  userId?: Id<'users'>
  pointsBalance: PointsBalance | undefined
  onOpen?: VoidFunction
  minimumOrderCents?: number
  shippingFeeCents?: number
  /**
   * Which rewards panel to show. Toggle this state to swap panels.
   * - 'tier': tier-based (needs computedRewards)
   * - 'points': points/multiplier (needs nextVisitMultiplier, estimatedPoints)
   * - 'off': no panel
   * When undefined, shows tier panel if computedRewards is provided, else off.
   */
  rewardsVariant?: RewardsVariant
  /** For rewardsVariant === 'tier' */
  computedRewards?: ComputedRewards | null
  rewardsConfig?: import('../lib/rewards').RewardsConfig | null
  topUpSuggestions?: RewardsCartItem[]
  onAddTopUp?: (item: RewardsCartItem) => void
  /** For rewardsVariant === 'points' */
  nextVisitMultiplier?: NVMultiplier | undefined
  estimatedPoints?: number | null
}

export const OrderSummaryCard = memo(function OrderSummaryCard({
  subtotal,
  tax,
  shipping,
  total,
  showTaxRow = true,
  isAuthenticated,
  isLoading,
  isPending,
  orderId,
  paymentMethod,
  onPaymentMethodChange,
  onPlaceOrderClick,
  pointsBalance,
  onOpen,
  minimumOrderCents,
  rewardsVariant,
  computedRewards,
  rewardsConfig,
  topUpSuggestions,
  onAddTopUp,
  nextVisitMultiplier,
  estimatedPoints,
}: OrderSummaryCardProps) {
  const handleOnChange = (value: FormData['paymentMethod']) => {
    onPaymentMethodChange(value)
  }

  const isFreeShipping = shipping === 0
  // const minOrder = minimumOrderCents ?? 1000
  // const remainingForFreeShipping = minOrder - subtotal
  // const showTierProgress =
  //   computedRewards?.nextTier != null &&
  //   computedRewards.amountToNextTier != null &&
  //   computedRewards.amountToNextTier > 0
  // const showSimpleShippingProgress =
  //   !showTierProgress && !isFreeShipping && remainingForFreeShipping > 0
  // const progressPercent = showTierProgress
  //   ? computedRewards.progressPctToNext
  //   : Math.min(100, (subtotal / minOrder) * 100)

  const effectiveVariant: RewardsVariant =
    rewardsVariant ?? (computedRewards != null ? 'tier' : 'off')

  const rewardsPanel =
    effectiveVariant === 'tier' && computedRewards != null ? (
      <CheckoutRewardsSummary
        computedRewards={computedRewards}
        config={rewardsConfig ?? undefined}
        topUpSuggestions={topUpSuggestions}
        onAddTopUp={onAddTopUp}
      />
    ) : effectiveVariant === 'points' ? (
      <RewardsSummary
        nextVisitMultiplier={nextVisitMultiplier}
        estimatedPoints={estimatedPoints ?? null}
        pointsBalance={pointsBalance}
        isAuthenticated={isAuthenticated}
      />
    ) : null

  return (
    <div className='lg:sticky lg:top-24 h-fit space-y-4'>
      <CheckoutRewardsContent>{rewardsPanel}</CheckoutRewardsContent>
      <Card
        shadow='none'
        className='dark:bg-dark-table/40 border border-foreground/20'>
        <CardBody className='relative space-y-4 p-2 sm:p-4 md:p-6 lg:p-8'>
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
              <ViewTransition>
                {showTaxRow && (
                  <div className='flex justify-between font-okxs text-sm'>
                    <span className=''>Tax</span>
                    <span className=''>
                      <span className='opacity-80'>$</span>
                      {formatPrice(tax)}
                    </span>
                  </div>
                )}
              </ViewTransition>
              <div className='flex justify-between font-okxs text-sm'>
                <span className=''>Shipping</span>
                <span className=''>
                  {isFreeShipping ? (
                    <span className='bg-limited px-1.5 uppercase rounded-sm font-bone text-dark-gray border border-dark-gray'>
                      Free
                    </span>
                  ) : (
                    <>
                      <span className='opacity-80'>$</span>
                      {formatPrice(shipping)}
                    </>
                  )}
                </span>
              </div>
              {/*{(showTierProgress || showSimpleShippingProgress) && (
                <div className='space-y-1.5 pt-1'>
                  <div className='h-1.5 bg-foreground/10 rounded-full overflow-hidden'>
                    <div
                      className='h-full bg-brand rounded-full transition-all duration-300'
                      style={{width: `${progressPercent}%`}}
                    />
                  </div>
                  <p className='space-x-1 font-okxs text-xs'>
                    <span className='text-muted-foreground'>Add</span>
                    {showTierProgress && computedRewards ? (
                      <>
                        <MoneyFormat
                          value={computedRewards.amountToNextTier ?? 0}
                        />
                        <span className='text-muted-foreground'>
                          to unlock {computedRewards.nextTier?.label}
                        </span>
                      </>
                    ) : (
                      <>
                        <MoneyFormat value={remainingForFreeShipping / 100} />
                        <span className='text-muted-foreground'>
                          more for free shipping
                        </span>
                      </>
                    )}
                  </p>
                </div>
              )}*/}
              {/*<div className='flex justify-between font-okxs text-sm dark:purple-300/10 rounded-md'>
                <span className='text-foreground'>Reward Points</span>
                <span className=''>${pointsBalance?.availablePoints ?? 0}</span>
              </div>*/}
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
                <PaymentMethods
                  value={paymentMethod}
                  onChange={handleOnChange}
                />
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

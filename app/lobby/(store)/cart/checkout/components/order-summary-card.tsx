'use client'

import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {Icon} from '@/lib/icons'
import {formatPrice} from '@/utils/formatPrice'
import {Button, Card, CardBody, Divider} from '@heroui/react'
import {useQuery} from 'convex/react'
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
  const effectiveVariant: RewardsVariant =
    rewardsVariant ?? (computedRewards != null ? 'tier' : 'off')
  const cardsProcessingFeeSetting = useQuery(
    api.admin.q.getAdminByIdentStrict,
    {
      identifier: 'cards_processing_fee',
    },
  )
  const cardsProcessingFeePercent =
    cardsProcessingFeeSetting &&
    typeof cardsProcessingFeeSetting === 'object' &&
    !('error' in cardsProcessingFeeSetting) &&
    typeof cardsProcessingFeeSetting.percent === 'number'
      ? cardsProcessingFeeSetting.percent
      : 0
  const cardsProcessingFeeEnabled =
    cardsProcessingFeeSetting &&
    typeof cardsProcessingFeeSetting === 'object' &&
    !('error' in cardsProcessingFeeSetting) &&
    typeof cardsProcessingFeeSetting.enabled === 'boolean'
      ? cardsProcessingFeeSetting.enabled
      : false
  const isCardsFeeApplied =
    paymentMethod === 'cards' && cardsProcessingFeeEnabled
  const processingFee = isCardsFeeApplied
    ? Math.round(subtotal * (cardsProcessingFeePercent / 100))
    : 0
  const displayTotal = isCardsFeeApplied
    ? subtotal + processingFee + shipping
    : total

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
    <div className='lg:sticky lg:top-20 h-fit space-y-0'>
      <CheckoutRewardsContent>{rewardsPanel}</CheckoutRewardsContent>
      <Card
        shadow='none'
        radius='none'
        className='min-w-0 overflow-hidden dark:bg-dark-table/40 border border-foreground/20 border-t-0'>
        <CardBody className='relative space-y-4 p-4 sm:p-5'>
          <div className="absolute w-500 h-full scale-x-50 top-0 -left-150 inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 scale-100 pointer-events-none" />
          <h2 className='text-2xl font-normal font-bone'>Order Summary</h2>
          <Divider className='opacity-60' />
          <ViewTransition>
            <div className='space-y-2 font-sans'>
              <div className='flex justify-between font-okxs text-sm md:text-base'>
                <span className=''>Subtotal</span>
                <span className=''>
                  <span className=''>$</span>
                  {formatPrice(subtotal)}
                </span>
              </div>
              {isCardsFeeApplied && processingFee > 0 && (
                <div className='flex justify-between font-okxs text-sm md:text-base'>
                  <span className=''>
                    <span className='mr-2'>Processing Fee</span>
                    <span className='font-ios opacity-40'>(</span>
                    <span>{cardsProcessingFeePercent}%</span>
                    <span className='font-ios opacity-40'>)</span>
                  </span>
                  <span className=''>
                    <span className=''>$</span>
                    {formatPrice(processingFee)}
                  </span>
                </div>
              )}
              <ViewTransition>
                {showTaxRow && (
                  <div className='flex justify-between font-okxs text-sm md:text-base'>
                    <span className=''>Tax</span>
                    <span className=''>
                      <span className=''>$</span>
                      {formatPrice(tax)}
                    </span>
                  </div>
                )}
              </ViewTransition>
              <div className='flex justify-between font-okxs text-sm md:text-base'>
                <span className=''>Shipping</span>
                <span className=''>
                  {isFreeShipping ? (
                    <span className='bg-limited px-1.5 uppercase rounded-sm font-bone text-dark-gray border border-dark-gray'>
                      Free
                    </span>
                  ) : (
                    <>
                      <span className=''>$</span>
                      {formatPrice(shipping)}
                    </>
                  )}
                </span>
              </div>
            </div>
          </ViewTransition>
          <Divider className='opacity-60' />
          <div className='flex justify-between font-medium font-okxs'>
            <span className=''>Total</span>
            <span className='font-medium'>${formatPrice(displayTotal)}</span>
          </div>

          {/* Payment Method Selection */}
          {isAuthenticated && (
            <>
              <Divider className='opacity-60' />
              <PaymentMethods value={paymentMethod} onChange={handleOnChange} />
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
            radius='none'
            variant='solid'
            className='w-full font-polysans text-lg font-semibold bg-foreground dark:bg-brand text-white h-14 mb-2'
            onPress={onPlaceOrderClick}
            isDisabled={!isAuthenticated || isLoading || isPending || !!orderId}
            endContent={
              isLoading || isPending || orderId ? (
                <Icon name='spinners-ring' className='size-4' />
              ) : null
            }>
            <span className='drop-shadow-sm'>
              {orderId ? 'Order Placed!' : 'Place Order'}
            </span>
          </Button>
        </CardBody>
      </Card>
    </div>
  )
})

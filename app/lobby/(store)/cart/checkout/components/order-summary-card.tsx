'use client'

import {Id} from '@/convex/_generated/dataModel'
import {Icon} from '@/lib/icons'
import {formatPrice} from '@/utils/formatPrice'
import {Button, Card, CardBody, Divider, Input} from '@heroui/react'
import {motion} from 'motion/react'
import {memo, ViewTransition} from 'react'
import {
  type NVMultiplier,
  PointsBalance,
  RewardsSummary,
} from '../../rewards-summary'
import type {ComputedRewards, RewardsCartItem} from '../lib/rewards'
import type {FormData, RewardsVariant} from '../types'
import {CashBackRedemption} from './cash-back-redemption'
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
  cashBackBalanceCents?: number
  appliedCashBackCents?: number
  isUsingCashBack?: boolean
  onCashBackToggle?: (nextValue: boolean) => void
  couponCode: string
  couponDiscountCents?: number
  couponError?: string | null
  couponHelpText?: string | null
  isCouponApplying?: boolean
  onCouponCodeChange: (value: string) => void
  onApplyCoupon: VoidFunction
  onRemoveCoupon: VoidFunction
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
  cashBackBalanceCents = 0,
  appliedCashBackCents = 0,
  isUsingCashBack = false,
  onCashBackToggle,
  couponCode,
  couponDiscountCents = 0,
  couponError,
  couponHelpText,
  isCouponApplying = false,
  onCouponCodeChange,
  onApplyCoupon,
  onRemoveCoupon,
}: OrderSummaryCardProps) {
  const handleOnChange = (value: FormData['paymentMethod']) => {
    onPaymentMethodChange(value)
  }

  const isFreeShipping = shipping === 0
  const hasAppliedCoupon = couponDiscountCents > 0
  const effectiveVariant: RewardsVariant =
    rewardsVariant ?? (computedRewards != null ? 'tier' : 'off')
  const displayTotal = Math.max(0, total - appliedCashBackCents)

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
    <motion.div
      layout
      transition={{layout: {duration: 0.35, ease: 'easeInOut'}}}
      className='lg:sticky lg:top-20 h-fit min-h-[calc(90lvh)] space-y-0'>
      <motion.div
        layout
        transition={{layout: {duration: 0.35, ease: 'easeInOut'}}}>
        <CheckoutRewardsContent>{rewardsPanel}</CheckoutRewardsContent>
      </motion.div>
      <motion.div
        layout
        transition={{layout: {duration: 0.35, ease: 'easeInOut'}}}>
        <Card
          shadow='none'
          radius='none'
          className='min-w-0 overflow-hidden dark:bg-dark-table/40 border border-foreground/20 border-t-0'>
          <CardBody className='relative space-y-4 p-4 sm:px-5 py-4'>
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
                {hasAppliedCoupon && (
                  <div className='flex justify-between font-okxs text-sm md:text-base text-emerald-600 dark:text-emerald-400'>
                    <span>Coupon ({couponCode.trim().toUpperCase()})</span>
                    <span>- ${formatPrice(couponDiscountCents)}</span>
                  </div>
                )}
                {appliedCashBackCents > 0 && (
                  <div className='flex justify-between font-okxs text-sm md:text-base text-emerald-600 dark:text-emerald-400'>
                    <span>Cash back</span>
                    <span>- ${formatPrice(appliedCashBackCents)}</span>
                  </div>
                )}
              </div>
            </ViewTransition>
            <Divider className='opacity-60' />
            <div className='flex justify-between font-medium font-okxs'>
              <span className=''>Total</span>
              <span className='font-medium'>${formatPrice(displayTotal)}</span>
            </div>

            {isAuthenticated && (
              <div className='space-y-2 rounded-lg border border-foreground/15 p-3'>
                <div className='flex items-center justify-between gap-3'>
                  <div className='flex items-center justify-between w-full'>
                    <p className='font-okxs text-sm md:text-base'>
                      Coupon code
                    </p>
                    {couponHelpText ? (
                      <p className='text-xs text-foreground/70'>
                        {couponHelpText}
                      </p>
                    ) : couponError ? (
                      <p className='text-xs text-danger'>{couponError}</p>
                    ) : (
                      <p className='text-xs text-foreground/60'>
                        Discounts apply to subtotal only.
                      </p>
                    )}
                  </div>
                  {hasAppliedCoupon ? (
                    <Button
                      size='sm'
                      variant='light'
                      onPress={onRemoveCoupon}
                      className='min-w-fit px-2 text-xs'>
                      Remove
                    </Button>
                  ) : null}
                </div>
                <div className='flex items-center gap-2'>
                  <Input
                    value={couponCode}
                    onValueChange={onCouponCodeChange}
                    placeholder='Enter code'
                    size='sm'
                    radius='none'
                    isDisabled={isPending || isLoading || !!orderId}
                    classNames={{
                      inputWrapper: 'bg-foreground/5 shadow-none',
                    }}
                  />
                  <Button
                    radius='none'
                    size='sm'
                    variant='flat'
                    onPress={hasAppliedCoupon ? onRemoveCoupon : onApplyCoupon}
                    isDisabled={
                      isPending ||
                      isLoading ||
                      !!orderId ||
                      (!hasAppliedCoupon && couponCode.trim().length === 0)
                    }
                    isLoading={isCouponApplying}
                    className='min-w-24'>
                    {hasAppliedCoupon ? 'Applied' : 'Apply'}
                  </Button>
                </div>
              </div>
            )}

            {isAuthenticated && onCashBackToggle && (
              <CashBackRedemption
                availableBalanceCents={cashBackBalanceCents}
                appliedBalanceCents={appliedCashBackCents}
                subtotalCents={subtotal}
                isEnabled={isUsingCashBack}
                onToggle={onCashBackToggle}
              />
            )}

            {/* Payment Method Selection */}
            {isAuthenticated && (
              <>
                <Divider className='opacity-60' />
                <PaymentMethods
                  value={paymentMethod}
                  onChange={handleOnChange}
                />
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
              isDisabled={
                !isAuthenticated || isLoading || isPending || !!orderId
              }
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
      </motion.div>
    </motion.div>
  )
})

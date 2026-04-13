'use client'

import {Id} from '@/convex/_generated/dataModel'
import {
  CASH_APP_PROCESSING_FEE_PERCENT,
  formatProcessingFeePercent,
} from '@/lib/checkout/processing-fee'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {formatPrice} from '@/utils/formatPrice'
import {Button, Card, Input} from '@heroui/react'
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
  processingFeeCents?: number
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
  cashAppProcessingFeePercent?: number
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
  processingFeeCents = 0,
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
  cashAppProcessingFeePercent,
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
  const hasProcessingFee = processingFeeCents > 0
  const effectiveVariant: RewardsVariant =
    rewardsVariant ?? (computedRewards != null ? 'tier' : 'off')
  const displayTotal = Math.max(0, total - appliedCashBackCents)
  const cashAppFeePercent =
    cashAppProcessingFeePercent ?? CASH_APP_PROCESSING_FEE_PERCENT
  const processingFeeLabel =
    paymentMethod === 'cash_app'
      ? `Cash App Transaction Fee (${formatProcessingFeePercent(cashAppFeePercent)})`
      : 'Processing Fee'

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
        <Card className='min-w-0 overflow-hidden dark:bg-dark-table/40 border border-foreground/20 border-t-0 rounded-none'>
          <Card.Content className='relative space-y-2 px-2 md:px-4 lg:px-5 pb-1'>
            <div className="absolute w-500 h-full scale-x-50 top-0 -left-150 inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 scale-100 pointer-events-none" />
            <h2 className='text-lg font-normal font-bone'>Order Summary</h2>
            <ViewTransition>
              <div className='space-y-2'>
                <div className='flex justify-between font-okxs text-sm md:text-base'>
                  <span className='font-clash'>Subtotal</span>
                  <span className=''>
                    <span className=''>$</span>
                    {formatPrice(subtotal)}
                  </span>
                </div>
                <ViewTransition>
                  {showTaxRow && (
                    <div className='flex justify-between font-okxs text-sm md:text-base'>
                      <span className='font-clash'>Tax</span>
                      <span className=''>
                        <span className=''>$</span>
                        {formatPrice(tax)}
                      </span>
                    </div>
                  )}
                </ViewTransition>
                <div className='flex justify-between font-okxs text-sm md:text-base'>
                  <span className='font-clash'>Shipping</span>
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
                    <span>Rewards</span>
                    <span>- ${formatPrice(appliedCashBackCents)}</span>
                  </div>
                )}
                {hasProcessingFee && (
                  <div className='flex justify-between font-okxs text-sm md:text-base'>
                    <span>{processingFeeLabel}</span>
                    <span>+ ${formatPrice(processingFeeCents)}</span>
                  </div>
                )}
              </div>
            </ViewTransition>
            {/*<Separator className='opacity-60' />*/}
            <div className='flex justify-between font-medium font-okxs border-t border-dashed dark:border-sidebar/80 border-light-gray pt-2'>
              <span className='font-clash'>Total</span>
              <span className='font-medium'>${formatPrice(displayTotal)}</span>
            </div>

            {isAuthenticated && (
              <div className='space-y-1 mt-2 rounded-md border border-foreground/30 dark:bg-foreground/5 bg-foreground/2 overflow-hidden'>
                <div className='flex items-center justify-between gap-3'>
                  <div className='flex items-center justify-between w-full p-2'>
                    <p className='font-clash text-base md:text-[12px] leading-none'>
                      Coupon Code
                    </p>
                    {couponHelpText ? (
                      <p className='text-xs text-foreground/80 font-okxs'>
                        {couponHelpText}
                      </p>
                    ) : couponError ? (
                      <p className='flex items-center gap-1 text-xs bg-white/25 dark:bg-rose-500/10 px-1.5 rounded-sm text-danger dark:text-red-100'>
                        <Icon name='alert-circle' className='size-3.25' />
                        <span>{couponError}</span>
                      </p>
                    ) : (
                      <p
                        className={cn('text-xs text-foreground/70', {
                          'text-foreground': couponCode,
                        })}>
                        Discounts apply to subtotal only.
                      </p>
                    )}
                  </div>
                  {hasAppliedCoupon ? (
                    <Button
                      size='sm'
                      variant='tertiary'
                      onPress={onRemoveCoupon}
                      className='min-w-fit px-2 text-xs'>
                      Remove
                    </Button>
                  ) : null}
                </div>
                <div className='flex items-center gap-px border-t border-dark-table/30 dark:bg-foreground/10'>
                  <Input
                    fullWidth
                    value={couponCode}
                    onChange={(e) => onCouponCodeChange(e.target.value)}
                    placeholder='Enter code'
                    disabled={isPending || isLoading || !!orderId}
                    className={cn(
                      'text-brand text-[12px] dark:text-light-brand uppercase tracking-widest font-clash font-medium text-sm',
                      'rounded-none rounded-bl-sm rounded-e-none dark:bg-background/70 bg-background shadow-none h-9 dark:border-white/40',
                      'placeholder:font-ios placeholder:font-light placeholder:tracking-[0.4em] placeholder:opacity-60',
                      'shadow-inner outline-none focus-visible:ring-1 dark:ring-foreground/10 ring-foreground/10',
                      'rounded-tl-xs',
                    )}
                  />
                  <Button
                    size='sm'
                    variant='tertiary'
                    onPress={hasAppliedCoupon ? onRemoveCoupon : onApplyCoupon}
                    isDisabled={
                      isPending ||
                      isLoading ||
                      !!orderId ||
                      (!hasAppliedCoupon && couponCode.trim().length === 0)
                    }
                    className={cn(
                      'rounded-none rounded-br-sm min-w-32 h-9 bg-foreground/70 dark:bg-background text-white font-clash',
                      {
                        'text-brand': hasAppliedCoupon,
                        'text-cyan-100': isCouponApplying,
                        'bg-dark-table/90': couponCode,
                      },
                    )}>
                    {isCouponApplying
                      ? 'Applying ⊛⊛⊛ '
                      : hasAppliedCoupon
                        ? 'Applied'
                        : 'Apply Coupon'}
                  </Button>
                </div>
              </div>
            )}

            {isAuthenticated && onCashBackToggle && (
              <CashBackRedemption
                availableBalanceCents={cashBackBalanceCents} //cashBackBalanceCents
                appliedBalanceCents={appliedCashBackCents}
                subtotalCents={subtotal}
                isEnabled={isUsingCashBack}
                onToggle={onCashBackToggle}
              />
            )}

            {/* Payment Method Selection */}
            {isAuthenticated && (
              <>
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
              variant='primary'
              className='w-full font-polysans text-lg font-semibold bg-foreground dark:bg-brand text-white h-14 mb-2 rounded-none'
              onPress={onPlaceOrderClick}
              isDisabled={
                !isAuthenticated || isLoading || isPending || !!orderId
              }>
              <span className='drop-shadow-sm'>
                {orderId ? 'Order Placed!' : 'Place Order'}
              </span>
            </Button>
          </Card.Content>
        </Card>
      </motion.div>
    </motion.div>
  )
})

'use client'

import {CashBackRedemption} from '@/app/lobby/(store)/cart/checkout/components/cash-back-redemption'
import {useCashBackRedemption} from '@/app/lobby/(store)/cart/hooks/use-cash-back-redemption'
import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {Icon} from '@/lib/icons'
import {formatPrice} from '@/utils/formatPrice'
import {Button} from '@heroui/react'
import {useQuery} from 'convex/react'
import {memo, useTransition, ViewTransition} from 'react'

const CASH_BACK_REDEMPTION_MINIMUM_ORDER_CENTS = 5000
const CASH_BACK_APPLIED_VIEW_TRANSITION = 'cart-cash-back-applied'
const CART_SUMMARY_FOLLOW_VIEW_TRANSITION = 'cart-summary-follow-shift'

function CashBackAppliedRow({amountCents}: {amountCents: number}) {
  if (amountCents <= 0) return null
  return (
    <ViewTransition
      enter={CASH_BACK_APPLIED_VIEW_TRANSITION}
      exit={CASH_BACK_APPLIED_VIEW_TRANSITION}
      default='none'>
      <div className='flex justify-between font-clash text-lg text-emerald-600 dark:text-emerald-400 px-2'>
        <span className='font-medium'>Cash back applied</span>
        <span className='font-medium'>-${formatPrice(amountCents)}</span>
      </div>
    </ViewTransition>
  )
}

interface CartSummaryProps {
  subtotal: number
  regularSubtotal: number
  isAuthenticated: boolean
  convexUserId: Id<'users'> | null
  optimisticCartItemCount: number
  isSignedIn: boolean
  onCheckout: () => void
  onClose: () => void
}

export const CartSummary = memo(function CartSummary({
  subtotal,
  regularSubtotal,
  isAuthenticated,
  convexUserId,
  optimisticCartItemCount,
  isSignedIn,
  onCheckout,
  onClose,
}: CartSummaryProps) {
  const [, startTransition] = useTransition()
  const {
    isCashBackEnabled,
    setCashBackEnabled,
    customRedemptionCents,
    setCashBackCustomCents,
  } = useCashBackRedemption()

  const pointsBalance = useQuery(
    api.rewards.q.getUserPointsBalance,
    convexUserId ? {userId: convexUserId} : 'skip',
  )

  const saleSavingsCents = Math.max(0, regularSubtotal - subtotal)
  const availableCashBackCents = Math.max(
    0,
    Math.round((pointsBalance?.availablePoints ?? 0) * 100),
  )
  const maxRedeemableCents = Math.min(availableCashBackCents, subtotal)
  const appliedCashBackCents =
    isCashBackEnabled && subtotal >= CASH_BACK_REDEMPTION_MINIMUM_ORDER_CENTS
      ? customRedemptionCents !== null
        ? Math.min(customRedemptionCents, maxRedeemableCents)
        : maxRedeemableCents
      : 0
  const discountedSubtotal = Math.max(0, subtotal - appliedCashBackCents)

  const handleCashBackToggle = (nextValue: boolean) => {
    startTransition(() => {
      setCashBackEnabled(nextValue)
    })
  }

  return (
    <>
      <div className='font-clash space-y-3 px-3 md:px-4 mb-6'>
        <div className='flex justify-between px-2'>
          <span className='text-lg font-medium'>Subtotal</span>
          <span className='flex flex-col items-end'>
            {saleSavingsCents > 0 ? (
              <span className='text-sm font-medium text-foreground/45 line-through decoration-foreground/60 decoration-2'>
                ${formatPrice(regularSubtotal)}
              </span>
            ) : null}
            <span className='font-medium text-lg'>${formatPrice(subtotal)}</span>
          </span>
        </div>
        {saleSavingsCents > 0 ? (
          <div className='flex justify-between px-2 text-terpenes dark:text-light-brand'>
            <span className='text-sm font-medium'>Sale savings</span>
            <span className='text-sm font-medium'>
              -${formatPrice(saleSavingsCents)}
            </span>
          </div>
        ) : null}
        {isAuthenticated && (
          <CashBackRedemption
            availableBalanceCents={availableCashBackCents}
            appliedBalanceCents={appliedCashBackCents}
            subtotalCents={subtotal}
            isEnabled={isCashBackEnabled}
            onToggle={handleCashBackToggle}
            customRedemptionCents={customRedemptionCents}
            onCustomCentsChange={setCashBackCustomCents}
          />
        )}
        <CashBackAppliedRow amountCents={appliedCashBackCents} />
        <ViewTransition update={CART_SUMMARY_FOLLOW_VIEW_TRANSITION} default='none'>
          <div className='flex justify-between font-clash px-2'>
            <span className='text-lg font-medium'>
              {appliedCashBackCents > 0 ? 'Due today' : 'Current total'}
            </span>
            <span className='font-medium text-lg'>
              ${formatPrice(discountedSubtotal)}
            </span>
          </div>
        </ViewTransition>
        <ViewTransition update={CART_SUMMARY_FOLLOW_VIEW_TRANSITION} default='none'>
          <div className='flex justify-between font-clash px-2'>
            <span className='text-lg font-medium'>Total Items</span>
            <span className='font-medium text-lg'>{optimisticCartItemCount}</span>
          </div>
        </ViewTransition>
      </div>

      <ViewTransition update={CART_SUMMARY_FOLLOW_VIEW_TRANSITION} default='none'>
        <div className='mx-auto mb-3 px-4'>
          <Button
            size='lg'
            className='w-full sm:flex-1 h-15 font-polysans font-normal text-lg bg-foreground/95 text-white dark:text-dark-gray rounded-xs'
            onPress={onCheckout}>
            <span className='font-bold font-polysans text-lg'>
              {isSignedIn ? 'Checkout' : 'Sign in'}
            </span>
          </Button>
        </div>
      </ViewTransition>
      <ViewTransition update={CART_SUMMARY_FOLLOW_VIEW_TRANSITION} default='none'>
        <button
          type='button'
          onClick={onClose}
          className='font-okxs w-full text-sm text-color-muted hover:text-foreground transition-colors text-center py-2'>
          Continue Shopping
        </button>
      </ViewTransition>
    </>
  )
})

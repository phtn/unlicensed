'use client'

import {Button} from '@heroui/react'
import {formatPrice} from '@/utils/formatPrice'
import {cn} from '@/lib/utils'

interface CashBackRedemptionProps {
  availableBalanceCents: number
  appliedBalanceCents: number
  subtotalCents: number
  isEnabled: boolean
  onToggle: (nextValue: boolean) => void
  minimumOrderCents?: number
  className?: string
}

const DEFAULT_MINIMUM_REDEMPTION_ORDER_CENTS = 5000

export function CashBackRedemption({
  availableBalanceCents,
  appliedBalanceCents,
  subtotalCents,
  isEnabled,
  onToggle,
  minimumOrderCents = DEFAULT_MINIMUM_REDEMPTION_ORDER_CENTS,
  className,
}: CashBackRedemptionProps) {
  const hasBalance = availableBalanceCents > 0
  const isEligibleOrder = subtotalCents >= minimumOrderCents
  const canRedeem = hasBalance && isEligibleOrder

  return (
    <div
      className={cn(
        'rounded-lg border border-foreground/15 bg-foreground/[0.03] p-3',
        className,
      )}>
      <div className='flex items-start justify-between gap-3'>
        <div className='space-y-1'>
          <p className='text-sm font-semibold font-okxs'>Cash back balance</p>
          <p className='text-xs text-muted-foreground'>
            Available now on eligible orders.
          </p>
        </div>
        <span className='text-base font-semibold font-okxs'>
          ${formatPrice(availableBalanceCents)}
        </span>
      </div>

      <div className='mt-3 flex items-center justify-between gap-3'>
        <div className='min-w-0'>
          <p className='text-sm font-medium font-okxs'>
            {appliedBalanceCents > 0
              ? `Applied: -$${formatPrice(appliedBalanceCents)}`
              : 'Use cash back on this order'}
          </p>
          {!canRedeem ? (
            <p className='text-xs text-muted-foreground'>
              {hasBalance
                ? 'Cash back redeemable on orders over $50.'
                : 'Complete orders to build up cash back.'}
            </p>
          ) : null}
        </div>

        <Button
          size='sm'
          radius='none'
          variant={isEnabled && canRedeem ? 'solid' : 'flat'}
          className={cn(
            'shrink-0 rounded-sm font-okxs',
            isEnabled && canRedeem
              ? 'bg-foreground text-background dark:bg-white dark:text-dark-table'
              : 'bg-foreground/5 text-foreground/80',
          )}
          isDisabled={!canRedeem}
          onPress={() => onToggle(!isEnabled)}>
          {isEnabled && canRedeem ? 'Applied' : 'Use'}
        </Button>
      </div>
    </div>
  )
}

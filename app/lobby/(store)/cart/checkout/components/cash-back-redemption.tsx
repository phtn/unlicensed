'use client'

import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {formatPrice} from '@/utils/formatPrice'
import {Button} from '@heroui/react'

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
        'rounded-lg border border-foreground/15 bg-foreground/3 p-3',
        className,
      )}>
      <div className='flex items-start justify-between gap-3'>
        <div className='space-y-1'>
          <p className='text-base font-semibold font-clash'>
            Available Rewards Points
          </p>
          <div className='text-xs font-normal text-foreground/60'>
            {canRedeem && (
              <Icon
                name='check'
                className='text-emerald-600 inline-block size-3.5'
              />
            )}{' '}
            {canRedeem
              ? 'Eligible for redemption'
              : 'Redeemable on orders over $50.'}
          </div>
        </div>
        <span className='text-base font-semibold font-okxs'>
          ${formatPrice(availableBalanceCents)}
        </span>
      </div>

      <div className='mt-3 flex items-center justify-between gap-3'>
        <div className='min-w-0'>
          <p className='text-base font-medium font-okxs'>
            {!canRedeem
              ? `$${formatPrice(5000 - availableBalanceCents)} away to redeem points.`
              : appliedBalanceCents > 0
                ? `Applied: -$${formatPrice(appliedBalanceCents)}`
                : 'Use Rewards on this order'}
          </p>
          {!canRedeem ? (
            <p className='text-xs text-muted-foreground'>
              {hasBalance ? '' : 'Complete orders to build up cash back.'}
            </p>
          ) : null}
        </div>

        <Button
          size='sm'
          radius='none'
          variant={isEnabled && canRedeem ? 'solid' : 'flat'}
          className={cn(
            'shrink-0 rounded-xs font-okxs',
            isEnabled && canRedeem
              ? 'bg-foreground text-background dark:bg-white dark:text-dark-table'
              : 'bg-brand text-white',
          )}
          isDisabled={!canRedeem}
          onPress={() => onToggle(!isEnabled)}>
          {isEnabled && canRedeem ? (
            <div className='flex items-center justify-center space-x-1'>
              <span>Rewards Points applied</span>
              <Icon name='check' className='text-emerald-500 size-3.5' />
            </div>
          ) : (
            'Use Rewards'
          )}
        </Button>
      </div>
    </div>
  )
}

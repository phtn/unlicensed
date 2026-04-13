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
  // appliedBalanceCents,
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
        'rounded-md border border-brand/80 bg-brand/5 p-3',
        className,
      )}>
      <div className='flex items-start justify-between'>
        <div className='space-y-1'>
          <p className='font-clash text-base md:text-[13px] leading-none'>
            {availableBalanceCents ? 'Available Rewards' : 'Rewards'}
          </p>
          <div className='flex items-center space-x-1.5 text-sm font-normal text-foreground/80 tracking-wide'>
            {canRedeem && (
              <Icon
                name='checked'
                className='text-emerald-600 inline-block size-3'
              />
            )}
            <span className='h-3'>
              {canRedeem
                ? 'Eligible for redemption'
                : availableBalanceCents
                  ? `$${formatPrice(5000 - subtotalCents)} away to redeem points.`
                  : `Complete orders to build up cash back.`}
            </span>
          </div>
        </div>
        {canRedeem ? (
          <UseRewardsPoints
            isEnabled={isEnabled}
            canRedeem={canRedeem}
            available={availableBalanceCents}
            toggleFn={() => onToggle(!isEnabled)}></UseRewardsPoints>
        ) : (
          <span className='text-base font-semibold font-okxs'>
            $
            {formatPrice(
              availableBalanceCents,
              availableBalanceCents > 0 ? 2 : 0,
            )}
          </span>
        )}
      </div>

      <div className='mt-2 flex items-end justify-between gap-3'>
        <div className='min-w-0'>
          {/*<p className='text-xs text-foreground/80 font-okxs font-normal tracking-wide'>
            {appliedBalanceCents > 0 &&
              `Applied: -$${formatPrice(appliedBalanceCents)}`}
          </p>*/}
          {/*'Complete orders to build up cash back.'*/}
          {/* {!canRedeem ? ( */}
          {/*   <p className='text-xs text-muted-foreground'> */}
          {/*     {hasBalance ? '' : 'Complete orders to build up cash back.'} */}
          {/*   </p> */}
          {/* ) : null} */}
        </div>
      </div>
    </div>
  )
}

interface UseRewardsPointsProps {
  isEnabled: boolean
  canRedeem: boolean
  available: number
  toggleFn: VoidFunction
}
const UseRewardsPoints = ({
  isEnabled,
  canRedeem,
  available,
  toggleFn,
}: UseRewardsPointsProps) => {
  return (
    <Button
      size='sm'
      variant={isEnabled && canRedeem ? 'primary' : 'secondary'}
      className={cn('shrink-0 rounded-xs font-okxs h-9 hidden', {
        'flex bg-brand text-background dark:bg-white dark:text-dark-table':
          available > 0 && canRedeem,
      })}
      isDisabled={!canRedeem}
      onPress={toggleFn}>
      {isEnabled && canRedeem ? (
        <div className='font-clash font-medium flex items-center justify-center space-x-2'>
          <span>Rewards Points applied</span>
          <Icon
            name='checked'
            className='dark:text-white text-white size-3.5'
          />
        </div>
      ) : (
        `Use rewards ($${formatPrice(available)})`
      )}
    </Button>
  )
}

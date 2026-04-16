'use client'

import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {formatPrice} from '@/utils/formatPrice'
import {Button} from '@heroui/react'
import {useCallback, useState} from 'react'

interface CashBackRedemptionProps {
  availableBalanceCents: number
  appliedBalanceCents: number
  subtotalCents: number
  isEnabled: boolean
  onToggle: (nextValue: boolean) => void
  customRedemptionCents: number | null
  onCustomCentsChange: (cents: number | null) => void
  minimumOrderCents?: number
  className?: string
}

const DEFAULT_MINIMUM_REDEMPTION_ORDER_CENTS = 5000

export function CashBackRedemption({
  availableBalanceCents,
  subtotalCents,
  isEnabled,
  onToggle,
  customRedemptionCents,
  onCustomCentsChange,
  minimumOrderCents = DEFAULT_MINIMUM_REDEMPTION_ORDER_CENTS,
  className,
}: CashBackRedemptionProps) {
  const hasBalance = availableBalanceCents > 0
  const isEligibleOrder = subtotalCents >= minimumOrderCents
  const canRedeem = hasBalance && isEligibleOrder

  const maxRedeemable = Math.min(availableBalanceCents, subtotalCents)
  const effectiveCents =
    customRedemptionCents !== null
      ? Math.min(customRedemptionCents, maxRedeemable)
      : maxRedeemable

  return (
    <div
      className={cn(
        'relative rounded-sm border border-foreground/40 bg-foreground/5 dark:bg-sidebar/50 p-1 md:p-2 md:h-18 overflow-hidden',
        className,
      )}>
      <div className="absolute w-full h-full inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-60 scale-100 pointer-events-none" />
      <div className='flex items-start justify-between'>
        <div className='space-y-1.5 px-1 py-2 md:p-2'>
          <p className='font-polysans text-base md:tracking-wide leading-none'>
            {availableBalanceCents ? 'Available Rewards' : 'Rewards'}
          </p>
          <div className='flex items-center space-x-1.5 text-sm font-normal text-foreground/80 tracking-wide'>
            {canRedeem && (
              <Icon
                name='checked'
                className='text-emerald-600 inline-block size-3'
              />
            )}
            <span className='h-3 whitespace-nowrap'>
              {canRedeem
                ? 'Redeemable'
                : availableBalanceCents
                  ? `$${formatPrice(5000 - subtotalCents)} away to redeem points.`
                  : `Complete orders to build up cash back.`}
            </span>
          </div>
        </div>
        {canRedeem ? (
          isEnabled ? (
            <PointsInput
              effectiveCents={effectiveCents}
              availableCents={availableBalanceCents}
              maxRedeemable={maxRedeemable}
              customCents={customRedemptionCents}
              onCustomCentsChange={onCustomCentsChange}
              onDisable={() => onToggle(false)}
            />
          ) : (
            <UseRewardsPoints
              isEnabled={false}
              canRedeem={canRedeem}
              available={availableBalanceCents}
              toggleFn={() => onToggle(true)}
            />
          )
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

      {/*<div className='mt-2 flex items-end justify-between gap-3'>
        <div className='min-w-0' />
      </div>*/}
    </div>
  )
}

interface PointsInputProps {
  effectiveCents: number
  availableCents: number
  maxRedeemable: number
  customCents: number | null
  onCustomCentsChange: (cents: number | null) => void
  onDisable: () => void
}

function PointsInput({
  availableCents,
  maxRedeemable,
  customCents,
  onCustomCentsChange,
  onDisable,
}: PointsInputProps) {
  // Display values in dollars — input accepts whole dollars only
  const maxDollars = maxRedeemable / 100

  // At max → show exact decimal (e.g. "1.25"); below max → integer only (e.g. "1")
  const formatDollars = (d: number) =>
    Number.isInteger(d) ? String(d) : d.toFixed(2)
  const derivedDisplay =
    customCents !== null
      ? String(Math.floor(customCents / 100))
      : formatDollars(maxDollars)
  const [inputValue, setInputValue] = useState(derivedDisplay)
  const [isEditing, setIsEditing] = useState(false)

  if (!isEditing && inputValue !== derivedDisplay) {
    setInputValue(derivedDisplay)
  }

  const commitValue = useCallback(
    (raw: string, clampDisplay = false) => {
      const parsed = parseInt(raw, 10)
      if (isNaN(parsed) || parsed <= 0) {
        if (clampDisplay) setInputValue(formatDollars(maxDollars))
        onCustomCentsChange(null)
        return
      }
      const enteredCents = parsed * 100
      if (enteredCents >= maxRedeemable) {
        if (clampDisplay) setInputValue(formatDollars(maxDollars))
        onCustomCentsChange(null)
      } else {
        if (clampDisplay) setInputValue(String(parsed))
        onCustomCentsChange(enteredCents)
      }
    },
    [maxDollars, maxRedeemable, onCustomCentsChange],
  )

  return (
    <div className='space-y-0.5 _md:space-y-1'>
      <div className='flex items-center gap-1 shrink-0'>
        <div className='flex flex-row items-center gap-1 md:gap-1.5'>
          <div className='relative'>
            <input
              type='text'
              inputMode='numeric'
              aria-label='Reward dollars to redeem'
              value={inputValue}
              onFocus={() => setIsEditing(true)}
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9]/g, '')
                setInputValue(v)
                commitValue(v)
              }}
              onBlur={() => {
                commitValue(inputValue, true)
                setIsEditing(false)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  commitValue(inputValue, true)
                  setIsEditing(false)
                }
              }}
              className={cn(
                'w-20 h-7 ps-5 pe-1 rounded-xs border border-light-gray dark:border-dark-table focus:border-brand focus:outline-none text-right text-sm font-okxs font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
                {'w-20': availableCents >= 1000},
              )}
            />

            <span className='absolute left-2 top-1 text-sm font-okxs font-medium opacity-60'>
              $
            </span>
          </div>
        </div>
        <Button
          size='sm'
          isIconOnly
          variant='ghost'
          className='shrink-0 size-7 md:size-7 min-w-0 rounded-xs dark:hover:bg-transparent md:dark:hover:bg-dark-table ring-offset-0 focus-visible:ring-1'
          aria-label='Remove rewards'
          onPress={onDisable}>
          <Icon name='x' className='size-3.5' />
        </Button>
      </div>

      <button
        id='max-redeemable'
        onClick={() => {
          setInputValue(formatDollars(maxDollars))
          onCustomCentsChange(null)
        }}
        className='text-foreground font-clash whitespace-nowrap cursor-pointer group space-x-1.5 min-w-20'>
        <strong className='font-clash font-black text-xs tracking-widest md:tracking-normal opacity-80'>
          MAX
        </strong>
        <span className='font-clash font-normal text-sm text-brand dark:text-pink-200 dark:group-hover:text-pink-200'>
          ${formatPrice(availableCents)}
        </span>
      </button>
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
      className={cn('shrink-0 rounded-xs font-okxs h-13 hidden', {
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
            className='dark:text-emerald-500 text-white size-3.5'
          />
        </div>
      ) : (
        <span>
          Use Rewards <span className='font-ios font-light opacity-50'>(</span>
          <span className='font-clash font-medium text-white dark:text-light-brand opacity-100'>
            ${formatPrice(available)}
          </span>
          <span className='font-ios font-light opacity-50'>)</span>
        </span>
      )}
    </Button>
  )
}

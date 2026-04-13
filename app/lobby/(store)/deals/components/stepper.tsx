'use client'

import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Button} from '@heroui/react'

interface StepperProps {
  value: number
  min?: number
  max: number
  onIncrement: () => void
  onDecrement: () => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
  isComplete: boolean
}

export function Stepper({
  value,
  min = 0,
  max,
  onIncrement,
  onDecrement,
  disabled = false,
  size = 'md',
  className,
  isComplete,
}: StepperProps) {
  const canDecrement = value > min
  const canIncrement = value < max

  const sizeClasses = {
    sm: 'size-7 text-xs',
    md: 'size-9 text-sm',
    lg: 'size-11 text-base',
  }

  return (
    <div className={cn('inline-flex items-center gap-x-1', className)}>
      <Button
        isIconOnly
        size={size}
        variant='ghost'
        className={cn(
          'h-7 w-8 rounded-xs',
          sizeClasses[size],
          !canDecrement && 'opacity-40 cursor-not-allowed',
        )}
        isDisabled={!canDecrement || disabled}
        onPress={onDecrement}
        aria-label='Decrease quantity'>
        <Icon name='minus' className='size-4' />
      </Button>
      <span
        className={cn(
          'font-clash text-base font-medium w-7 text-center',
          size === 'sm' && 'text-xs',
          size === 'md' && 'text-sm',
          size === 'lg' && 'text-base',
        )}
        aria-live='polite'>
        {value}
      </span>
      <Button
        isIconOnly
        size={size}
        variant='ghost'
        className={cn(
          'h-7 w-8 rounded-xs',
          !canIncrement && 'opacity-40 cursor-not-allowed',
        )}
        isDisabled={!canIncrement || disabled || isComplete}
        onPress={onIncrement}
        aria-label='Increase quantity'>
        <Icon name='plus' className='size-4' />
      </Button>
    </div>
  )
}

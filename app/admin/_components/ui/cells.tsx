import {ClassName} from '@/app/types'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {formatDate} from '@/utils/date'
import {formatPrice} from '@/utils/formatPrice'
import {Button} from '@heroui/react'

export const textCell = (value: string) => {
  return (
    <div className='flex flex-col'>
      <p className='text-bold text-sm whitespace-nowrap'>{value}</p>
    </div>
  )
}

export const dateCell = (value: number) => {
  return (
    <div className='flex flex-col'>
      <p className='text-bold text-sm whitespace-nowrap'>{formatDate(value)}</p>
    </div>
  )
}

export const moneyCell = (value: number) => {
  return (
    <div className='flex flex-col items-end w-full'>
      <p className='whitespace-nowrap font-semibold text-sm font-space text-right'>
        {formatPrice(value)}
      </p>
    </div>
  )
}

export const actionsCell = (selected: boolean, fn: VoidFunction) => {
  return (
    <div className='relative flex items-center justify-center'>
      <Button
        size='sm'
        isIconOnly
        variant='light'
        className={cn('text-xs text-foreground/60 font-space', {
          'text-primary': selected,
        })}
        onPress={fn}>
        <Icon name='details' className='size-5' />
      </Button>
    </div>
  )
}

/**
 *
 * ORDER STATUS
 * 1. Pending Payment
 * 2. Order Processing
 * 3. Awaiting Courier Pick up
 * 4. Shipping
 * 5. Resend
 * 6. Shipped
 */

type StatusCode =
  | 'pending_payment'
  | 'order_processing'
  | 'awaiting_courier_pickup'
  | 'shipping'
  | 'resend'
  | 'shipped'
  | 'cancelled'
  | 'default'

const colorMap: Record<StatusCode, ClassName> = {
  pending_payment: 'bg-amber-400/25 dark:bg-orange-300/45',
  order_processing: 'bg-sky-600/20 dark:bg-blue-400/45',
  awaiting_courier_pickup: 'bg-orange-200/65 dark:bg-orange-400/45',
  shipping: 'bg-purple-200/70 dark:bg-purple-400/35',
  resend: 'bg-red-200/70 dark:bg-red-400/50',
  shipped: 'bg-emerald-400/35 dark:bg-emerald-400/35',
  cancelled: 'dark:bg-red-400/40',
  default: 'bg-[#e8e6e5]',
}

export const statusCell = (status: string) => {
  const normalizedStatus = status.toLowerCase() as StatusCode
  const color = colorMap[normalizedStatus] || colorMap.default
  const displayStatus = status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
  return (
    <div
      className={cn(
        'flex items-center uppercase justify-center rounded-sm w-fit px-2 py-1.5 font-mono shadow-none',
        color,
      )}>
      <p className='text-xs tracking-wider font-brk whitespace-nowrap drop-shadow-xs'>
        {displayStatus}
      </p>
    </div>
  )
}

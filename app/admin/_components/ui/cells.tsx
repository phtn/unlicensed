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
 * 3. Awaiting Courier
 * 4. Pick up
 * 5. Shipping
 * 6. Resend
 * 7. Shipped
 */

type StatusCode =
  | 'pending'
  | 'awaiting'
  | 'shipping'
  | 'processing'
  | 'special'
  | 'cancelled'
  | 'shipped'
  | 'delivered'
  | 'confirmed'
  | 'refunded'
  | 'default'

const colorMap: Record<StatusCode, ClassName> = {
  // pending: 'bg-[#fde1b8]',
  // confirmed: 'bg-[#f7dac3]',
  confirmed: 'bg-indigo-200/70 dark:bg-indigo-400/25',
  pending: 'bg-orange-200/65 dark:bg-orange-400/25',
  processing: 'bg-sky-600/20 dark:bg-blue-400/35',
  special: 'bg-purple-200/70 dark:bg-purple-400/25 _bg-indigo-600/15',
  default: 'bg-[#e8e6e5]',
  cancelled: 'dark:bg-red-400/40', //bg-red-500/20
  shipping: 'bg-[#e4d9e9] dark:bg-lime-300/45',
  shipped: 'bg-emerald-400/35 dark:bg-emerald-400/35', //#d4ead8
  awaiting: 'bg-amber-400/25 dark:bg-orange-300/45', //#e1d5eb
  refunded: 'bg-amber-400/25 dark:bg-orange-300/45', //#e1d5eb
  delivered: 'bg-emerald-400/35 dark:bg-emerald-400/35',
}

export const statusCell = (status: StatusCode) => {
  const color = colorMap[status.toLowerCase() as StatusCode] || 'default'
  return (
    <div
      className={cn(
        'flex items-center uppercase justify-center rounded-sm w-fit px-2 py-1.5 font-mono shadow-none',
        color,
      )}>
      <p className='text-bold text-xs tracking-wider font-normal whitespace-nowrap drop-shadow-xs'>
        {status}
      </p>
    </div>
  )
}

import {OrderStatus} from '@/convex/orders/d'
import {cn} from '@/lib/utils'
import {Chip} from '@heroui/react'

interface Props {
  status: OrderStatus
}

const chipColorByStatus = {
  pending_payment: 'warning',
  order_processing: 'success',
  awaiting_courier_pickup: 'default',
  shipping: 'default',
  resend: 'warning',
  shipped: 'success',
  delivered: 'success',
  cancelled: 'danger',
} as const

export const OrderStatusBadge = ({status}: Props) => {
  return (
    <Chip
      color={chipColorByStatus[status]}
      variant='secondary'
      className={cn(
        'ml-1 rounded-sm border-none px-1 uppercase font-ios dark:bg-black/30 bg-dark-table',
        {
          'bg-emerald-500 dark:bg-emerald-500/80 text-white opacity-100':
            status === 'order_processing',
        },
        {
          'bg-foreground dark:bg-background text-orange-300 opacity-100':
            status === 'pending_payment',
        },
      )}
      size='sm'>
      {pmap[status]}
    </Chip>
  )
}

const pmap: Record<OrderStatus, string> = {
  pending_payment: 'Pending Payment',
  order_processing: 'Paid',
  awaiting_courier_pickup: 'Awaiting Courier Pickup',
  resend: 'Resend',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

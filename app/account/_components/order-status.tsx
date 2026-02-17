import {OrderStatus} from '@/convex/orders/d'
import {cn} from '@/lib/utils'
import {Chip, ChipProps} from '@heroui/react'

interface Props {
  status: OrderStatus
}

export const OrderStatusBadge = ({status}: Props) => {
  function getStatusColor(status: string) {
    switch (status) {
      case 'pending_payment':
        return 'warning'
      case 'order_processing':
        return 'success'
      case 'awaiting_courier_pickup':
        return 'secondary'
      case 'shipping':
        return 'default'
      case 'resend':
        return 'warning'
      case 'shipped':
        return 'success'
      case 'delivered':
        return 'success'
      case 'cancelled':
        return 'danger'
      default:
        return 'default'
    }
  }

  function formatStatus(status: string) {
    return status
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  return (
    <Chip
      color={getStatusColor(status) as ChipProps['color']}
      variant='faded'
      radius='none'
      className={cn(
        'ml-1 px-1 border-none rounded-sm uppercase font-brk dark:bg-black/30 bg-dark-table',
        {
          'bg-emerald-500 dark:bg-emerald-500/80 text-white opacity-100':
            status === 'order_processing',
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

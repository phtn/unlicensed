import {OrderStatus} from '@/convex/orders/d'
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
        return 'primary'
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
      className='ml-1 px-1 border-none rounded-sm dark:text-orange-300 uppercase font-brk dark:bg-black/30'
      size='sm'>
      {formatStatus(status)}
    </Chip>
  )
}

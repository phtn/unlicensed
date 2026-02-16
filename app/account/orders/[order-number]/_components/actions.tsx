import {OrderStatus} from '@/convex/orders/d'
import {Icon} from '@/lib/icons'
import {Button} from '@heroui/react'
import {useMemo} from 'react'

interface Props {
  status: OrderStatus
}

export const Actions = ({status}: Props) => {
  const action = useMemo(() => {
    switch (status) {
      case 'pending_payment':
        return (
          <Button
            size='md'
            radius='none'
            color='success'
            className='border-none bg-success/80 rounded-lg font-okxs font-semibold dark:text-white text-base'>
            <span className='drop-shadow-xs'>Complete Payment</span>
          </Button>
        )
      case 'cancelled':
        return (
          <div className='flex flex-col items-center justify-center'>
            <Icon name='check' className='size-12 text-green-500' />
            <p className='text-center text-sm font-semibold text-gray-500'>
              Order Cancelled
            </p>
          </div>
        )
      case 'delivered':
        return (
          <div className='flex flex-col items-center justify-center'>
            <Icon name='check' className='size-12 text-green-500' />
            <p className='text-center text-sm font-semibold text-gray-500'>
              Order Delivered
            </p>
          </div>
        )
      default:
        return null
    }
  }, [status])

  return <div className='flex flex-col gap-4'>{action}</div>
}

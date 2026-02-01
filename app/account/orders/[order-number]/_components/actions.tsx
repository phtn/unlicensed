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
            radius='sm'
            color='success'
            endContent={<Icon name='chevron-right' className='size-4' />}
            className='border-none font-okxs font-semibold dark:text-white text-base'>
            <span className='drop-shadow-xs'>Continue with Payment</span>
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
      default:
        return null
    }
  }, [status])

  return <div className='flex flex-col gap-4'>{action}</div>
}

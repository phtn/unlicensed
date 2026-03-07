import {OrderStatus} from '@/convex/orders/d'
import {Icon} from '@/lib/icons'
import {Button} from '@heroui/react'
import Link from 'next/link'
import {Activity, useMemo} from 'react'

interface Props {
  status: OrderStatus
  href: string
  isMobile?: boolean
}

export const Actions = ({status, href, isMobile}: Props) => {
  const action = useMemo(() => {
    switch (status) {
      case 'pending_payment':
        return (
          <Button
            size={'md'}
            as={Link}
            href={href}
            radius='none'
            color='success'
            className='border-none bg-brand/80 rounded-xs font-okxs font-semibold dark:text-white text-base'>
            <Activity mode={isMobile ? 'hidden' : 'visible'}>
              <span className='drop-shadow-xs'>Complete Payment</span>
            </Activity>
            <Activity mode={isMobile ? 'visible' : 'hidden'}>
              <span className='drop-shadow-xs'>Pay</span>
            </Activity>
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
  }, [status, href, isMobile])

  return <div className='flex flex-col gap-4'>{action}</div>
}

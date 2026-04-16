import {Button} from '@/components/ui/button'
import {OrderStatus} from '@/convex/orders/d'
import {Icon} from '@/lib/icons'
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
            asChild
            size='lg'
            className='rounded-xs border-none bg-brand text-base font-okxs font-semibold text-white dark:bg-brand/80'>
            <Link href={href}>
              <Activity mode={isMobile ? 'hidden' : 'visible'}>
                <span className='drop-shadow-xs'>Complete Payment</span>
              </Activity>
              <Activity mode={isMobile ? 'visible' : 'hidden'}>
                <span className='drop-shadow-xs'>Pay</span>
              </Activity>
            </Link>
          </Button>
        )
      case 'cancelled':
        return (
          <div className='flex items-center justify-center space-x-1'>
            <Icon name='cancel-circle' className='size-3 text-rose-500' />
            <p className='text-center text-sm font-semibold text-gray-400'>
              Order Cancelled
            </p>
          </div>
        )
      case 'delivered':
        return (
          <div className='flex items-center justify-center space-x-1'>
            <Icon name='check' className='size-3 text-green-500' />
            <p className='text-center text-sm font-semibold text-gray-400'>
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

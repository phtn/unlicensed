'use client'

import {api} from '@/convex/_generated/api'
import {Icon} from '@/lib/icons'
import {Button, Card, Chip, ChipProps} from '@heroui/react'
import {useQuery} from 'convex/react'
import {useRouter} from 'next/navigation'
import {OrderDetailsForm} from '../order-details-form'

const statusColorMap: Record<string, ChipProps['color']> = {
  pending: 'warning',
  confirmed: 'primary',
  processing: 'secondary',
  shipped: 'success',
  delivered: 'success',
  cancelled: 'danger',
  refunded: 'default',
}

interface ContentProps {
  orderNumber: string
}

export const Content = ({orderNumber}: ContentProps) => {
  const order = useQuery(api.orders.q.getOrderByNumber, {orderNumber})
  const router = useRouter()

  if (order === undefined) {
    return (
      <main className='min-h-screen px-4 pb-16'>
        <Card shadow='sm' className='p-4'>
          <p className='text-sm text-gray-400'>Loading order...</p>
        </Card>
      </main>
    )
  }

  if (order === null) {
    return (
      <main className='min-h-screen px-4 pb-16'>
        <Card shadow='sm' className='p-4'>
          <div className='space-y-4'>
            <h1 className='text-xl font-semibold'>Order Not Found</h1>
            <p className='text-sm text-gray-400'>
              Order {orderNumber} could not be found.
            </p>
            <Button onPress={router.back} color='primary' variant='flat'>
              Back to Orders
            </Button>
          </div>
        </Card>
      </main>
    )
  }

  return (
    <main className='min-h-screen px-4 pb-16'>
      <div className='space-y-6'>
        {/* Header with back button */}
        <div className='flex items-center gap-4'>
          <Button
            onPress={router.back}
            isIconOnly
            variant='light'
            aria-label='Back to orders'
            className='min-w-0'>
            <Icon name='chevron-left' className='size-4' />
          </Button>
          <div className='flex-1'>
            <h1 className='text-2xl font-semibold'>Order Details</h1>
            <p className='text-sm text-gray-400 mt-1'>{order.orderNumber}</p>
          </div>
          <Chip
            className='capitalize'
            color={statusColorMap[order.orderStatus] || 'default'}
            size='sm'
            variant='flat'>
            {order.orderStatus}
          </Chip>
        </div>

        {/* Order Details Form */}
        <Card shadow='sm' className='p-6'>
          <OrderDetailsForm order={order} hideHeader />
        </Card>
      </div>
    </main>
  )
}

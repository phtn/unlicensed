'use client'

import {Select} from '@/components/hero-v3/select'
import {api} from '@/convex/_generated/api'
import type {OrderStatus} from '@/convex/orders/d'
import {useAuthCtx} from '@/ctx/auth'
import {useCopy} from '@/hooks/use-copy'
import {Icon} from '@/lib/icons'
import {Button, Card} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import {useRouter} from 'next/navigation'
import {useCallback} from 'react'
import {OrderDetailsForm} from '../order-details-form'

const statusOptions: {value: OrderStatus; label: string}[] = [
  {value: 'pending_payment', label: 'Pending Payment'},
  {value: 'order_processing', label: 'Order Processing'},
  {value: 'awaiting_courier_pickup', label: 'Awaiting Courier Pickup'},
  {value: 'resend', label: 'Resend'},
  {value: 'shipped', label: 'Shipped'},
  {value: 'delivered', label: 'Delivered'},
  {value: 'cancelled', label: 'Cancelled'},
]

interface ContentProps {
  orderNumber: string
}

export const Content = ({orderNumber}: ContentProps) => {
  const order = useQuery(api.orders.q.getOrderByNumber, {orderNumber})
  const router = useRouter()
  const {user} = useAuthCtx()
  const updateOrderStatus = useMutation(api.orders.m.updateOrderStatus)
  const {copy, copied} = useCopy({timeout: 2000})

  const handleCopyOrderNumber = useCallback(() => {
    if (!order) return
    copy('orderNumber', order.orderNumber.substring(5))
  }, [order, copy])

  if (order === undefined) {
    return (
      <main className='min-h-screen px-4 pb-16'>
        <Card className='p-4'>
          <p className='text-sm text-gray-400'>Loading order...</p>
        </Card>
      </main>
    )
  }

  if (order === null) {
    return (
      <main className='min-h-screen px-4 pb-16'>
        <Card className='p-4'>
          <div className='space-y-4'>
            <h1 className='text-xl font-semibold'>Order Not Found</h1>
            <p className='text-sm text-gray-400'>
              Order {orderNumber} could not be found.
            </p>
            <Button onPress={router.back} variant='tertiary'>
              Back to Orders
            </Button>
          </div>
        </Card>
      </main>
    )
  }

  return (
    <main className='min-h-screen px-4 md:px-1 pb-16'>
      <div className='space-y-6'>
        {/* Header with back button */}
        <div className='flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-4'>
          <Button
            size='lg'
            isIconOnly
            variant='secondary'
            onPress={router.back}
            aria-label='Back to orders'
            className='min-w-0 rounded-lg border-none'>
            <Icon name='chevron-left' className='size-4' />
          </Button>
          <div className='min-w-0 flex-1'>
            <h1 className='text-xl font-semibold'>Order Details</h1>
            <div className='flex min-w-0 items-center gap-3'>
              <p className='mt-0.5 min-w-0 break-all font-mono text-base opacity-70'>
                {order.orderNumber.substring(5)}
              </p>
              <Icon
                name={copied ? 'check' : 'copy'}
                onClick={handleCopyOrderNumber}
                className='size-4'
              />
            </div>
          </div>
          {/* Status */}
          <div className='w-full sm:w-auto sm:min-w-sm'>
            <Select
              label='Order Status'
              value={order.orderStatus}
              onChange={(key) => {
                if (key)
                  updateOrderStatus({
                    orderId: order._id,
                    status: key as OrderStatus,
                    updatedBy: user?.uid,
                  })
              }}
              aria-label='Order status'
              options={statusOptions.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
            />
          </div>
        </div>

        {/* Order Details Form */}
        <Card className='border-none rounded-none shadow-none p-1 md:p-0'>
          <OrderDetailsForm order={order} hideHeader />
        </Card>
      </div>
    </main>
  )
}

'use client'

import {api} from '@/convex/_generated/api'
import type {OrderStatus} from '@/convex/orders/d'
import {useAuthCtx} from '@/ctx/auth'
import {useCopy} from '@/hooks/use-copy'
import {Icon} from '@/lib/icons'
import {Button, Card, Select, ListBoxItem} from '@/lib/heroui'
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
            <Button onPress={router.back} color='primary' variant='tertiary'>
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
            size='lg'
            radius='none'
            isIconOnly
            variant='secondary'
            onPress={router.back}
            aria-label='Back to orders'
            className='min-w-0 rounded-lg border-none'>
            <Icon name='chevron-left' className='size-4' />
          </Button>
          <div className='flex-1'>
            <h1 className='text-xl font-semibold'>Order Details</h1>
            <div className='flex items-center space-x-3'>
              <p className='text-base opacity-70 mt-0.5 font-mono'>
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
          <div className='min-w-sm'>
            <Select
              size='lg'
              selectedKeys={[order.orderStatus]}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as OrderStatus
                if (selected)
                  updateOrderStatus({
                    orderId: order._id,
                    status: selected,
                    updatedBy: user?.uid,
                  })
              }}
              aria-label='Order status'>
              {statusOptions.map((option) => (
                <ListBoxItem key={option.value}>{option.label}</ListBoxItem>
              ))}
            </Select>
          </div>
        </div>

        {/* Order Details Form */}
        <Card shadow='none' className='p-6 border-none'>
          <OrderDetailsForm order={order} hideHeader />
        </Card>
      </div>
    </main>
  )
}

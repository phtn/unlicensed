'use client'

import {
  ArcActionBar,
  ArcButtonLeft,
  ArcButtonRight,
  ArcCallout,
  ArcCard,
  ArcHeader,
  ArcLineItems,
  ArcMessage,
} from '@/components/expermtl/arc-card'
import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {formatPrice} from '@/utils/formatPrice'
import {useQuery} from 'convex/react'
import {useParams} from 'next/navigation'
import {useMemo} from 'react'

export const OrderSummaryWidget = () => {
  const params = useParams()
  const orderId = params.orderId as Id<'orders'>
  const order = useQuery(api.orders.q.getById, {id: orderId})

  const data = useMemo(
    () =>
      order?.items.map((item) => ({
        label: item.productName,
        value: `$${formatPrice(order.totalCents)}`,
      })),
    [order],
  )

  return (
    <main className='h-[calc(100lvh)] bg-black w-3xl'>
      <ArcCard>
        <ArcHeader
          title='We received your order!'
          description={order?.orderNumber}
          icon='hash'
          iconStyle='text-indigo-400'
          status={
            <span
              className={cn(
                'font-brk text-orange-300 tracking-wide uppercase text-xs bg-background/60 py-1 px-1.5 rounded-sm',
                {'text-emerald-500': order?.payment.status === 'completed'},
              )}>
              {order?.payment.status}
            </span>
          }
        />
        <ArcLineItems
          data={
            data
              ? [
                  ...data,
                  {
                    label: 'Payment Method',
                    value:
                      order?.payment.method.split('_').join(' ') ?? 'Cash App',
                  },
                ]
              : []
          }
        />

        <ArcCallout
          className='font-brk opacity-80'
          icon={order?.payment.transactionId ? 'hash' : 'info'}
          value={order?.payment.transactionId?.substring(0, 24) + ' ...'}
          type='success'
        />

        <div className='hidden _flex items-center space-x-2 text-base'>
          <Icon name='hash' className='size-5' />
          <ArcMessage>
            <div className='flex items-center text-left space-x-2 text-base'>
              <span>
                One of our associates will be in touch via our in-app{' '}
                <span className='font-medium underline decoration-dotted'>
                  chat messaging
                </span>
                .
              </span>
            </div>
          </ArcMessage>
        </div>
        <ArcActionBar>
          <ArcButtonLeft
            icon='chevron-left'
            label='View Order'
            href={order ? `/account/orders/${order.orderNumber}` : '#'}
          />
          <ArcButtonRight
            icon='chat-rounded'
            label='Open Chat'
            href={order ? `/account/chat/${order._id}` : '#'}
          />
        </ArcActionBar>
      </ArcCard>
    </main>
  )
}

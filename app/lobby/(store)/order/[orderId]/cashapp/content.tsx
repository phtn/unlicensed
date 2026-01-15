'use client'

import {
  ArcActionBar,
  ArcButtonLeft,
  ArcButtonRight,
  ArcCard,
  ArcHeader,
  ArcLineItems,
  ArcMessage,
} from '@/components/expermtl/arc-card'
import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {Icon} from '@/lib/icons'
import {formatPrice} from '@/utils/formatPrice'
import {useQuery} from 'convex/react'
import {useParams} from 'next/navigation'
import {useMemo} from 'react'

export const Content = () => {
  const params = useParams()
  const orderId = params.orderId as Id<'orders'>
  const order = useQuery(api.orders.q.getById, {id: orderId})

  const data = useMemo(
    () =>
      order?.items.map((item) => ({
        label: item.productName,
        value: formatPrice(item.unitPriceCents),
      })),
    [order],
  )

  return (
    <main className='h-[calc(100vh-104px)] pt-16 lg:pt-28 px-4 sm:px-6 lg:px-8 py-8'>
      <ArcCard>
        <ArcHeader
          title='We received your order!'
          description={order?.orderNumber}
          icon='hash'
          iconStyle='text-indigo-400'
          status={
            <span className='font-brk text-orange-300 tracking-wide uppercase text-xs'>
              Pending Payment
            </span>
          }
        />
        <ArcLineItems data={data ?? []} />

        <div className='flex items-center space-x-2 text-base'>
          <Icon name='info' className='size-4' />
          <ArcMessage>
            <div className='flex items-center space-x-2 text-base'>
              <span>One of our associates will be in touch via in-app </span>
              <span className='font-semibold'>chat</span>
              <span> messaging.</span>
            </div>
          </ArcMessage>
        </div>
        <ArcActionBar>
          <ArcButtonLeft
            icon='chevron-left'
            label='View Order'
            href={order ? `/account/orders/${order._id}` : '#'}
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

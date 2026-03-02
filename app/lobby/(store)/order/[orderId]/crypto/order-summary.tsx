'use client'

import {
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
import {pmmap} from '../../utils'

export const OrderSummaryWidget = () => {
  const params = useParams()
  const orderId = params.orderId as Id<'orders'>
  const order = useQuery(api.orders.q.getById, {id: orderId})

  const data = useMemo(
    () =>
      order?.items.map((item) => ({
        label: `${item.productName} x ${item.quantity}`,
        value: `$${formatPrice(item.unitPriceCents * item.quantity)}`,
      })),
    [order],
  )

  return (
    <main className='bg-black md:w-3xl z-80'>
      <ArcCard className='md:h-150 scale-y-95 md:rounded-sm rounded-lg'>
        <ArcHeader
          title={
            order?.payment.status === 'completed'
              ? 'Payment received!'
              : pmmap[order?.payment.method ?? 'crypto_commerce']
          }
          description={
            <div className='flex items-center justify-between w-full'>
              <div className='w-full'>{order?.orderNumber.substring(5)}</div>
              <div className='flex-1 whitespace-nowrap text-sm px-1'>
                {pmmap[order?.payment.method ?? 'crypto_commerce']}
              </div>
            </div>
          }
          icon='hash'
          iconStyle='text-indigo-400'
          status={
            <span
              className={cn(
                'font-brk text-orange-500 dark:text-orange-300 tracking-wide uppercase text-xs dark:bg-background/60 bg-slate-200/50 py-1 px-1.5 rounded-sm',
                {'text-emerald-500': order?.payment.status === 'completed'},
              )}>
              payment {order?.payment.status}
            </span>
          }
        />
        <ArcLineItems
          data={
            data
              ? [
                  ...data,
                  {
                    label: 'Shipping',
                    value: `$${formatPrice(order?.shippingCents ?? 0)}`,
                  },
                  {
                    label: 'Total',
                    value: `$${formatPrice(order?.totalCents ?? 0)}`,
                  },
                ]
              : []
          }
        />

        <ArcCallout
          className='font-brk ps-4'
          icon={order?.payment.transactionId ? 'hash' : 'info'}
          value={
            (order?.payment.transactionId &&
              order.payment.transactionId.substring(0, 24) + ' ...') ??
            'Awaiting Payment'
          }
          type={order?.payment.transactionId ? 'success' : 'info'}
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
      </ArcCard>
    </main>
  )
}

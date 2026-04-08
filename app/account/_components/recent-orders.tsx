import {Loader} from '@/components/expermtl/loader'
import {Button} from '@/components/ui/button'
import {Doc} from '@/convex/_generated/dataModel'
import {Icon} from '@/lib/icons'
import {Card} from '@heroui/react'
import Link from 'next/link'
import {ViewTransition} from 'react'
import {OrderListItem} from './order-list-item'

export const RecentOrders = ({orders}: {orders?: Array<Doc<'orders'>>}) => {
  return (
    <div className='flex flex-col gap-3'>
      {/* Header */}
      <div className='flex items-center justify-between px-1'>
        <div className='flex items-center gap-2'>
          <Icon name='card-pay-line' className='size-3.5 text-default-400' />
          <span className='font-okxs text-xs uppercase tracking-widest text-default-400'>
            Recent Orders
          </span>
          {orders && orders.length > 0 && (
            <span className='flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground/10 px-1 font-okxs text-[10px] text-default-500'>
              {orders.length}
            </span>
          )}
        </div>
        {orders && orders.length > 5 && (
          <Button
            asChild
            variant='ghost'
            size='sm'
            className='h-7 gap-1 font-okxs text-xs text-default-500 hover:text-foreground'>
            <Link href='/account/orders'>
              View all
              <Icon name='chevron-right' className='size-3.5' />
            </Link>
          </Button>
        )}
      </div>

      {/* Content */}
      <ViewTransition>
        <div className='space-y-1 min-h-25'>
          {orders === undefined ? (
            <div className='flex w-full items-center justify-center py-16'>
              <Loader className='scale-50' />
            </div>
          ) : orders.length === 0 ? (
            <Card className='border border-dashed border-default-200 bg-default-50/50 dark:border-default-100/20 dark:bg-default-50/5'>
              <Card.Content className='flex flex-col items-center justify-center py-16 text-center'>
                <div className='mb-5 flex size-16 items-center justify-center rounded-full bg-default-100 dark:bg-default-50/10'>
                  <Icon
                    name='package-car'
                    className='size-7 text-default-400'
                  />
                </div>
                <h3 className='mb-1.5 font-bone text-lg tracking-tight'>
                  No orders yet
                </h3>
                <p className='mb-6 max-w-sm font-okxs text-sm text-default-400 leading-relaxed'>
                  Start shopping to see your orders and earn rewards.
                </p>
                <Button asChild size='lg' className='font-okxs font-medium'>
                  <Link href='/products'>Browse Products</Link>
                </Button>
              </Card.Content>
            </Card>
          ) : (
            orders
              .slice(0, 5)
              .map((order) => (
                <OrderListItem key={order.orderNumber} order={order} />
              ))
          )}
        </div>
      </ViewTransition>
    </div>
  )
}

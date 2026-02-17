import {Loader} from '@/components/expermtl/loader'
import {Doc} from '@/convex/_generated/dataModel'
import {Icon} from '@/lib/icons'
import {Button, Card, CardBody} from '@heroui/react'
import Link from 'next/link'
import {ViewTransition} from 'react'
import {OrderListItem} from './order-list-item'

export const RecentOrders = ({orders}: {orders?: Array<Doc<'orders'>>}) => {
  return (
    <div>
      <div className='flex items-center justify-between mb-2'>
        <div className='flex items-center px-2 gap-2'>
          <Icon name='card-pay-line' className='size-4 opacity-90' />
          <p className='font-okxs text-sm text-default-500'>Recent Orders</p>
        </div>
        {orders && orders.length > 5 && (
          <Button
            as={Link}
            href='/account/orders'
            variant='light'
            endContent={<Icon name='chevron-right' className='size-4' />}
            className='text-default-600 dark:text-default-400 hover:text-foreground font-okxs'>
            View All
          </Button>
        )}
      </div>

      <ViewTransition>
        <div className='space-y-3 min-h-25'>
          {orders === undefined ? (
            <div className='w-full flex justify-center items-center py-16'>
              <Loader className='scale-50' />
            </div>
          ) : orders.length === 0 ? (
            <Card className='border-2 border-dashed border-default-200 dark:border-default-100/20 bg-default-50/50 dark:bg-default-50/5'>
              <CardBody className='py-16 flex flex-col items-center justify-center text-center'>
                <div className='w-20 h-20 rounded-full bg-default-100 dark:bg-default-50/10 flex items-center justify-center mb-5'>
                  <Icon
                    name='package-car'
                    className='size-9 text-default-400'
                  />
                </div>
                <h3 className='text-xl font-semibold text-foreground mb-2'>
                  No orders yet
                </h3>
                <p className='text-default-500 max-w-sm mb-6 leading-relaxed'>
                  Start shopping to see your orders and earn rewards!
                </p>
                <Button
                  as={Link}
                  href='/products'
                  color='primary'
                  size='lg'
                  className='font-semibold'>
                  Browse Products
                </Button>
              </CardBody>
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

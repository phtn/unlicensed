import {ClassName} from '@/app/types'
import {OrderType, PaymentMethod} from '@/convex/orders/d'
import {Icon, IconName} from '@/lib/icons'
import {formatTimestamp} from '@/utils/date'
import {formatPrice} from '@/utils/formatPrice'
import {Card, CardBody, Link} from '@heroui/react'
import {useRouter} from 'next/navigation'
import {OrderStatusBadge} from './order-status'

export const OrderListItem = ({order}: {order: OrderType}) => {
  // Helper for Order Status Color
  const {orderNumber, items, orderStatus, totalCents, createdAt, payment} =
    order

  const router = useRouter()

  return (
    <Card
      shadow='none'
      radius='none'
      onMouseEnter={() => router.prefetch(`/account/orders/${orderNumber}`)}
      key={orderNumber}
      as={Link}
      href={`/account/orders/${orderNumber}`}
      className='w-full rounded-lg border dark:border-dark-table dark:bg-dark-table bg-content/50 dark:hover:bg-dark-table/70'>
      <CardBody className='p-5'>
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
          <div className='flex items-start gap-8 flex-1 min-w-0'>
            <div className='p-4 rounded-lg bg-linear-to-br from-default-100 to-default-500/10 hidden sm:flex shrink-0'>
              <Icon name='box' className='size-5 opacity-50' />
            </div>
            <div className='space-y-2.5'>
              <div className='flex items-center flex-wrap'>
                <h3 className='font-polysans font-medium text-base tracking-widest'>
                  {orderNumber}
                </h3>
              </div>
              <div className='flex items-center gap-6 text-sm text-default-500 flex-wrap'>
                <div className='flex items-center gap-2'>
                  <span className='font-brk font-normal'>
                    {formatTimestamp(createdAt)}
                  </span>
                  <span>•</span>
                  <span className='font-space'>
                    {items.length} item
                    {items.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
            <div className='space-y-3 px-4'>
              <OrderStatusBadge status={orderStatus} />
              <div className='flex items-center justify-center gap-1 capitalize text-xs font-okxs font-medium'>
                <Icon
                  name={paymentMethodIconMap[payment.method].icon}
                  className={`size-4 ${paymentMethodIconMap[payment.method].style}`}
                />
                <span>{payment.method.split('_').join(' ')}</span>
              </div>
            </div>
          </div>

          <div className='flex items-center justify-between sm:justify-end gap-4 sm:gap-6 border-t border-dotted sm:border-none border-foreground/10 pt-4 sm:pt-0'>
            <div className='text-left sm:text-right'>
              <p className='text-xs text-default-500 uppercase tracking-wider mb-1'>
                Total
              </p>
              <p className='text-xl font-okxs font-semibold'>
                ${formatPrice(totalCents)}
              </p>
            </div>
            <Icon name='chevron-right' className='size-4' />
          </div>
        </div>
      </CardBody>
    </Card>
  )
}

const paymentMethodIconMap: Record<
  PaymentMethod,
  {icon: IconName; style: ClassName}
> = {
  cards: {icon: 'credit-card-2', style: 'text-primary'},
  crypto_commerce: {icon: 'ethereum', style: 'text-indigo-400'},
  crypto_transfer: {icon: 'polygon', style: 'text-sky-500'},
  cash_app: {icon: 'cashapp', style: 'text-cashapp'},
}

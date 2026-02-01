import {OrderType} from '@/convex/orders/d'
import {Icon} from '@/lib/icons'
import {formatPrice} from '@/utils/formatPrice'
import {Card, CardBody, Chip, Link} from '@heroui/react'
import {useMemo} from 'react'

export const OrderItem = ({order}: {order: OrderType}) => {
  // Helper for Order Status Color
  const {orderNumber, items, orderStatus, totalCents, createdAt} = order

  const getStatusColor = useMemo(() => {
    switch (orderStatus) {
      case 'pending_payment':
        return 'warning'
      case 'order_processing':
        return 'primary'
      case 'awaiting_courier_pickup':
        return 'secondary'
      case 'shipping':
        return 'default'
      case 'resend':
        return 'warning'
      case 'shipped':
        return 'success'
      case 'cancelled':
        return 'danger'
      default:
        return 'default'
    }
  }, [orderStatus])

  const formatStatus = useMemo(() => {
    return orderStatus
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }, [orderStatus])

  return (
    <Card
      shadow='none'
      key={orderNumber}
      as={Link}
      href={`/account/orders/${orderNumber}`}
      isPressable
      className='w-full border hover:border-foreground/20 bg-content/50 backdrop-blur-sm hover:shadow-xs transition-all duration-200 hover:-translate-y-0.5'>
      <CardBody className='p-5'>
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
          <div className='flex items-start gap-4 flex-1 min-w-0'>
            <div className='p-3 rounded-xl bg-linear-to-br from-default-100/30 to-default-500/10 hidden sm:flex shrink-0'>
              <Icon name='box' className='size-5 opacity-50' />
            </div>
            <div className='flex-1 min-w-0'>
              <div className='flex items-center gap-3 flex-wrap mb-2'>
                <h3 className='font-semibold text-base tracking-tight truncate'>
                  {orderNumber}
                </h3>
                <Chip
                  size='sm'
                  color={getStatusColor}
                  variant='flat'
                  className='font-medium'>
                  {formatStatus}
                </Chip>
              </div>
              <div className='flex items-center gap-2 text-sm text-default-500 flex-wrap'>
                <span className='font-space'>
                  {createdAt
                    ? new Date(createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'N/A'}
                </span>
                <span>•</span>
                <span className='font-space'>
                  {items.length} item
                  {items.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>

          <div className='flex items-center justify-between sm:justify-end gap-4 sm:gap-6 border-t sm:border-none pt-4 sm:pt-0'>
            <div className='text-left sm:text-right'>
              <p className='text-xs text-default-500 uppercase tracking-wider mb-1'>
                Total
              </p>
              <p className='text-xl font-space font-semibold'>
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

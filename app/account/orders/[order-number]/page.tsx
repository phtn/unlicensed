'use client'

import {api} from '@/convex/_generated/api'
import {useAuth} from '@/hooks/use-auth'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {formatPrice} from '@/utils/formatPrice'
import {
  BreadcrumbItem,
  Breadcrumbs,
  Button,
  Card,
  CardBody,
  Divider,
  Image,
} from '@heroui/react'
import {useQuery} from 'convex/react'
import {motion} from 'motion/react'
import {default as NextLink} from 'next/link'
import {useParams, useSearchParams} from 'next/navigation'
import {useEffect, useState} from 'react'
import {OrderStatusBadge} from '../../_components/order-status'
import {Actions} from './_components/actions'
import {SectionTitle} from './_components/section'

function formatPaymentMethod(method: string) {
  return method
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function OrderDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const {user: firebaseUser} = useAuth()
  const orderNumber = params['order-number'] as string
  const [showSuccessBanner, setShowSuccessBanner] = useState(false)

  // Get current user
  const convexUser = useQuery(
    api.users.q.getCurrentUser,
    firebaseUser ? {fid: firebaseUser.uid} : 'skip',
  )

  // Get order
  const order = useQuery(
    api.orders.q.getOrderByNumber,
    orderNumber ? {orderNumber} : 'skip',
  )

  // Check for payment success query param
  useEffect(() => {
    if (searchParams.get('') === 'paid') {
      // Remove query param from URL without reload
      const url = new URL(window.location.href)
      url.searchParams.delete('payment')
      window.history.replaceState({}, '', url.toString())
    }
  }, [searchParams])

  if (!order) {
    return (
      <motion.div
        initial={{opacity: 0}}
        animate={{opacity: 1}}
        className='min-h-screen flex items-center justify-center'>
        <p>Loading order...</p>
      </motion.div>
    )
  }

  return (
    <div className='min-h-screen pt-4'>
      <div className='max-w-7xl mx-auto'>
        {/* Payment Success Banner */}
        {showSuccessBanner && (
          <Card className='mb-6 border border-terpenes/20 bg-terpenes/5'>
            <CardBody className='p-4'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <Icon
                    name='check-fill'
                    className='size-5 text-terpenes shrink-0'
                  />
                  <div>
                    <p className='font-semibold text-sm'>Payment Successful</p>
                    <p className='text-xs text-color-muted'>
                      Your payment has been processed successfully.
                    </p>
                  </div>
                </div>
                <Button
                  isIconOnly
                  variant='light'
                  size='sm'
                  onPress={() => setShowSuccessBanner(false)}
                  className='min-w-0 w-8 h-8'>
                  <Icon name='x' className='size-4' />
                </Button>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Header */}
        <div className='flex items-center justify-between mb-5'>
          <div>
            <h1 className='text-base font-space space-x-1 sm:space-x-3'>
              <Breadcrumbs>
                <BreadcrumbItem href='/account'>Account</BreadcrumbItem>
                <BreadcrumbItem href='/account/orders'>Orders</BreadcrumbItem>
                <BreadcrumbItem>
                  {order.orderNumber}{' '}
                  <OrderStatusBadge status={order.orderStatus} />
                </BreadcrumbItem>
              </Breadcrumbs>
            </h1>
          </div>
          <Actions status={order.orderStatus} />
        </div>

        <div className='grid gap-6'>
          {/* Order Items */}
          <Card radius='sm' shadow='none' className='dark:bg-dark-table'>
            <CardBody className='p-6'>
              <SectionTitle title='Items' />
              <div className='grid md:grid-cols-2 md:gap-0'>
                {order.items.map((item, index) => (
                  <div
                    key={item.productId}
                    className={cn('p', {
                      'pe-8 border-r border-dotted border-foreground/15':
                        index % 2 === 0,
                    })}>
                    <div className='flex gap-4'>
                      <Image
                        src={item.productImage}
                        alt={item.productName}
                        className='w-20 h-20 object-cover rounded-lg'
                        radius='lg'
                      />
                      <div className='flex-1 font-okxs'>
                        <h3 className=''>{item.productName}</h3>
                        <p className='text-sm opacity-80'>
                          Quantity: {item.quantity}
                          {item.denomination && item.denomination > 1
                            ? ` × ${item.denomination}`
                            : ''}
                        </p>
                        <p className='text-sm opacity-80 mt-1'>
                          ${formatPrice(item.unitPriceCents)} each
                        </p>
                      </div>
                      <div className='text-right font-okxs'>
                        <p className='font-semibold'>
                          ${formatPrice(item.totalPriceCents)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Order Summary */}
          <div className='grid gap-6 md:grid-cols-2'>
            <Card radius='sm' shadow='none'>
              <CardBody className='p-6'>
                <SectionTitle title='Order Summary' />
                <div className='space-y-2 font-okxs'>
                  <div className='flex justify-between text-sm'>
                    <span className='text-color-muted'>Subtotal</span>
                    <span>${formatPrice(order.subtotalCents ?? 0)}</span>
                  </div>
                  {order.discountCents && order.discountCents > 0 && (
                    <div className='flex justify-between text-sm'>
                      <span className='text-color-muted'>Discount</span>
                      <span className='text-success'>
                        -${formatPrice(order.discountCents ?? 0)}
                      </span>
                    </div>
                  )}
                  <div className='flex justify-between text-sm'>
                    <span className='text-color-muted'>Tax</span>
                    <span>${formatPrice(order.taxCents ?? 0)}</span>
                  </div>
                  <div className='flex justify-between text-sm'>
                    <span className='text-color-muted'>Shipping</span>
                    <span>
                      {order.shippingCents === 0 ? (
                        <span className='text-teal-500'>Free</span>
                      ) : (
                        `$${formatPrice(order.shippingCents ?? 0)}`
                      )}
                    </span>
                  </div>
                  <Divider className='my-2' />
                  <div className='flex justify-between'>
                    <span>Total</span>
                    <span>${formatPrice(order.totalCents ?? 0)}</span>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Payment Information */}
            <Card radius='sm' shadow='none'>
              <CardBody className='p-6'>
                <div className='flex items-center justify-between'>
                  <SectionTitle title='Payment' />
                  <div className='font-okxs text-cashapp'>
                    {order.payment.method === 'cash_app'
                      ? '@' + convexUser?.cashAppUsername
                      : ''}
                  </div>
                </div>
                <div className='space-y-2 font-okxs'>
                  <div className='flex justify-between'>
                    <span className='text-sm text-color-muted'>Method</span>
                    <span>{formatPaymentMethod(order.payment.method)}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-sm text-color-muted'>Status</span>
                    <OrderStatusBadge status={order.orderStatus} />
                  </div>
                  {order.payment.transactionId && (
                    <div className='flex justify-between'>
                      <span className='text-color-muted'>Transaction ID</span>
                      <span className='text-sm font-mono'>
                        {order.payment.transactionId}
                      </span>
                    </div>
                  )}
                  {order.payment.gateway?.transactionId && (
                    <div className='flex justify-between'>
                      <span className='text-color-muted'>Transaction ID</span>
                      <span className='text-sm font-mono'>
                        {order.payment.gateway?.transactionId}
                      </span>
                    </div>
                  )}
                  {order.payment.gateway?.transactionId &&
                    order.payment.status === 'pending' && (
                      <div className='mt-4 pt-4 border-t border-divider'>
                        <Button
                          as={NextLink}
                          href={`/order/${order._id}/pay`}
                          color='primary'
                          className='w-full'>
                          Complete Payment
                        </Button>
                      </div>
                    )}
                  {order.payment.paidAt && (
                    <div className='flex justify-between'>
                      <span className='text-color-muted'>Paid At</span>
                      <span className='text-sm'>
                        {order.payment.paidAt
                          ? formatDate(order.payment.paidAt)
                          : 'N/A'}
                      </span>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Shipping Information */}
          <div className='grid gap-6 md:grid-cols-2'>
            <Card radius='sm' shadow='none'>
              <CardBody className='p-6'>
                <SectionTitle title='Shipping Address' />
                <div className='space-y-1 font-okxs text-sm'>
                  {order.shippingAddress.firstName &&
                    order.shippingAddress.lastName && (
                      <p className='font-semibold'>
                        {order.shippingAddress.firstName}{' '}
                        {order.shippingAddress.lastName}
                      </p>
                    )}
                  <p>{order.shippingAddress.addressLine1}</p>
                  {order.shippingAddress.addressLine2 && (
                    <p>{order.shippingAddress.addressLine2}</p>
                  )}
                  <p>
                    {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                    {order.shippingAddress.zipCode},{' '}
                    <span className='uppercase'>
                      {order.shippingAddress.country}
                    </span>
                  </p>
                  {order.shippingAddress.phone && (
                    <p className='mt-2'>{order.shippingAddress.phone}</p>
                  )}
                </div>
                {order.shipping && (
                  <div className='mt-4 pt-4 font-okxs border-t border-divider'>
                    {order.shipping.trackingNumber && (
                      <div className='space-y-2'>
                        <p className='text-sm text-color-muted'>
                          Tracking Number
                        </p>
                        <p className='font-mono text-sm'>
                          {order.shipping.trackingNumber}
                        </p>
                        {order.shipping.carrier && (
                          <p className='text-sm text-color-muted'>
                            Carrier: {order.shipping.carrier}
                          </p>
                        )}
                      </div>
                    )}
                    {order.shipping.shippedAt && (
                      <p className='text-sm text-color-muted mt-2'>
                        Shipped:{' '}
                        {order.shipping.shippedAt
                          ? formatDate(order.shipping.shippedAt)
                          : 'N/A'}
                      </p>
                    )}
                    {order.shipping.deliveredAt && (
                      <p className='text-sm text-color-muted'>
                        Delivered:{' '}
                        {order.shipping.deliveredAt
                          ? formatDate(order.shipping.deliveredAt)
                          : 'N/A'}
                      </p>
                    )}
                  </div>
                )}
              </CardBody>
            </Card>

            {order.billingAddress && (
              <Card radius='sm' shadow='none'>
                <CardBody className='p-6'>
                  <SectionTitle title='Billing Address' />
                  <div className='space-y-1 font-okxs text-sm'>
                    {order.billingAddress.firstName &&
                      order.billingAddress.lastName && (
                        <p className='font-semibold'>
                          {order.billingAddress.firstName}{' '}
                          {order.billingAddress.lastName}
                        </p>
                      )}
                    <p>{order.billingAddress.addressLine1}</p>
                    {order.billingAddress.addressLine2 && (
                      <p>{order.billingAddress.addressLine2}</p>
                    )}
                    <p>
                      {order.billingAddress.city}, {order.billingAddress.state}{' '}
                      {order.billingAddress.zipCode},{' '}
                      {order.billingAddress.country}
                    </p>
                  </div>
                </CardBody>
              </Card>
            )}
            {/* Order Details */}
            <Card radius='sm' shadow='none'>
              <CardBody className='p-6'>
                <SectionTitle title='Order Details' />
                <div className='space-y-2 font-okxs text-sm'>
                  <div className='flex justify-between'>
                    <span className='text-color-muted'>Order Number</span>
                    <span className='font-mono'>{order.orderNumber}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-color-muted'>Placed On</span>
                    <span>{formatDate(order.createdAt ?? 0)}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-color-muted'>Contact Email</span>
                    <span>{order.contactEmail}</span>
                  </div>
                  {order.contactPhone && (
                    <div className='flex justify-between'>
                      <span className='text-color-muted'>Contact Phone</span>
                      <span>{order.contactPhone}</span>
                    </div>
                  )}
                  {order.customerNotes && (
                    <div className='mt-4 pt-4 border-t border-divider'>
                      <p className='text-color-muted mb-2'>Customer Notes</p>
                      <p className='text-sm'>{order.customerNotes}</p>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Actions */}
          <div className='flex gap-4 justify-end'>
            <Button
              radius='none'
              variant='faded'
              as={NextLink}
              href='/account'
              className='border-transparent dark:bg-dark-table/10 rounded-lg font-okxs font-semibold dark:text-white text-base'>
              Back to Account
            </Button>
            {order.orderStatus !== 'shipped' &&
              order.orderStatus !== 'cancelled' && (
                <Button
                  color='danger'
                  size='md'
                  radius='none'
                  variant='solid'
                  className='bg-danger/80 rounded-lg font-okxs font-semibold dark:text-white text-base'>
                  Cancel Order
                </Button>
              )}
          </div>
        </div>
      </div>
    </div>
  )
}

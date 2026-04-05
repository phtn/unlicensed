'use client'

import {Button as LinkButton} from '@/components/ui/button'
import {api} from '@/convex/_generated/api'
import {useMobile} from '@/hooks/use-mobile'
import {resolveOrderPayableTotalCents} from '@/lib/checkout/processing-fee'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {formatPrice} from '@/utils/formatPrice'
import {Breadcrumbs, Button, Card, Separator} from '@heroui/react'
import {useQuery} from 'convex/react'
import {motion} from 'motion/react'
import {default as NextLink} from 'next/link'
import {useParams, useSearchParams} from 'next/navigation'
import {Activity, useEffect, useState} from 'react'
import {mmap} from '../../_components/order-list-item'
import {OrderStatusBadge} from '../../_components/order-status'
import {Actions} from './_components/actions'
import {SectionTitle, TxnId} from './_components/section'

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getPaymentRoute(orderId: string, paymentMethod: string) {
  const paymentMethodValue = String(paymentMethod)
  if (paymentMethodValue === 'cards') {
    return `/lobby/order/${orderId}/cards`
  }
  if (paymentMethodValue === 'cash_app') {
    return `/lobby/order/${orderId}/cashapp`
  }
  if (
    paymentMethodValue === 'crypto_commerce' ||
    paymentMethodValue === 'crypto-payment'
  ) {
    return `/lobby/order/${orderId}/crypto`
  }
  return `/lobby/order/${orderId}/send`
}

export default function OrderDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const isMobile = useMobile()
  // const {user: firebaseUser} = useAuth()
  const orderNumber = params['order-number'] as string
  const [showSuccessBanner, setShowSuccessBanner] = useState(false)

  // Get current user
  // const convexUser = useQuery(
  //   api.users.q.getCurrentUser,
  //   firebaseUser ? {fid: firebaseUser.uid} : 'skip',
  // )

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

  const payableTotalCents = resolveOrderPayableTotalCents({
    paymentMethod: order.payment.method,
    totalCents: order.totalCents,
    processingFeeCents: order.processingFeeCents,
    totalWithCryptoFeeCents: order.totalWithCryptoFeeCents,
  })
  const processingFeeLabel =
    order.payment.method === 'cash_app'
      ? 'Cash App Processing Fee'
      : 'Processing Fee'

  return (
    <div className='min-h-screen pt-4'>
      <div className='max-w-7xl mx-auto xl:px-0 px-4'>
        {/* Payment Success Banner */}
        {showSuccessBanner && (
          <Card className='mb-6 border border-terpenes/20 bg-terpenes/5'>
            <Card.Content className='p-4'>
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
                  variant='tertiary'
                  size='sm'
                  onPress={() => setShowSuccessBanner(false)}
                  className='min-w-0 w-8 h-8'>
                  <Icon name='x' className='size-4' />
                </Button>
              </div>
            </Card.Content>
          </Card>
        )}

        {/* Header */}
        <div className='flex items-center justify-between mb-5'>
          <div>
            <h1 className='text-base font-okxs space-x-1 sm:space-x-3'>
              <Breadcrumbs>
                <Breadcrumbs.Item href='/account'>
                  <span className='md:hidden flex'>
                    <Icon name='user' className='size-3' />
                  </span>
                  <span className='hidden md:flex'>Account</span>
                </Breadcrumbs.Item>
                <Breadcrumbs.Item href='/account/orders'>
                  Orders
                </Breadcrumbs.Item>
                <Breadcrumbs.Item>
                  {order.orderNumber.substring(5)}{' '}
                  <Activity mode={isMobile ? 'hidden' : 'visible'}>
                    <OrderStatusBadge status={order.orderStatus} />
                  </Activity>
                </Breadcrumbs.Item>
              </Breadcrumbs>
            </h1>
          </div>
          <Actions
            href={getPaymentRoute(order._id, order.payment.method)}
            status={order.orderStatus}
            isMobile={isMobile}
          />
        </div>

        <div className='grid gap-6'>
          {/* Order Items */}
          <Card className='dark:bg-dark-table'>
            <Card.Content className='p-4 md:p-6'>
              <SectionTitle title='Items' />
              <div className='grid md:grid-cols-2 md:gap-0 gap-3'>
                {order.items.map((item, index) => (
                  <div
                    key={item.productId}
                    className={cn('p', {
                      'md:pe-8 md:border-r border-dotted border-foreground/15':
                        index % 2 === 0,
                    })}>
                    <div className='flex gap-4'>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.productImage}
                        alt={item.productName}
                        className='w-20 h-20 aspect-square object-cover rounded-lg shrink-0'
                        loading='lazy'
                      />
                      <div className='font-okxs flex-1 w-full'>
                        <h3 className=''>{item.productName}</h3>
                        <div className='flex items-center text-sm opacity-80'>
                          <span className='hidden md:flex mr-1'>Quantity:</span>
                          <span className='md:hidden flex mr-1'>Qty:</span>
                          <span>
                            {item.quantity}
                            {item.denomination && item.denomination > 1
                              ? ` × ${item.denomination}`
                              : ''}
                          </span>
                        </div>
                        <p className='text-sm opacity-80 mt-1'>
                          ${formatPrice(item.unitPriceCents)} each
                        </p>
                      </div>
                      <div className='flex-1 text-right font-okxs'>
                        <p className='font-semibold'>
                          ${formatPrice(item.totalPriceCents)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card.Content>
          </Card>

          {/* Order Summary */}
          <div className='grid gap-6 md:grid-cols-2'>
            <Card>
              <Card.Content className='p-4 md:p-6'>
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
                  {order.processingFeeCents && order.processingFeeCents > 0 && (
                    <div className='flex justify-between text-sm'>
                      <span className='text-color-muted'>
                        {processingFeeLabel}
                      </span>
                      <span>${formatPrice(order.processingFeeCents)}</span>
                    </div>
                  )}
                  <Separator className='my-2' />
                  <div className='flex justify-between'>
                    <span>Total</span>
                    <span>${formatPrice(payableTotalCents)}</span>
                  </div>
                </div>
              </Card.Content>
            </Card>

            {/* Payment Information */}
            <Card>
              <Card.Content className='p-4 md:p-6'>
                <div className='flex items-center justify-between'>
                  <SectionTitle title='Payment' />
                  {/*<div className='font-okxs text-cashapp'>
                    {order.payment.method === 'cash_app'
                      ? '@' + convexUser?.cashAppUsername
                      : ''}
                  </div>*/}
                </div>
                <div className='space-y-2 font-okxs'>
                  <div className='flex justify-between'>
                    <span className='text-sm md:text-base text-color-muted'>
                      Method
                    </span>
                    <span>{mmap[order.payment.method]}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-sm text-color-muted'>Status</span>
                    <OrderStatusBadge status={order.orderStatus} />
                  </div>
                  {order.payment.transactionId && (
                    <div className='flex justify-between'>
                      <span className='text-color-muted'>Transaction ID</span>
                      <TxnId id={order.payment.transactionId} />
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
                        <LinkButton asChild className='w-full'>
                          <NextLink
                            href={getPaymentRoute(
                              order._id,
                              order.payment.method,
                            )}>
                            Complete Payment
                          </NextLink>
                        </LinkButton>
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
              </Card.Content>
            </Card>
          </div>

          {/* Shipping Information */}
          <div className='grid gap-6 md:grid-cols-2'>
            <Card>
              <Card.Content className='p-4 md:p-6'>
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
              </Card.Content>
            </Card>

            {/* Order Details */}
            <Card>
              <Card.Content className='p-4 md:p-6'>
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
              </Card.Content>
            </Card>
          </div>

          {/* Actions */}
          <div className='flex gap-4 justify-end mb-4'>
            <LinkButton
              asChild
              variant='secondary'
              className='border-transparent dark:bg-dark-table/10 rounded-lg font-okxs font-semibold dark:text-white text-base'>
              <NextLink href='/account'>Back to Account</NextLink>
            </LinkButton>
            {order.orderStatus !== 'shipped' &&
              order.orderStatus !== 'delivered' &&
              order.orderStatus !== 'cancelled' && (
                <Button
                  size='md'
                  variant='tertiary'
                  className='rounded-xs font-okxs font-semibold dark:text-danger text-base'>
                  Cancel Order
                </Button>
              )}
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {useAuth} from '@/hooks/use-auth'
import {formatPrice} from '@/utils/formatPrice'
import {
  Button,
  Card,
  CardBody,
  Divider,
  Image,
  Chip,
  Link,
} from '@heroui/react'
import {useQuery} from 'convex/react'
import NextLink from 'next/link'
import {useParams, useRouter} from 'next/navigation'
import {useMemo} from 'react'

function getStatusColor(status: string) {
  switch (status) {
    case 'pending':
      return 'warning'
    case 'confirmed':
    case 'processing':
      return 'primary'
    case 'shipped':
      return 'secondary'
    case 'delivered':
      return 'success'
    case 'cancelled':
    case 'refunded':
      return 'danger'
    default:
      return 'default'
  }
}

function formatStatus(status: string) {
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

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
  const router = useRouter()
  const {user: firebaseUser} = useAuth()
  const orderId = params['order-id'] as Id<'orders'>

  // Get current user
  const convexUser = useQuery(
    api.users.q.getCurrentUser,
    firebaseUser ? {firebaseId: firebaseUser.uid} : 'skip',
  )

  // Get order
  const order = useQuery(api.orders.q.getOrder, {orderId})

  // Verify order belongs to user (or allow if no user - guest order)
  const isAuthorized = useMemo(() => {
    if (!order) return true // Still loading
    if (!convexUser) {
      // Guest order - allow if order has no userId
      return order.userId === null
    }
    // Authenticated user - must match order userId
    return order.userId === convexUser._id
  }, [order, convexUser])

  if (order === undefined) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <p>Loading order...</p>
      </div>
    )
  }

  if (order === null || !isAuthorized) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center space-y-4'>
          <h1 className='text-2xl font-semibold'>Order Not Found</h1>
          <p className='text-color-muted'>
            This order doesn't exist or you don't have permission to view it.
          </p>
          <Button as={NextLink} href='/account' color='primary'>
            Back to Account
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen lg:pt-24 px-4 sm:px-6 lg:px-8 py-8'>
      <div className='max-w-4xl mx-auto'>
        {/* Header */}
        <div className='flex items-center justify-between mb-8'>
          <div>
            <h1 className='text-base font-space space-x-3'>
              <span className='opacity-70 font-light'>
                <Button
                  variant='light'
                  size='sm'
                  as={NextLink}
                  href='/account'
                  className='-ml-2'>
                  Account
                </Button>
                {' / '}
                Orders /{' '}
              </span>
              <span className='font-medium'>{order.orderNumber}</span>
            </h1>
          </div>
          <Chip
            color={getStatusColor(order.orderStatus) as any}
            variant='flat'
            size='lg'>
            {formatStatus(order.orderStatus)}
          </Chip>
        </div>

        <div className='grid gap-6'>
          {/* Order Items */}
          <Card>
            <CardBody className='p-6'>
              <h2 className='text-xl font-semibold mb-4'>Order Items</h2>
              <div className='space-y-4'>
                {order.items.map((item, index) => (
                  <div key={index}>
                    <div className='flex gap-4'>
                      <Image
                        src={item.productImage}
                        alt={item.productName}
                        className='w-20 h-20 object-cover rounded-lg'
                        radius='lg'
                      />
                      <div className='flex-1'>
                        <h3 className='font-semibold'>{item.productName}</h3>
                        <p className='text-sm text-color-muted'>
                          Quantity: {item.quantity}
                          {item.denomination && item.denomination > 1
                            ? ` × ${item.denomination}`
                            : ''}
                        </p>
                        <p className='text-sm text-color-muted mt-1'>
                          ${formatPrice(item.unitPriceCents)} each
                        </p>
                      </div>
                      <div className='text-right'>
                        <p className='font-semibold'>
                          ${formatPrice(item.totalPriceCents)}
                        </p>
                      </div>
                    </div>
                    {index < order.items.length - 1 && (
                      <Divider className='mt-4' />
                    )}
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Order Summary */}
          <div className='grid gap-6 md:grid-cols-2'>
            <Card>
              <CardBody className='p-6'>
                <h2 className='text-xl font-semibold mb-4'>Order Summary</h2>
                <div className='space-y-2 font-space'>
                  <div className='flex justify-between text-sm'>
                    <span className='text-color-muted'>Subtotal</span>
                    <span>${formatPrice(order.subtotalCents)}</span>
                  </div>
                  {order.discountCents && order.discountCents > 0 && (
                    <div className='flex justify-between text-sm'>
                      <span className='text-color-muted'>Discount</span>
                      <span className='text-success'>
                        -${formatPrice(order.discountCents)}
                      </span>
                    </div>
                  )}
                  <div className='flex justify-between text-sm'>
                    <span className='text-color-muted'>Tax</span>
                    <span>${formatPrice(order.taxCents)}</span>
                  </div>
                  <div className='flex justify-between text-sm'>
                    <span className='text-color-muted'>Shipping</span>
                    <span>
                      {order.shippingCents === 0 ? (
                        <span className='text-teal-500'>Free</span>
                      ) : (
                        `$${formatPrice(order.shippingCents)}`
                      )}
                    </span>
                  </div>
                  <Divider className='my-2' />
                  <div className='flex justify-between text-lg font-semibold'>
                    <span>Total</span>
                    <span>${formatPrice(order.totalCents)}</span>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Payment Information */}
            <Card>
              <CardBody className='p-6'>
                <h2 className='text-xl font-semibold mb-4'>Payment</h2>
                <div className='space-y-2'>
                  <div className='flex justify-between'>
                    <span className='text-color-muted'>Method</span>
                    <span>{formatPaymentMethod(order.payment.method)}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-color-muted'>Status</span>
                    <Chip
                      color={
                        order.payment.status === 'completed'
                          ? 'success'
                          : order.payment.status === 'failed'
                            ? 'danger'
                            : 'warning'
                      }
                      variant='flat'
                      size='sm'>
                      {formatStatus(order.payment.status)}
                    </Chip>
                  </div>
                  {order.payment.transactionId && (
                    <div className='flex justify-between'>
                      <span className='text-color-muted'>Transaction ID</span>
                      <span className='text-sm font-mono'>
                        {order.payment.transactionId}
                      </span>
                    </div>
                  )}
                  {order.payment.paidAt && (
                    <div className='flex justify-between'>
                      <span className='text-color-muted'>Paid At</span>
                      <span className='text-sm'>
                        {formatDate(order.payment.paidAt)}
                      </span>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Shipping Information */}
          <div className='grid gap-6 md:grid-cols-2'>
            <Card>
              <CardBody className='p-6'>
                <h2 className='text-xl font-semibold mb-4'>Shipping Address</h2>
                <div className='space-y-1 text-sm'>
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
                    {order.shippingAddress.zipCode}
                  </p>
                  <p>{order.shippingAddress.country}</p>
                  {order.shippingAddress.phone && (
                    <p className='mt-2'>{order.shippingAddress.phone}</p>
                  )}
                </div>
                {order.shipping && (
                  <div className='mt-4 pt-4 border-t border-divider'>
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
                        Shipped: {formatDate(order.shipping.shippedAt)}
                      </p>
                    )}
                    {order.shipping.deliveredAt && (
                      <p className='text-sm text-color-muted'>
                        Delivered: {formatDate(order.shipping.deliveredAt)}
                      </p>
                    )}
                  </div>
                )}
              </CardBody>
            </Card>

            {order.billingAddress && (
              <Card>
                <CardBody className='p-6'>
                  <h2 className='text-xl font-semibold mb-4'>Billing Address</h2>
                  <div className='space-y-1 text-sm'>
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
                      {order.billingAddress.zipCode}
                    </p>
                    <p>{order.billingAddress.country}</p>
                  </div>
                </CardBody>
              </Card>
            )}
          </div>

          {/* Order Details */}
          <Card>
            <CardBody className='p-6'>
              <h2 className='text-xl font-semibold mb-4'>Order Details</h2>
              <div className='space-y-2 text-sm'>
                <div className='flex justify-between'>
                  <span className='text-color-muted'>Order Number</span>
                  <span className='font-mono'>{order.orderNumber}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-color-muted'>Placed On</span>
                  <span>{formatDate(order.createdAt)}</span>
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

          {/* Actions */}
          <div className='flex gap-4 justify-end'>
            <Button
              variant='flat'
              as={NextLink}
              href='/account'>
              Back to Account
            </Button>
            {order.orderStatus !== 'cancelled' &&
              order.orderStatus !== 'delivered' &&
              order.orderStatus !== 'refunded' && (
                <Button
                  color='danger'
                  variant='flat'
                  onPress={() => {
                    // TODO: Implement cancel order functionality
                    alert('Cancel order functionality coming soon')
                  }}>
                  Cancel Order
                </Button>
              )}
          </div>
        </div>
      </div>
    </div>
  )
}


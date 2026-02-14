'use client'

import {api} from '@/convex/_generated/api'
import {Icon} from '@/lib/icons'
import {formatPrice} from '@/utils/formatPrice'
import {Avatar, Button, Card, Chip} from '@heroui/react'
import {useQuery} from 'convex/react'
import Link from 'next/link'
import {useRouter} from 'next/navigation'

interface ContentProps {
  firebaseId: string
}

const formatDate = (timestamp?: number) => {
  if (!timestamp) return 'N/A'
  return new Date(timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const getStatusColor = (status?: string) => {
  const normalized = (status ?? 'active').toLowerCase()
  if (normalized === 'suspended' || normalized === 'banned') return 'danger'
  if (normalized === 'pending') return 'warning'
  return 'success'
}

export const Content = ({firebaseId}: ContentProps) => {
  const router = useRouter()
  const customer = useQuery(api.users.q.getByFid, {fid: firebaseId})
  const orders = useQuery(
    api.orders.q.getUserOrders,
    customer?._id ? {userId: customer._id, limit: 15} : 'skip',
  )

  if (customer === undefined) {
    return (
      <main className='min-h-screen px-4 pb-16'>
        <Card shadow='sm' className='p-4'>
          <p className='text-sm text-gray-400'>Loading customer profile...</p>
        </Card>
      </main>
    )
  }

  if (customer === null) {
    return (
      <main className='min-h-screen px-4 pb-16'>
        <Card shadow='sm' className='p-6'>
          <div className='space-y-4'>
            <h1 className='text-xl font-semibold'>Customer Not Found</h1>
            <p className='text-sm text-gray-400'>
              No customer exists for ID: {firebaseId}
            </p>
            <Button
              color='primary'
              variant='flat'
              onPress={() => router.push('/admin/ops/customers')}>
              Back to Customers
            </Button>
          </div>
        </Card>
      </main>
    )
  }

  return (
    <main className='min-h-screen px-4 pb-16'>
      <div className='space-y-6'>
        <div className='flex items-center gap-4'>
          <Button
            isIconOnly
            variant='light'
            aria-label='Back to customers'
            className='min-w-0'
            onPress={() => router.push('/admin/ops/customers')}>
            <Icon name='chevron-left' className='size-4' />
          </Button>
          <div className='flex-1'>
            <div className='flex items-center space-x-4 md:space-x-6'>
              <Avatar
                src={customer.photoUrl}
                size='lg'
                classNames={{
                  base: 'bg-linear-to-br from-[#FFB457] to-[#FF705B]',
                  icon: 'text-black/80',
                }}
                icon={<Icon name='user-fill' className='size-5' />}
              />
              <div className='flex-1'>
                <h1 className='text-xl font-semibold space-x-3'>
                  <span className='opacity-80'>
                    {customer.email?.split('@').shift()}
                  </span>
                  <span className='font-okxs font-light text-foreground opacity-60'>
                    {customer.name}
                  </span>
                </h1>
                <div className='flex items-center space-x-6'>
                  <div className='flex items-center space-x-1'>
                    <Icon name='phone' className='size-5 opacity-80' />
                    <p className='text-sm text-mac-blue mt-1'>
                      {customer.contact?.phone}
                    </p>
                  </div>
                  <div className='flex items-center space-x-1'>
                    <Icon name='mail-send-fill' className='size-5 opacity-80' />
                    <p className='text-sm text-mac-blue mt-1'>
                      {customer.email}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <Chip
            size='sm'
            variant='flat'
            color={getStatusColor(customer.accountStatus)}
            className='capitalize'>
            {(customer.accountStatus ?? 'active').replace(/_/g, ' ')}
          </Chip>
        </div>

        <div className='grid md:grid-cols-2 gap-4'>
          <div className='space-y-4'>
            <Card shadow='none' className='p-6 space-y-5'>
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <div className='space-y-1'>
                  <p className='text-xs uppercase tracking-wide text-muted-foreground'>
                    Firebase ID
                  </p>
                  <p className='font-mono text-xs'>
                    {customer.firebaseId ?? 'N/A'}
                  </p>
                </div>
                <div className='space-y-1'>
                  <p className='text-xs uppercase tracking-wide text-muted-foreground'>
                    FID
                  </p>
                  <p className='font-mono text-xs'>{customer.fid ?? 'N/A'}</p>
                </div>
                <div className='space-y-1'>
                  <p className='text-xs uppercase tracking-wide text-muted-foreground'>
                    Created
                  </p>
                  <p className='text-sm'>{formatDate(customer.createdAt)}</p>
                </div>
                <div className='space-y-1'>
                  <p className='text-xs uppercase tracking-wide text-muted-foreground'>
                    Last Updated
                  </p>
                  <p className='text-sm'>{formatDate(customer.updatedAt)}</p>
                </div>
              </div>
            </Card>

            <Card shadow='none' className='p-6 space-y-4'>
              <h2 className='text-base font-semibold'>Addresses</h2>
              {customer.addresses?.length ? (
                <div className='space-y-3'>
                  {customer.addresses.map((address) => (
                    <div
                      key={address.id}
                      className='rounded-lg border border-divider p-3 text-sm'>
                      <p className='font-medium'>
                        {address.firstName} {address.lastName}
                      </p>
                      <p>{address.addressLine1}</p>
                      {address.addressLine2 && <p>{address.addressLine2}</p>}
                      <p>
                        {address.city}, {address.state} {address.zipCode}
                      </p>
                      <p>{address.country}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className='text-sm text-muted-foreground'>
                  No addresses on file.
                </p>
              )}
            </Card>
            <Card shadow='none' className='p-6 space-y-4'>
              <h2 className='text-base font-semibold'>Shipping Accounts</h2>

              <p className='text-sm text-muted-foreground'>
                No Shipping accounts link to customer&apos;s orders on file.
              </p>
            </Card>
          </div>
          <div>
            <Card
              shadow='none'
              className='p-6 space-y-4 max-h-[calc(82lvh)] overflow-scroll'>
              <h2 className='text-base font-semibold'>Recent Orders</h2>
              {orders === undefined ? (
                <p className='text-sm text-muted-foreground'>
                  Loading orders...
                </p>
              ) : orders.length === 0 ? (
                <p className='text-sm text-muted-foreground'>No orders yet.</p>
              ) : (
                <div className='space-y-2'>
                  {orders.map((order, i) => (
                    <div
                      key={order._id}
                      className='flex items-center justify-between rounded-lg border border-divider p-3'>
                      <div className='flex space-x-3'>
                        <div className='font-brk opacity-70'>{i + 1}</div>
                        <div>
                          <Link
                            href={`/admin/ops/orders/${order.orderNumber}`}
                            className='font-medium hover:underline underline-offset-2'>
                            {order.orderNumber}
                          </Link>
                          <p className='text-xs text-muted-foreground'>
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className='text-right'>
                        <p className='text-sm font-semibold'>
                          ${formatPrice(order.totalCents)}
                        </p>
                        <p className='text-xs capitalize text-muted-foreground'>
                          {order.orderStatus.replace(/_/g, ' ')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}

'use client'

import {api} from '@/convex/_generated/api'
import type {Doc} from '@/convex/_generated/dataModel'
import {formatPrice} from '@/utils/formatPrice'
import {
  Card,
  Chip,
  ChipProps,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react'
import {useQuery} from 'convex/react'
import {useMemo} from 'react'

type Order = Doc<'orders'>

const statusColorMap: Record<string, ChipProps['color']> = {
  order_processing: 'primary',
  awaiting_courier_pickup: 'secondary',
  shipping: 'default',
  shipped: 'success',
}

const columns = [
  {name: 'ORDER NUMBER', uid: 'orderNumber'},
  {name: 'CUSTOMER', uid: 'customer'},
  {name: 'STATUS', uid: 'status'},
  {name: 'TRACKING', uid: 'tracking'},
  {name: 'ESTIMATED DELIVERY', uid: 'estimatedDelivery'},
  {name: 'TOTAL', uid: 'total'},
]

export const DeliveriesTable = () => {
  const allOrders = useQuery(api.orders.q.getRecentOrders, {limit: 100})

  const deliveries = useMemo(() => {
    if (!allOrders) return []
    return allOrders.filter(
      (order) =>
        order.orderStatus === 'order_processing' ||
        order.orderStatus === 'awaiting_courier_pickup' ||
        order.orderStatus === 'shipping' ||
        order.orderStatus === 'shipped',
    )
  }, [allOrders])

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'N/A'
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const renderCell = (order: Order, columnKey: React.Key) => {
    switch (columnKey) {
      case 'orderNumber':
        return (
          <div className='flex flex-col'>
            <p className='text-bold text-sm capitalize'>{order.orderNumber}</p>
          </div>
        )
      case 'customer':
        return (
          <div className='flex flex-col'>
            <p className='text-bold text-sm'>{order.contactEmail}</p>
            {order.shippingAddress && (
              <p className='text-xs text-gray-400'>
                {order.shippingAddress.city}, {order.shippingAddress.state}
              </p>
            )}
          </div>
        )
      case 'status':
        return (
          <Chip
            className='capitalize'
            color={statusColorMap[order.orderStatus] || 'default'}
            size='sm'
            variant='flat'>
            {order.orderStatus
              .split('_')
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ')}
          </Chip>
        )
      case 'tracking':
        return (
          <div className='flex flex-col'>
            {order.shipping?.trackingNumber ? (
              <p className='text-bold text-sm font-mono'>
                {order.shipping.trackingNumber}
              </p>
            ) : (
              <p className='text-sm text-gray-400'>No tracking</p>
            )}
            {order.shipping?.carrier && (
              <p className='text-xs text-gray-400'>{order.shipping.carrier}</p>
            )}
          </div>
        )
      case 'estimatedDelivery':
        return (
          <div className='flex flex-col'>
            <p className='text-bold text-sm'>
              {formatDate(order.shipping?.estimatedDelivery)}
            </p>
            {order.shipping?.shippedAt && (
              <p className='text-xs text-gray-400'>
                Shipped: {formatDate(order.shipping.shippedAt)}
              </p>
            )}
          </div>
        )
      case 'total':
        return (
          <div className='flex flex-col'>
            <p className='text-bold text-sm'>
              ${formatPrice(order.totalCents)}
            </p>
          </div>
        )
      default:
        return null
    }
  }

  const classNames = useMemo(
    () => ({
      wrapper: ['max-h-[382px]', 'max-w-3xl'],
      th: ['bg-transparent', 'text-gray-400', 'border-b', 'border-divider'],
      td: [
        'group-data-[first=true]:first:before:rounded-none',
        'group-data-[first=true]:last:before:rounded-none',
        'group-data-[middle=true]:before:rounded-none',
        'group-data-[last=true]:first:before:rounded-none',
        'group-data-[last=true]:last:before:rounded-none',
      ],
    }),
    [],
  )

  if (!allOrders) {
    return (
      <Card shadow='sm' className='p-4'>
        <p className='text-sm text-gray-400'>Loading deliveries...</p>
      </Card>
    )
  }

  return (
    <Card
      shadow='none'
      radius='none'
      className='md:rounded-lg md:w-full w-screen overflow-scroll p-4 dark:bg-dark-table/40'>
      {/*<div className='flex items-center justify-between mb-4'>
        <h2 className='text-lg font-semibold font-space'>Deliveries</h2>
        <p className='text-sm text-gray-400'>{deliveries.length} active</p>
      </div>*/}
      <Table
        isCompact
        removeWrapper
        aria-label='Deliveries table'
        classNames={classNames}>
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn key={column.uid} align='start'>
              {column.name}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody emptyContent={'No deliveries found'} items={deliveries}>
          {(order) => (
            <TableRow key={order._id} className='h-16'>
              {(columnKey) => (
                <TableCell>{renderCell(order, columnKey)}</TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  )
}

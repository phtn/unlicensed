'use client'

import {DataTable} from '@/components/table-v2'
import {ColumnConfig} from '@/components/table-v2/create-column'
import {ColHeader} from '@/components/table-v2/headers'
import {api} from '@/convex/_generated/api'
import type {Doc} from '@/convex/_generated/dataModel'
import {cn} from '@/lib/utils'
import {formatPrice} from '@/utils/formatPrice'
import {useQuery} from 'convex/react'
import {useMemo} from 'react'

type Order = Doc<'orders'>

const deliveryStatuses: Order['orderStatus'][] = [
  'order_processing',
  'awaiting_courier_pickup',
  'shipping',
  'shipped',
]

const statusColorMap: Record<Order['orderStatus'], string> = {
  pending_payment: 'bg-zinc-300/30 text-zinc-700 dark:bg-zinc-500/30 dark:text-zinc-300',
  order_processing:
    'bg-sky-500/20 text-sky-800 dark:bg-sky-400/25 dark:text-sky-200',
  awaiting_courier_pickup:
    'bg-orange-500/20 text-orange-800 dark:bg-orange-400/25 dark:text-orange-200',
  shipping:
    'bg-indigo-500/20 text-indigo-800 dark:bg-indigo-400/25 dark:text-indigo-200',
  resend: 'bg-rose-500/20 text-rose-800 dark:bg-rose-400/25 dark:text-rose-200',
  shipped:
    'bg-emerald-500/20 text-emerald-800 dark:bg-emerald-400/25 dark:text-emerald-200',
  cancelled: 'bg-red-500/20 text-red-800 dark:bg-red-400/25 dark:text-red-200',
}

const formatDeliveryDate = (timestamp?: number) => {
  if (!timestamp) return 'N/A'
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const formatStatus = (status: Order['orderStatus']) =>
  status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

export const DeliveriesTable = () => {
  const allOrders = useQuery(api.orders.q.getRecentOrders, {limit: 100})

  const deliveries = useMemo(() => {
    if (!allOrders) return []
    return allOrders.filter((order) => deliveryStatuses.includes(order.orderStatus))
  }, [allOrders])

  const columns = useMemo(
    () =>
      [
        {
          id: 'orderNumber',
          header: <ColHeader tip='Order number' symbol='Order Number' />,
          accessorKey: 'orderNumber',
          size: 180,
          cell: ({row}) => (
            <div className='flex flex-col'>
              <p className='font-medium text-sm'>{row.original.orderNumber}</p>
            </div>
          ),
        },
        {
          id: 'customer',
          header: <ColHeader tip='Customer' symbol='Customer' />,
          accessorKey: 'contactEmail',
          size: 260,
          cell: ({row}) => (
            <div className='flex flex-col'>
              <p className='font-medium text-sm'>{row.original.contactEmail}</p>
              <p className='text-xs text-muted-foreground'>
                {row.original.shippingAddress.city}, {row.original.shippingAddress.state}
              </p>
            </div>
          ),
        },
        {
          id: 'status',
          header: <ColHeader tip='Delivery status' symbol='Status' center />,
          accessorKey: 'orderStatus',
          size: 220,
          cell: ({row}) => (
            <div className='flex justify-center'>
              <span
                className={cn(
                  'inline-flex items-center rounded-sm px-2 py-1 font-mono text-xs uppercase tracking-wide',
                  statusColorMap[row.original.orderStatus],
                )}>
                {formatStatus(row.original.orderStatus)}
              </span>
            </div>
          ),
        },
        {
          id: 'tracking',
          header: <ColHeader tip='Tracking number + carrier' symbol='Tracking' />,
          accessorKey: 'shipping',
          size: 220,
          cell: ({row}) => (
            <div className='flex flex-col'>
              {row.original.shipping?.trackingNumber ? (
                <p className='font-mono text-sm'>{row.original.shipping.trackingNumber}</p>
              ) : (
                <p className='text-sm text-muted-foreground'>No tracking</p>
              )}
              {row.original.shipping?.carrier && (
                <p className='text-xs text-muted-foreground'>{row.original.shipping.carrier}</p>
              )}
            </div>
          ),
        },
        {
          id: 'estimatedDelivery',
          header: <ColHeader tip='ETA + shipped date' symbol='Estimated Delivery' />,
          accessorKey: 'shipping',
          size: 220,
          cell: ({row}) => (
            <div className='flex flex-col'>
              <p className='font-medium text-sm'>
                {formatDeliveryDate(row.original.shipping?.estimatedDelivery)}
              </p>
              {row.original.shipping?.shippedAt && (
                <p className='text-xs text-muted-foreground'>
                  Shipped: {formatDeliveryDate(row.original.shipping?.shippedAt)}
                </p>
              )}
            </div>
          ),
        },
        {
          id: 'total',
          header: <ColHeader tip='Order total' symbol='Total' right />,
          accessorKey: 'totalCents',
          size: 120,
          cell: ({row}) => (
            <div className='text-right'>
              <p className='font-medium text-sm'>${formatPrice(row.original.totalCents)}</p>
            </div>
          ),
        },
      ] as ColumnConfig<Order>[],
    [],
  )

  if (!allOrders) {
    return <p className='text-sm text-muted-foreground px-4'>Loading deliveries...</p>
  }

  return (
    <div className='relative w-full max-w-full overflow-hidden'>
      <DataTable
        title='Deliveries'
        data={deliveries}
        loading={false}
        editingRowId={null}
        columnConfigs={columns}
      />
    </div>
  )
}

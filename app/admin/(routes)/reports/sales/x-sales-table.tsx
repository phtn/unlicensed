'use client'

import {DataTable} from '@/components/table-v2'
import {ColumnConfig} from '@/components/table-v2/create-column'
import {api} from '@/convex/_generated/api'
import {Doc} from '@/convex/_generated/dataModel'
import {formatPrice} from '@/utils/formatPrice'
import {useQuery} from 'convex/react'
import {useMemo} from 'react'

export const SalesDataTable = () => {
  const allOrders = useQuery(api.orders.q.getRecentOrders, {limit: 100})

  const data = useMemo(() => {
    if (!allOrders) return []
    return allOrders.filter((order) => order.payment.status === 'completed')
  }, [allOrders])

  const columns = useMemo(
    () =>
      [
        {
          id: 'orderNumber',
          header: 'Order #',
          accessorKey: 'orderNumber',
          size: 140,
        },
        {
          id: 'customer',
          header: 'Customer',
          accessorKey: 'contactEmail',
          size: 220,
          cell: ({row}) => (
            <span className='text-sm truncate'>
              {row.original.contactEmail}
            </span>
          ),
        },
        {
          id: 'shipTo',
          header: 'ship to',
          accessorKey: 'shippingAddress',
          size: 220,
          cell: ({row}) => (
            <span className='text-sm truncate'>
              {row.original.shippingAddress.state}
            </span>
          ),
        },
        {
          id: 'status',
          header: 'Status',
          accessorKey: 'orderStatus',
          size: 180,
          cell: ({row}) => (
            <span className='text-xs uppercase tracking-wide'>
              {row.original.orderStatus.replaceAll('_', ' ')}
            </span>
          ),
        },
        {
          id: 'items',
          header: 'Items',
          accessorKey: 'items',
          size: 100,
          cell: ({row}) => (
            <span className='text-sm'>
              {row.original.items.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          ),
        },
        {
          id: 'total',
          header: 'Amount',
          accessorKey: 'totalCents',
          size: 120,
          cell: ({row}) => (
            <span className='text-sm'>
              ${formatPrice(row.original.totalCents)}
            </span>
          ),
        },
        {
          id: 'createdAt',
          header: 'Created',
          accessorKey: 'createdAt',
          cell: ({row}) => (
            <span className='text-xs text-muted-foreground'>
              {new Date(
                row.original.createdAt ?? row.original._creationTime,
              ).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </span>
          ),
          size: 180,
        },
      ] as ColumnConfig<Doc<'orders'>>[],
    [],
  )

  return (
    <div className='relative w-full max-w-full overflow-hidden'>
      <DataTable
        data={data}
        title={'Sales'}
        columnConfigs={columns}
        loading={!allOrders}
        editingRowId={null}
      />
    </div>
  )
}

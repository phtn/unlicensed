'use client'

import {DataTable} from '@/components/table-v2'
import {ColumnConfig} from '@/components/table-v2/create-column'
import {ColHeader} from '@/components/table-v2/headers'
import {api} from '@/convex/_generated/api'
import {Doc} from '@/convex/_generated/dataModel'
import {formatPrice} from '@/utils/formatPrice'
import {useQuery} from 'convex/react'
import Link from 'next/link'
import {useMemo} from 'react'
import {orderNumberCell} from '../../ops/components'

export const SalesDataTable = () => {
  const allOrders = useQuery(api.orders.q.getRecentOrders, {limit: 100})
  const users = useQuery(api.users.q.getAllUsers, {limit: 5000})

  const data = useMemo(() => {
    if (!allOrders) return []
    return allOrders.filter((order) => order.payment.status === 'completed')
  }, [allOrders])

  const customerProfileIdByUserId = useMemo(() => {
    const map = new Map<string, string>()
    if (!users) return map

    for (const user of users) {
      const profileId = user.firebaseId ?? user.fid
      if (!profileId) continue
      map.set(String(user._id), profileId)
    }

    return map
  }, [users])

  const columns = useMemo(
    () =>
      [
        {
          id: 'orderNumber',
          header: 'Order #',
          accessorKey: 'orderNumber',
          cell: orderNumberCell(),
          size: 60,
        },
        {
          id: 'customer',
          header: 'Customer',
          accessorKey: 'contactEmail',
          size: 220,
          cell: ({row}) => {
            const email = row.original.contactEmail
            const profileId = row.original.userId
              ? customerProfileIdByUserId.get(String(row.original.userId))
              : undefined

            if (!profileId) {
              return <span className='text-sm truncate'>{email}</span>
            }

            return (
              <Link
                prefetch
                href={`/admin/ops/customers/${profileId}`}
                className='text-sm truncate hover:underline underline-offset-2 decoration-dotted decoration-foreground/40'>
                {email}
              </Link>
            )
          },
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
          size: 10,
          cell: ({row}) => (
            <span className='text-sm'>
              {row.original.items.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          ),
        },
        {
          id: 'total',
          header: <ColHeader tip='Total Amount' symbol='Amount' center />,
          accessorKey: 'totalCents',
          size: 100,
          cell: ({row}) => (
            <div className='flex items-center justify-end pr-6'>
              <p className='font-brk text-xs text-muted-foreground text-right mr-6'>
                {formatPrice(row.original.totalCents)}
              </p>
            </div>
          ),
        },
        {
          id: 'method',
          header: 'Method',
          accessorKey: 'payment',
          size: 100,
          cell: ({row}) => (
            <span className='text-sm'>{row.original.payment.method}</span>
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
    [customerProfileIdByUserId],
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

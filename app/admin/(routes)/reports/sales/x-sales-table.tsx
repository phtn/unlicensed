'use client'

import {DataTable} from '@/components/table-v2'
import {ColumnConfig} from '@/components/table-v2/create-column'
import {ColHeader} from '@/components/table-v2/headers'
import {api} from '@/convex/_generated/api'
import {Doc} from '@/convex/_generated/dataModel'
import {cn} from '@/lib/utils'
import {formatPrice} from '@/utils/formatPrice'
import {useQuery} from 'convex/react'
import Link from 'next/link'
import {useMemo} from 'react'
import {orderNumberCell, paymentMethodCell} from '../../ops/components'
import {Order} from '../../ops/types'

const formatStatus = (status: Order['orderStatus']) =>
  status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

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
          size: 160,
          cell: ({row}) => (
            <div className='flex'>
              <span
                className={cn(
                  'inline-flex items-center rounded-sm px-2 py-1.5 font-mono text-xs uppercase tracking-wide',
                  statusColorMap[row.original.orderStatus],
                )}>
                {formatStatus(row.original.orderStatus)}
              </span>
            </div>
          ),
        },
        {
          id: 'items',
          accessorKey: 'items',
          header: <ColHeader tip='Items' symbol='Items' center />,
          size: 64,
          cell: ({row}) => (
            <div className='text-sm text-center w-full'>
              {row.original.items.reduce((sum, item) => sum + item.quantity, 0)}
            </div>
          ),
        },
        {
          id: 'total',
          header: <ColHeader tip='Total Amount' symbol='Amount' center />,
          accessorKey: 'totalCents',
          size: 120,
          cell: ({row}) => (
            <div className='flex items-center justify-end pr-6'>
              <p className='font-brk text-sm text-muted-foreground text-right mr-6'>
                ${formatPrice(row.original.totalCents)}
              </p>
            </div>
          ),
        },
        {
          id: 'method',
          header: 'Payment Method',
          accessorKey: 'payment',
          size: 80,
          cell: paymentMethodCell(),
        },
        {
          id: 'createdAt',
          header: 'Created',
          accessorKey: 'createdAt',
          cell: ({row}) => (
            <span className='px-4 text-sm text-muted-foreground'>
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

const statusColorMap: Record<Order['orderStatus'], string> = {
  pending_payment:
    'bg-zinc-300/30 text-zinc-700 dark:bg-zinc-500/30 dark:text-zinc-300',
  order_processing:
    'bg-sky-500/20 text-sky-800 dark:bg-sky-400/25 dark:text-sky-200',
  awaiting_courier_pickup:
    'bg-orange-500/20 text-orange-800 dark:bg-orange-400/25 dark:text-orange-200',
  shipped:
    'bg-emerald-500/20 text-emerald-800 dark:bg-emerald-400/25 dark:text-emerald-200',
  delivered:
    'bg-green-500/20 text-green-800 dark:bg-green-400/25 dark:text-green-200',
  // shipping:
  //   'bg-indigo-500/20 text-indigo-800 dark:bg-indigo-400/25 dark:text-indigo-200',
  resend: 'bg-rose-500/20 text-rose-800 dark:bg-rose-400/25 dark:text-rose-200',

  cancelled: 'bg-red-500/20 text-red-800 dark:bg-red-400/25 dark:text-red-200',
}

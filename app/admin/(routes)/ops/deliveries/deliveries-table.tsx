'use client'

import {DataTable} from '@/components/table-v2'
import {ColumnConfig} from '@/components/table-v2/create-column'
import {ColHeader} from '@/components/table-v2/headers'
import {api} from '@/convex/_generated/api'
import type {Doc, Id} from '@/convex/_generated/dataModel'
import {cn} from '@/lib/utils'
import {formatPrice} from '@/utils/formatPrice'
import {useMutation, useQuery} from 'convex/react'
import Link from 'next/link'
import {useEffect, useMemo, useState} from 'react'
import {courierCell, orderNumberCell} from '../components'

type Order = Doc<'orders'>

const deliveryStatuses: Order['orderStatus'][] = [
  'order_processing',
  'awaiting_courier_pickup',
  'shipped',
]

const statusColorMap: Record<Order['orderStatus'], string> = {
  pending_payment:
    'bg-zinc-300/30 text-zinc-700 dark:bg-zinc-500/30 dark:text-zinc-300',
  order_processing:
    'bg-sky-500/20 text-sky-800 dark:bg-sky-400/25 dark:text-sky-200',
  awaiting_courier_pickup:
    'bg-orange-500/20 text-orange-800 dark:bg-orange-400/25 dark:text-orange-200',
  shipped:
    'bg-emerald-500/20 text-emerald-800 dark:bg-emerald-400/25 dark:text-emerald-200',
  // shipping:
  //   'bg-indigo-500/20 text-indigo-800 dark:bg-indigo-400/25 dark:text-indigo-200',
  resend: 'bg-rose-500/20 text-rose-800 dark:bg-rose-400/25 dark:text-rose-200',

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

const toDateInputValue = (timestamp?: number) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const fromDateInputValue = (value: string) => {
  if (!value) return undefined
  return new Date(`${value}T00:00:00`).getTime()
}

const TrackingEditableCell = ({row}: {row: {original: Order}}) => {
  const updateShipping = useMutation(api.orders.m.updateShipping)
  const originalTracking = row.original.shipping?.trackingNumber ?? ''
  const [value, setValue] = useState(originalTracking)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setValue(originalTracking)
  }, [originalTracking])

  const save = async () => {
    const nextTracking = value.trim()
    if (nextTracking === originalTracking) return
    setIsSaving(true)
    try {
      await updateShipping({
        orderId: row.original._id as Id<'orders'>,
        shipping: {
          ...row.original.shipping,
          trackingNumber: nextTracking || undefined,
        },
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className='flex flex-col gap-1'>
      <input
        type='text'
        value={value}
        placeholder='Add tracking'
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => {
          void save()
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
          if (e.key === 'Escape') {
            setValue(originalTracking)
            e.currentTarget.blur()
          }
        }}
        disabled={isSaving}
        className='h-8 w-full rounded-md border border-default-300 bg-transparent px-2 text-sm font-mono outline-none focus:border-primary'
      />
      {row.original.shipping?.carrier && (
        <p className='text-xs text-muted-foreground'>
          {row.original.shipping.carrier}
        </p>
      )}
    </div>
  )
}

const EstimatedDeliveryEditableCell = ({row}: {row: {original: Order}}) => {
  const updateShipping = useMutation(api.orders.m.updateShipping)
  const originalEstimated = row.original.shipping?.estimatedDelivery
  const [value, setValue] = useState(toDateInputValue(originalEstimated))
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setValue(toDateInputValue(originalEstimated))
  }, [originalEstimated])

  const save = async () => {
    const nextEstimated = fromDateInputValue(value)
    if ((nextEstimated ?? undefined) === (originalEstimated ?? undefined))
      return
    setIsSaving(true)
    try {
      await updateShipping({
        orderId: row.original._id as Id<'orders'>,
        shipping: {
          ...row.original.shipping,
          estimatedDelivery: nextEstimated,
        },
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className='flex flex-col gap-1 px-2'>
      <input
        type='date'
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => {
          void save()
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
          if (e.key === 'Escape') {
            setValue(toDateInputValue(originalEstimated))
            e.currentTarget.blur()
          }
        }}
        disabled={isSaving}
        className='h-8 w-full rounded-md bg-transparent px-2 text-sm outline-none focus:border-primary'
      />
      {row.original.shipping?.shippedAt && (
        <p className='text-xs text-muted-foreground'>
          Shipped: {formatDeliveryDate(row.original.shipping.shippedAt)}
        </p>
      )}
    </div>
  )
}

export const DeliveriesTable = () => {
  const allOrders = useQuery(api.orders.q.getRecentOrders, {limit: 100})
  const users = useQuery(api.users.q.getAllUsers, {limit: 5000})

  const deliveries = useMemo(() => {
    if (!allOrders) return []
    return allOrders.filter((order) =>
      deliveryStatuses.includes(order.orderStatus),
    )
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
          header: <ColHeader tip='Order #' symbol='Order #' />,
          accessorKey: 'orderNumber',
          cell: orderNumberCell(),
          size: 140,
        },
        {
          id: 'status',
          header: <ColHeader tip='Delivery status' symbol='Status' />,
          accessorKey: 'orderStatus',
          cell: ({row}) => (
            <div className='flex'>
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
          id: 'customer',
          header: <ColHeader tip='Customer' symbol='Customer' />,
          accessorKey: 'contactEmail',
          size: 200,
          cell: ({row}) => {
            const profileId = row.original.userId
              ? customerProfileIdByUserId.get(String(row.original.userId))
              : undefined
            const label =
              row.original.contactEmail?.split('@').shift() ??
              row.original.contactEmail ??
              'Guest'

            return (
              <div className='flex flex-col'>
                {profileId ? (
                  <Link
                    prefetch
                    href={`/admin/ops/customers/${profileId}`}
                    className='font-medium text-sm hover:underline underline-offset-2 decoration-dotted decoration-foreground/40'>
                    {label}
                  </Link>
                ) : (
                  <p className='font-medium text-sm'>{label}</p>
                )}
              </div>
            )
          },
        },
        {
          id: 'shipTo',
          header: <ColHeader tip='' symbol='Ship To' />,
          accessKey: 'shippingAddress',
          size: 100,
          cell: ({row}) => (
            <div>
              <p className='text-xs text-muted-foreground'>
                {row.original.shippingAddress.city},{' '}
                {row.original.shippingAddress.state}
              </p>
            </div>
          ),
        },
        {
          id: 'courier',
          header: <ColHeader tip='Courier' symbol='Courier' center />,
          accessorKey: 'courier',
          cell: courierCell(),
          size: 100,
        },
        {
          id: 'tracking',
          header: (
            <ColHeader tip='Tracking number + carrier' symbol='Tracking' />
          ),
          accessorKey: 'shipping',
          size: 220,
          cell: ({row}) => <TrackingEditableCell row={row} />,
        },
        {
          id: 'estimatedDelivery',
          header: (
            <ColHeader tip='ETA + shipped date' symbol='Est Delivery' center />
          ),
          accessorKey: 'shipping',
          size: 80,
          cell: ({row}) => <EstimatedDeliveryEditableCell row={row} />,
        },
        {
          id: 'total',
          header: <ColHeader tip='Order total' symbol='Total' center />,
          accessorKey: 'totalCents',
          size: 100,
          cell: ({row}) => (
            <div className='text-right pr-4'>
              <p className='font-medium text-sm'>
                ${formatPrice(row.original.totalCents)}
              </p>
            </div>
          ),
        },
      ] as ColumnConfig<Order>[],
    [customerProfileIdByUserId],
  )

  if (!allOrders) {
    return (
      <p className='text-sm text-muted-foreground px-4'>
        Loading deliveries...
      </p>
    )
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

'use client'

import {DataTable} from '@/components/table-v2'
import {dateCell, priceCell, textCell} from '@/components/table-v2/cells-v2'
import {ActionConfig, ColumnConfig} from '@/components/table-v2/create-column'
import {ColHeader} from '@/components/table-v2/headers'
import {api} from '@/convex/_generated/api'
import type {Doc} from '@/convex/_generated/dataModel'
import {cn} from '@/lib/utils'
import {formatPrice} from '@/utils/formatPrice'
import {CellContext} from '@tanstack/react-table'
import {useQuery} from 'convex/react'
import Link from 'next/link'
import {useCallback, useMemo} from 'react'
import {useSettingsPanel} from '../../../_components/ui/settings'
import {CourierCell} from './courier-cell'
import {useOrderDetails} from './order-details-context'

type Order = Doc<'orders'>

type StatusCode =
  | 'pending_payment'
  | 'order_processing'
  | 'awaiting_courier_pickup'
  | 'shipping'
  | 'resend'
  | 'shipped'
  | 'cancelled'
  | 'default'

const colorMap: Record<StatusCode, string> = {
  pending_payment: 'bg-amber-400/25 dark:bg-orange-300/45',
  order_processing: 'bg-sky-600/20 dark:bg-blue-400/45',
  awaiting_courier_pickup: 'bg-orange-200/65 dark:bg-orange-400/45',
  shipping: 'bg-purple-200/70 dark:bg-purple-400/35',
  resend: 'bg-red-200/70 dark:bg-red-400/50',
  shipped: 'bg-emerald-400/35 dark:bg-emerald-400/35',
  cancelled: 'dark:bg-red-400/40',
  default: 'bg-[#e8e6e5]',
}

function statusCell() {
  const StatusCellComponent = (ctx: CellContext<Order, unknown>) => {
    const status = ctx.getValue() as string | undefined
    if (!status) return <span className='text-muted-foreground'>—</span>
    const normalizedStatus = status.toLowerCase() as StatusCode
    const color = colorMap[normalizedStatus] || colorMap.default
    const displayStatus = status
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')

    return (
      <div
        className={cn(
          'flex items-center uppercase justify-center rounded-sm w-fit px-2 py-1.5 font-mono shadow-none',
          color,
        )}>
        <p className='text-xs tracking-wider font-brk whitespace-nowrap drop-shadow-xs'>
          {displayStatus}
        </p>
      </div>
    )
  }
  StatusCellComponent.displayName = 'StatusCell'
  return StatusCellComponent
}

function orderNumberCell() {
  const OrderNumberCellComponent = (ctx: CellContext<Order, unknown>) => {
    const orderNumber = ctx.getValue() as string | undefined
    if (!orderNumber) return <span className='text-muted-foreground'>—</span>

    return (
      <div className='flex flex-col w-fit'>
        <Link
          color='foreground'
          href={`/admin/orders/${orderNumber}`}
          className='font-mono opacity-80 text-sm hover:underline underline-offset-4 decoration-dashed decoration-foreground/40'>
          {orderNumber}
        </Link>
      </div>
    )
  }
  OrderNumberCellComponent.displayName = 'OrderNumberCell'
  return OrderNumberCellComponent
}

function customerCell() {
  const CustomerCellComponent = (ctx: CellContext<Order, unknown>) => {
    const email = ctx.getValue() as string | undefined
    if (!email) return <span className='text-muted-foreground'>—</span>

    return (
      <div className='flex flex-col'>
        <p className='tracking-tight font-medium text-sm'>{email}</p>
      </div>
    )
  }
  CustomerCellComponent.displayName = 'CustomerCell'
  return CustomerCellComponent
}

function courierCell() {
  const CourierCellComponent = (ctx: CellContext<Order, unknown>) => {
    const order = ctx.row.original

    return (
      <div className='flex items-center justify-center'>
        <CourierCell order={order} />
      </div>
    )
  }
  CourierCellComponent.displayName = 'CourierCell'
  return CourierCellComponent
}

export const OrdersTable = () => {
  const orders = useQuery(api.orders.q.getRecentOrders, {limit: 100})
  const {setSelectedOrder} = useOrderDetails()
  const {togglePanel} = useSettingsPanel()

  const handleViewOrder = useCallback(
    (order: Order) => {
      setSelectedOrder(order)
      togglePanel()
    },
    [setSelectedOrder, togglePanel],
  )

  const columns = useMemo<ColumnConfig<Order>[]>(
    () => [
      {
        id: 'status',
        header: <ColHeader tip='Status' symbol='Status' />,
        accessorKey: 'orderStatus',
        cell: statusCell(),
        size: 200,
      },
      {
        id: 'totalCents',
        header: <ColHeader tip='Total' symbol='Total' center />,
        accessorKey: 'totalCents',
        cell: priceCell('totalCents', (v) => formatPrice(+v)),
        size: 100,
      },
      {
        id: 'courier',
        header: <ColHeader tip='Courier' symbol='Courier' center />,
        accessorKey: 'courier',
        cell: courierCell(),
        size: 100,
      },
      {
        id: 'shippingAddress',
        header: <ColHeader tip='Shipping Address' symbol='Shipping' />,
        accessorKey: 'shippingAddress',
        cell: textCell('shipping'),
        size: 180,
      },
      {
        id: 'orderNumber',
        header: <ColHeader tip='Order #' symbol='Order' />,
        accessorKey: 'orderNumber',
        cell: orderNumberCell(),
        size: 140,
      },
      {
        id: 'customer',
        header: <ColHeader tip='Customer' symbol='Customer' />,
        accessorKey: 'contactEmail',
        cell: customerCell(),
        size: 180,
      },
      {
        id: 'date',
        header: <ColHeader tip='Date' symbol='Date' />,
        accessorKey: 'createdAt',
        cell: dateCell('createdAt'),
      },
    ],
    [],
  )

  const actionConfig = useMemo(
    () =>
      ({
        mode: 'buttons',
        align: 'end',
        actions: [
          {
            id: 'view',
            label: '',
            icon: 'details',
            appearance: 'icon-button',
            onClick: (order: Order) => handleViewOrder(order),
          },
        ],
      }) as ActionConfig<Order>,
    [handleViewOrder],
  )

  return (
    <div className='relative w-full max-w-full overflow-hidden'>
      <DataTable
        title='Orders'
        data={orders ?? []}
        loading={!orders}
        columnConfigs={columns}
        actionConfig={actionConfig}
        editingRowId={null}
      />
    </div>
  )
}

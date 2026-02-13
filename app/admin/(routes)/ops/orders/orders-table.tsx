'use client'

import {DataTable} from '@/components/table-v2'
import {priceCell} from '@/components/table-v2/cells-v2'
import {ActionConfig, ColumnConfig} from '@/components/table-v2/create-column'
import {ColHeader} from '@/components/table-v2/headers'
import {api} from '@/convex/_generated/api'
import {formatPrice} from '@/utils/formatPrice'
import {useQuery} from 'convex/react'
import {useCallback, useMemo} from 'react'
import {useSettingsPanel} from '../../../_components/ui/settings'
import {
  courierAccountCell,
  courierCell,
  customerCell,
  orderNumberCell,
  statusCell,
} from '../components'
import type {Order} from '../types'
import {useOrderDetails} from './order-details-context'

const formatPlacedAt = (order: Order) => {
  const timestamp = order.createdAt ?? order._creationTime
  if (!timestamp) return 'N/A'
  return new Date(timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export const OrdersTable = () => {
  const orders = useQuery(api.orders.q.getRecentOrders, {limit: 100})
  const {setSelectedOrder} = useOrderDetails()
  const {setOpen, setOpenMobile} = useSettingsPanel()

  const handleViewOrder = useCallback(
    (order: Order) => {
      setSelectedOrder(order)
      setOpen(true)
      setOpenMobile(true)
    },
    [setOpen, setOpenMobile, setSelectedOrder],
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
        header: <ColHeader tip='Total Amount' symbol='Amount' center />,
        accessorKey: 'totalCents',
        cell: priceCell('totalCents', (v) => formatPrice(+v)),
        size: 120,
      },
      {
        id: 'courier',
        header: <ColHeader tip='Courier' symbol='Courier' center />,
        accessorKey: 'courier',
        cell: courierCell(),
        size: 100,
      },
      {
        id: 'courierAccount',
        header: (
          <ColHeader tip='Courier account' symbol='Courier Acct' center />
        ),
        accessorKey: 'courierAccountId',
        cell: courierAccountCell(),
        size: 180,
      },
      {
        id: 'orderNumber',
        header: <ColHeader tip='Order #' symbol='Order #' />,
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
        header: <ColHeader tip='Order placed date and time' symbol='Placed' />,
        accessorKey: 'createdAt',
        size: 180,
        cell: ({row}) => (
          <span className='text-sm'>{formatPlacedAt(row.original)}</span>
        ),
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

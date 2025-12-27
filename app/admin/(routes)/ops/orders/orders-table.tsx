'use client'

import {api} from '@/convex/_generated/api'
import {Id, type Doc} from '@/convex/_generated/dataModel'
import {cn} from '@/lib/utils'
import {
  Card,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react'
import {useQuery} from 'convex/react'
import Link from 'next/link'
import {useMemo, useState} from 'react'
import {
  actionsCell,
  dateCell,
  moneyCell,
  statusCell,
} from '../../../_components/ui/cells'
import {useSettingsPanel} from '../../../_components/ui/settings'
import {useOrderDetails} from './order-details-context'

type Order = Doc<'orders'>

const columns = [
  {name: 'STATUS', uid: 'status'},
  {name: 'TOTAL', uid: 'total'},
  {name: 'COURIER', uid: 'courier'},
  {name: 'ORDER#', uid: 'orderNumber'},
  {name: 'CUSTOMER', uid: 'customer'},
  {name: 'DATE', uid: 'date'},
  {name: 'ACTIONS', uid: 'actions'},
]

export const OrdersTable = () => {
  const orders = useQuery(api.orders.q.getRecentOrders, {limit: 100})
  const {selectedOrder, setSelectedOrder} = useOrderDetails()
  const {open, setOpen} = useSettingsPanel()
  const selectedOrderId = selectedOrder?._id

  const [selectedRow, setSelectedRow] = useState<Id<'orders'> | null>(null)
  // Debug: Log when selectedOrder changes
  // useEffect(() => {
  //   console.log('Selected order changed:', selectedOrderId, 'Panel open:', open)
  // }, [selectedOrderId, open])
  //
  const handleViewOrder = (order: Order) => () => {
    if (order) {
      setSelectedOrder(order)
      setSelectedRow(order._id)
      setOpen(true)
    }
  }

  const renderCell = (order: Order, columnKey: React.Key) => {
    switch (columnKey) {
      case 'status':
        return statusCell(order.orderStatus)
      case 'total':
        return moneyCell(order.totalCents ?? 0)

      case 'courier':
        return (
          <div className='capitalize text-blue-500 flex items-center justify-center'>
            {order.courier ?? 'Assign'}
          </div>
        )
      case 'orderNumber':
        return (
          <div className='flex flex-col w-fit'>
            <Link
              color='foreground'
              href={`/admin/orders/${order.orderNumber}`}
              className='font-mono opacity-80 text-sm hover:underline underline-offset-4 decoration-dashed decoration-foreground/40'>
              {order.orderNumber.split('-').pop()}
            </Link>
          </div>
        )
      case 'customer':
        return (
          <div className='flex flex-col'>
            <p className='tracking-tight font-medium text-sm'>
              {order.contactEmail}
            </p>
          </div>
        )
      case 'date':
        return dateCell(order.createdAt ?? 0)
      case 'actions':
        return actionsCell(selectedRow === order._id, handleViewOrder(order))
      default:
        return null
    }
  }

  const classNames = useMemo(
    () => ({
      wrapper: ['max-h-[382px]', 'max-w-3xl'],
      th: [
        'bg-transparent',
        'text-foreground/80 capitalize font-nito tracking-wide',
        'border-b',
        'border-divider',
      ],
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

  if (!orders) {
    return (
      <Card shadow='sm' className='p-4'>
        <p className='text-sm text-gray-400'>Loading orders...</p>
      </Card>
    )
  }

  return (
    <Card
      shadow='none'
      radius='none'
      className='p-4 md:rounded-xl bg-sidebar/20  dark:bg-dark-table/40 md:h-full h-[calc(100lvh-24px)] w-screen md:w-full overflow-scroll'>
      <Table
        key={`table-${selectedOrderId || 'none'}-${open}`}
        isCompact
        removeWrapper
        aria-label='Orders table'
        classNames={classNames}>
        <TableHeader
          columns={columns}
          className='font-medium drop-shadow-xs text-foreground'>
          {(column) => (
            <TableColumn
              key={column.uid}
              align={column.uid === 'actions' ? 'center' : 'start'}
              className={cn('border-b-0', {'w-14': column.uid === 'actions'})}>
              {column.name}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody emptyContent={'No orders found'} items={orders}>
          {(order) => {
            const isSelected = Boolean(
              selectedOrderId &&
              order._id &&
              String(selectedOrderId) === String(order._id) &&
              open,
            )
            return (
              <TableRow
                key={`${order._id}-${isSelected}`}
                data-order-selected={isSelected ? 'true' : 'false'}
                className={cn(
                  'hover:bg-sidebar/65 dark:hover:bg-sidebar/80',
                  'border-dotted border-neutral-300 dark:border-teal-200/10 h-8 transition-colors',
                  selectedRow === order._id && isSelected
                    ? 'bg-sidebar/40 shadow-inner dark:border-teal-200/40 -border-dotted border-y-1'
                    : 'first:border-t border-b',
                )}>
                {(columnKey) => (
                  <TableCell
                    className={cn(
                      'border-r first:border-l border-dotted border-neutral-300 dark:border-teal-200/10 px-1.5',
                      selectedRow === order._id && isSelected
                        ? 'bg-neutral-300/10 first:border-l not-last:border-r-0 last:border-r -border-dotted border-neutral-300 dark:border-teal-200/40'
                        : '',
                      columnKey === 'status' && 'w-52',
                      columnKey === 'total' && 'w-30',
                    )}>
                    {renderCell(order, columnKey)}
                  </TableCell>
                )}
              </TableRow>
            )
          }}
        </TableBody>
      </Table>
    </Card>
  )
}

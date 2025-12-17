'use client'

import {api} from '@/convex/_generated/api'
import {Id, type Doc} from '@/convex/_generated/dataModel'
import {cn} from '@/lib/utils'
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
import Link from 'next/link'
import {useMemo, useState} from 'react'
import {useOrderDetails} from './order-details-context'
import {actionsCell, dateCell, moneyCell} from './ui/cells'
import {useSettingsPanel} from './ui/settings'

type Order = Doc<'orders'>

const statusColorMap: Record<string, ChipProps['color']> = {
  pending: 'warning',
  confirmed: 'primary',
  processing: 'secondary',
  shipped: 'success',
  delivered: 'success',
  cancelled: 'danger',
  refunded: 'default',
}

const columns = [
  {name: 'ORDER NUMBER', uid: 'orderNumber'},
  {name: 'CUSTOMER', uid: 'customer'},
  {name: 'STATUS', uid: 'status'},
  {name: 'TOTAL', uid: 'total'},
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
      case 'orderNumber':
        return (
          <div className='flex flex-col w-fit'>
            <Link
              color='foreground'
              href={`/admin/orders/${order.orderNumber}`}
              className='font-mono opacity-80 text-sm hover:underline underline-offset-4 decoration-dashed decoration-foreground/40'>
              {order.orderNumber}
            </Link>
          </div>
        )
      case 'customer':
        return (
          <div className='flex flex-col'>
            <p className='tracking-tight font-medium text-sm'>
              {order.contactEmail}
            </p>
            {/*{order.userId && (
              <p className='text-xs opacity-40 font-mono'>
                {order.userId.substring(0, 12)}
              </p>
            )}*/}
          </div>
        )
      case 'status':
        return (
          <Chip
            size='sm'
            variant='flat'
            className='capitalize'
            color={statusColorMap[order.orderStatus] || 'default'}>
            {order.orderStatus}
          </Chip>
        )
      case 'total':
        return moneyCell(order.totalCents ?? 0)
      case 'date':
        return dateCell(order.createdAt ?? Date.now())
      case 'actions':
        return actionsCell(selectedRow === order._id, handleViewOrder(order))
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

  if (!orders) {
    return (
      <Card shadow='sm' className='p-4'>
        <p className='text-sm text-gray-400'>Loading orders...</p>
      </Card>
    )
  }

  return (
    <Card shadow='sm' className='p-4'>
      <Table
        key={`table-${selectedOrderId || 'none'}-${open}`}
        isCompact
        removeWrapper
        aria-label='Orders table'
        classNames={classNames}>
        <TableHeader columns={columns} className='font-medium drop-shadow-xs'>
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
                  'hover:bg-sky-400/10',
                  'border-dotted border-neutral-300 dark:border-teal-200/10 h-8 transition-colors',
                  selectedRow === order._id && isSelected
                    ? 'bg-neutral-500/15 dark:border-teal-200/40 -border-dotted border-y-1'
                    : 'first:border-t border-b',
                )}>
                {(columnKey) => (
                  <TableCell
                    className={cn(
                      'border-r first:border-l border-dotted border-neutral-300 dark:border-teal-200/10',
                      selectedRow === order._id && isSelected
                        ? 'bg-neutral-300/10 first:border-l not-last:border-r-0 last:border-r -border-dotted border-neutral-300 dark:border-teal-200/40'
                        : '',
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

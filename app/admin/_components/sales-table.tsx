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
import {dateCell, moneyCell} from './ui/cells'

type Order = Doc<'orders'>

const statusColorMap: Record<string, ChipProps['color']> = {
  delivered: 'success',
  confirmed: 'primary',
  shipped: 'success',
}

const columns = [
  {name: 'ORDER NUMBER', uid: 'orderNumber'},
  {name: 'CUSTOMER', uid: 'customer'},
  {name: 'STATUS', uid: 'status'},
  {name: 'ITEMS', uid: 'items'},
  {name: 'REVENUE', uid: 'revenue'},
  {name: 'DATE', uid: 'date'},
]

export const SalesTable = () => {
  const allOrders = useQuery(api.orders.q.getRecentOrders, {limit: 100})

  const sales = useMemo(() => {
    if (!allOrders) return []
    return allOrders.filter(
      (order) =>
        order.orderStatus === 'delivered' ||
        order.orderStatus === 'confirmed' ||
        order.orderStatus === 'shipped',
    )
  }, [allOrders])

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
          </div>
        )
      case 'status':
        return (
          <Chip
            className='capitalize'
            color={statusColorMap[order.orderStatus] || 'default'}
            size='sm'
            variant='flat'>
            {order.orderStatus}
          </Chip>
        )
      case 'items':
        return (
          <div className='flex flex-col'>
            <p className='text-bold text-sm'>
              {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
            </p>
          </div>
        )
      case 'revenue':
        return moneyCell(order.totalCents)
      case 'date':
        return dateCell(order.createdAt)
      default:
        return null
    }
  }

  const totalRevenue = useMemo(() => {
    return sales.reduce((sum, order) => sum + order.totalCents, 0)
  }, [sales])

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
        <p className='text-sm text-gray-400'>Loading sales...</p>
      </Card>
    )
  }

  return (
    <Card shadow='sm' className='p-4'>
      <div className='flex items-center justify-between mb-4'>
        <div>
          <h2 className='text-xl font-semibold font-space'>
            <span className='font-thin'>$</span>
            {formatPrice(totalRevenue)}
          </h2>
        </div>
        <p className='text-sm text-gray-400'>{sales.length} transactions</p>
      </div>
      <Table
        isCompact
        removeWrapper
        aria-label='Sales table'
        classNames={classNames}>
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn key={column.uid} align='start'>
              {column.name}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody emptyContent={'No sales found'} items={sales}>
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

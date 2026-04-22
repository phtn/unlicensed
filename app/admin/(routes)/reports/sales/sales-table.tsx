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
import {dateCell, moneyCell} from '../../../_components/ui/cells'

type Order = Doc<'orders'>

const statusColorMap: Record<string, ChipProps['color']> = {
  shipped: 'success',
  delivered: 'success',
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
        order.orderStatus === 'shipped' || order.orderStatus === 'delivered',
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
            variant='tertiary'
          >
            {order.orderStatus
              .split('_')
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ')}
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
        return moneyCell(order.totalCents ?? 0)
      case 'date':
        return dateCell(order.createdAt ?? 0)
      default:
        return null
    }
  }

  const totalRevenue = useMemo(() => {
    return sales.reduce((sum, order) => sum + order.totalCents, 0)
  }, [sales])

  if (!allOrders) {
    return (
      <Card className='p-4'>
        <p className='text-sm text-gray-400'>Loading sales...</p>
      </Card>
    )
  }

  return (
    <Card className='w-full max-w-full overflow-hidden p-3 dark:bg-dark-table/40 md:w-full md:rounded-lg md:p-4'>
      <div className='mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h2 className='text-xl font-semibold font-space'>
            {formatPrice(totalRevenue)}
          </h2>
        </div>
        <p className='text-sm text-gray-400'>{sales.length} transactions</p>
      </div>
      <div className='w-full overflow-x-auto'>
        <Table aria-label='Sales table' className='min-w-[46rem]'>
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn key={column.uid}>{column.name}</TableColumn>
            )}
          </TableHeader>
          <TableBody items={sales}>
            {(order) => (
              <TableRow key={order._id as string} className='h-16'>
                {(columnKey) => (
                  <TableCell>
                    {renderCell(order, columnKey as unknown as React.Key)}
                  </TableCell>
                )}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}

'use client'

import {Doc} from '@/convex/_generated/dataModel'
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
import Link from 'next/link'
import {useMemo} from 'react'

interface CourierListProps {
  couriers: Array<Doc<'couriers'>> | undefined
}

const statusColorMap: Record<string, ChipProps['color']> = {
  active: 'success',
  inactive: 'default',
}

const columns = [
  {name: 'NAME', uid: 'name'},
  {name: 'CODE', uid: 'code'},
  {name: 'STATUS', uid: 'status'},
  {name: 'TRACKING URL', uid: 'trackingUrl'},
  {name: 'CREATED', uid: 'created'},
]

export const CourierList = ({couriers}: CourierListProps) => {
  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'N/A'
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const renderCell = (courier: Doc<'couriers'>, columnKey: React.Key) => {
    switch (columnKey) {
      case 'name':
        return (
          <div className='flex flex-col'>
            <Link
              href={`/admin/suppliers/logistics?tabId=edit&id=${courier._id}`}
              className='text-bold text-sm hover:underline'>
              {courier.name}
            </Link>
          </div>
        )
      case 'code':
        return (
          <div className='flex flex-col'>
            <p className='text-bold text-sm font-mono text-gray-400'>
              {courier.code}
            </p>
          </div>
        )
      case 'status':
        return (
          <Chip
            className='capitalize'
            color={
              courier.active ? statusColorMap.active : statusColorMap.inactive
            }
            size='sm'
            variant='flat'>
            {courier.active ? 'Active' : 'Inactive'}
          </Chip>
        )
      case 'trackingUrl':
        return (
          <div className='flex flex-col'>
            {courier.trackingUrlTemplate ? (
              <p className='text-bold text-sm text-gray-400 truncate max-w-lg'>
                {courier.trackingUrlTemplate}
              </p>
            ) : (
              <p className='text-sm text-gray-400'>No template</p>
            )}
          </div>
        )
      case 'created':
        return (
          <div className='flex flex-col'>
            <p className='text-bold text-sm'>{formatDate(courier.createdAt)}</p>
          </div>
        )
      default:
        return null
    }
  }

  const classNames = useMemo(
    () => ({
      wrapper: ['max-h-[382px]', 'max-w-full'],
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

  if (couriers === undefined) {
    return (
      <Card shadow='sm' className='p-4'>
        <p className='text-sm text-gray-400'>Loading couriers...</p>
      </Card>
    )
  }

  return (
    <section className=''>
      {/*<h3 className='text-2xl tracking-tighter font-semibold py-2'>Couriers</h3>*/}
      {couriers.length === 0 ? (
        <p className='text-sm text-neutral-500'>
          No couriers yet. Create one above to get started.
        </p>
      ) : (
        <Card
          shadow='none'
          radius='none'
          className='md:p-4 md:w-full w-screen overflow-auto dark:bg-dark-table/40'>
          <Table
            isCompact
            removeWrapper
            aria-label='Couriers table'
            classNames={classNames}>
            <TableHeader columns={columns}>
              {(column) => (
                <TableColumn key={column.uid} align='start'>
                  {column.name}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody emptyContent={'No couriers found'} items={couriers}>
              {(courier) => (
                <TableRow key={courier._id} className='h-16'>
                  {(columnKey) => (
                    <TableCell>{renderCell(courier, columnKey)}</TableCell>
                  )}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </section>
  )
}

'use client'

import {DataTable} from '@/components/table-v2'
import {ColumnConfig} from '@/components/table-v2/create-column'
import {ColHeader} from '@/components/table-v2/headers'
import {Doc} from '@/convex/_generated/dataModel'
import {Chip, ChipProps} from '@heroui/react'
import Link from 'next/link'
import {useMemo} from 'react'

interface CourierListProps {
  couriers: Array<Doc<'couriers'>> | undefined
}

const statusColorMap: Record<string, ChipProps['color']> = {
  active: 'success',
  inactive: 'default',
}

export const CourierList = ({couriers}: CourierListProps) => {
  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'N/A'
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const columns = useMemo(
    () =>
      [
        {
          id: 'name',
          header: <ColHeader tip='Courier name' symbol='NAME' />,
          accessorKey: 'name',
          size: 220,
          cell: ({row}) => {
            const courier = row.original
            return (
              <Link
                href={`/admin/suppliers/logistics?tabId=edit&id=${courier._id}&code=${courier.code}`}
                className='text-bold text-sm hover:underline flex items-center space-x-2'>
                <span>{courier.name}</span>
              </Link>
            )
          },
        },
        {
          id: 'status',
          header: <ColHeader tip='Courier status' symbol='STATUS' />,
          accessorKey: 'active',
          size: 110,
          cell: ({row}) => (
            <Chip
              className='capitalize'
              color={
                row.original.active
                  ? statusColorMap.active
                  : statusColorMap.inactive
              }
              size='sm'
              variant='flat'>
              {row.original.active ? 'Active' : 'Inactive'}
            </Chip>
          ),
        },
        {
          id: 'shipFrom',
          header: <ColHeader tip='Ship From' symbol='Ship From' />,
          accessorKey: 'shipFrom',
          size: 360,
          cell: ({row}) =>
            row.original.shipFrom ? (
              <p className='text-bold text-sm opacity-80 truncate max-w-lg'>
                {row.original.shipFrom}
              </p>
            ) : (
              <p className='text-sm opacity-80'>N/A</p>
            ),
        },
        {
          id: 'code',
          header: <ColHeader tip='Courier code' symbol='CODE' />,
          accessorKey: 'code',
          size: 120,
          cell: ({row}) => (
            <p className='text-sm font-mono opacity-80'>{row.original.code}</p>
          ),
        },
        {
          id: 'createdAt',
          header: <ColHeader tip='Created date' symbol='created at' />,
          accessorKey: 'createdAt',
          size: 140,
          cell: ({row}) => (
            <p className='text-bold text-sm'>
              {formatDate(row.original.createdAt)}
            </p>
          ),
        },
      ] as ColumnConfig<Doc<'couriers'>>[],
    [],
  )

  return (
    <div className='relative w-full max-w-full overflow-hidden'>
      {couriers && couriers.length === 0 ? (
        <p className='text-sm text-neutral-500'>
          No couriers yet. Create one above to get started.
        </p>
      ) : (
        <DataTable
          title='Couriers'
          data={couriers ?? []}
          loading={couriers === undefined}
          editingRowId={null}
          columnConfigs={columns}
        />
      )}
    </div>
  )
}

'use client'

import {DataTable} from '@/components/table-v2'
import {ColumnConfig} from '@/components/table-v2/create-column'
import {api} from '@/convex/_generated/api'
import {Doc} from '@/convex/_generated/dataModel'
import {useQuery} from 'convex/react'
import {useMemo} from 'react'

export const VisitorLogData = () => {
  const data = useQuery(api.products.q.listProducts, {limit: 100})

  const columns = useMemo(
    () =>
      [
        {
          id: '_id',
          header: 'id',
          accessorKey: '_id',
          size: 200,
          cell: ({row}) => (
            <div className='flex items-center gap-2'>
              <div className='w-4 h-4 rounded-full bg-gray-300' />
              <div className='text-sm font-medium'>
                {row.original._id.substring(0, 8)}
              </div>
            </div>
          ),
        },

        {
          id: 'name',
          header: 'Name',
          accessorKey: 'name',
          size: 200,
        },
        {
          id: 'priceCents',
          header: 'Price',
          accessorKey: 'priceCents',
          size: 100,
        },
        {
          id: 'categorySlug',
          header: 'Category',
          accessorKey: 'categorySlug',
        },
        {
          id: 'createdAt',
          header: 'Created At',
          accessorKey: 'createdAt',
          size: 200,
        },
        {
          id: 'updatedAt',
          header: 'Updated At',
          accessorKey: 'updatedAt',
          size: 200,
        },
        {
          id: 'featured',
          header: 'featured',
          accessorKey: 'featured',
        },
      ] as ColumnConfig<Doc<'products'>>[],
    [],
  )

  return (
    <div className='relative w-full max-w-full overflow-hidden'>
      {data && (
        <DataTable
          title={'Visitor Logs'}
          data={data}
          loading={!data}
          columnConfigs={columns}
          editingRowId={null}
        />
      )}
    </div>
  )
}

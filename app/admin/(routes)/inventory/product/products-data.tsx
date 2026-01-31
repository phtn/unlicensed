'use client'

import {DataTable} from '@/components/table-v2'
import {
  countCell,
  linkText,
  priceCell,
  textCell,
} from '@/components/table-v2/cells-v2'
import {ColumnConfig} from '@/components/table-v2/create-column'
import {Doc} from '@/convex/_generated/dataModel'
import {useMemo} from 'react'

interface ProductsDataProps {
  data: Doc<'products'>[] | undefined
}
export const ProductsData = ({data}: ProductsDataProps) => {
  const columns = useMemo(
    () =>
      [
        {
          id: '_id',
          header: 'id',
          accessorKey: '_id',
          size: 100,
          cell: linkText('_id', `/admin/inventory/product/`, (v) =>
            v.substring(24),
          ),
        },

        {
          id: 'name',
          header: 'Name',
          accessorKey: 'name',
          cell: textCell('name'),
          size: 200,
        },
        {
          id: 'priceCents',
          header: () => <div className='text-right w-full mr-10'>Price</div>,
          accessorKey: 'priceCents',
          cell: priceCell('priceCents'),
          size: 120,
        },
        {
          id: 'stock',
          header: () => <div className='text-center w-full'>Stock</div>,
          accessorKey: 'stock',
          cell: countCell('stock', 'text-center'),
          size: 80,
        },
        {
          id: 'categorySlug',
          header: () => <div className='text-center w-full'>Category</div>,
          accessorKey: 'categorySlug',
          cell: textCell('categorySlug', 'text-center uppercase'),
          size: 150,
        },
        {
          id: 'featured',
          header: 'featured',
          accessorKey: 'featured',
        },
        {
          id: 'createdAt',
          header: 'Created At',
          accessorKey: 'createdAt',
          size: 200,
        },
      ] as ColumnConfig<Doc<'products'>>[],
    [],
  )

  return (
    <div className='relative w-full max-w-full overflow-hidden'>
      {data && (
        <DataTable
          title={'Products'}
          data={data}
          loading={!data}
          columnConfigs={columns}
          editingRowId={null}
        />
      )}
    </div>
  )
}

'use client'

import {DataTable} from '@/components/table-v2'
import {groupFilter} from '@/components/table-v2/create-column'
import {dateCell, formatText, textCell} from '@/components/table/cells'
import {ColumnConfig} from '@/components/table/create-columns'
import {api} from '@/convex/_generated/api'
import {Doc} from '@/convex/_generated/dataModel'
import {useQuery} from 'convex/react'
import {useCallback, useMemo} from 'react'

/**
 * Prefetch avatar images for faster rendering during pagination
 */

export const SalesDataTable = () => {
  const data = useQuery(api.products.q.listProducts, {limit: 50})

  const handleDeleteSelected = useCallback(async (cardIds: string[]) => {
    if (cardIds.length === 0) {
      console.log('No cards selected')
    }
  }, [])

  const columns = useMemo(
    () =>
      [
        {
          id: 'categoryId',
          header: 'SKU',
          accessorKey: 'categoryId',
          cell: formatText(
            'categoryId',
            (v) => v,
            'font-mono text-xs w-[30ch] truncate',
          ),
          size: 10,
          enableHiding: true,
          enableSorting: true,
          filterFn: groupFilter,
        },
        {
          id: 'slug',
          header: 'Slug',
          accessorKey: 'Slug',
          cell: formatText(
            'slug',
            (v) => v,
            'font-space font-sm truncate text-clip w-[13ch]',
          ),
          size: 150,
          enableHiding: true,
          enableSorting: true,
          filterFn: groupFilter,
        },

        {
          id: 'categorySlug',
          header: 'Category',
          accessorKey: 'categorySlug',
          cell: textCell(
            'categorySlug',
            'font-figtree uppercase text-sm truncate text-clip w-[10ch]',
          ),
          size: 40,
          enableHiding: true,
          enableSorting: true,
          filterFn: groupFilter,
        },
        {
          id: '_creationTime',
          header: 'Genesis',
          accessorKey: '_creationTime',
          cell: dateCell(
            '_creationTime',
            'font-space text-muted-foreground max-w-[20ch] truncate text-clip',
          ),
          size: 100,
          enableHiding: true,
          enableSorting: true,
        },
      ] as ColumnConfig<Doc<'products'>>[],
    [],
  )

  return (
    <div className='relative w-full max-w-full overflow-hidden'>
      {data && (
        <DataTable
          data={data}
          title={'Products'}
          columnConfigs={columns}
          loading={false}
          editingRowId={null}
          onDeleteSelected={handleDeleteSelected}
          deleteIdAccessor={'_id'}
        />
      )}
    </div>
  )
}

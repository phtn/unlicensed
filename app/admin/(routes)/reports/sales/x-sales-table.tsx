'use client'

import {DataTable} from '@/components/table'
import {dateCell, formatText, textCell} from '@/components/table/cells'
import {ColumnConfig} from '@/components/table/create-columns'
import {api} from '@/convex/_generated/api'
import {Doc} from '@/convex/_generated/dataModel'
import {FilterFn} from '@tanstack/react-table'
import {useQuery} from 'convex/react'
import {useCallback, useMemo} from 'react'

/**
 * Prefetch avatar images for faster rendering during pagination
 */
// const prefetchAvatars = (users: Doc<'legacyUsers'>[] | undefined) => {
//   if (!users || typeof window === 'undefined') return

//   const photoUrls = users
//     .map((user) => user.photoUrl)
//     .filter((url): url is string => !!url)

//   photoUrls.forEach((url) => {
//     const img = new Image()
//     img.src = url
//   })
// }

export const SalesDataTable = () => {
  const sales_data = useQuery(api.orders.q.getRecentOrders, {limit: 50})

  const groupFilter: FilterFn<Doc<'orders'>> = (row, id, filterValue) => {
    const value = row.getValue(id)

    // Handle array filter values (from multi-select filter component)
    if (Array.isArray(filterValue)) {
      if (filterValue.length === 0) return true
      // Compare both normalized strings and original values
      const valueStr = String(value)
      return filterValue.some((fv) => String(fv) === valueStr || fv === value)
    }

    // Handle single value exact match
    if (filterValue == null || filterValue === '') return true
    return value === filterValue || String(value) === String(filterValue)
  }

  const handleDeleteSelected = useCallback(async (cardIds: string[]) => {
    if (cardIds.length === 0) {
      console.log('No cards selected')
    }
  }, [])

  const columns = useMemo(
    () =>
      [
        // {
        //   id: 'userId',
        //   header: 'User',
        //   accessorKey: 'userId',
        //   cell: UserCell,
        //   size: 250,
        //   enableHiding: true,
        //   enableSorting: true,
        // },

        {
          id: 'orderNumber',
          header: 'Ref#',
          accessorKey: 'orderNumber',
          cell: formatText(
            'orderNumber',
            (v) => v,
            'font-mono text-xs w-[30ch] truncate',
          ),
          size: 150,
          enableHiding: true,
          enableSorting: true,
          filterFn: groupFilter,
        },
        {
          id: 'contactPhone',
          header: 'Phone',
          accessorKey: 'contactPhone',
          cell: formatText(
            'contactPhone',
            (v) => v,
            'font-space font-sm truncate text-clip w-[13ch]',
          ),
          size: 150,
          enableHiding: true,
          enableSorting: true,
          filterFn: groupFilter,
        },

        {
          id: 'orderStatus',
          header: 'Status',
          accessorKey: 'orderStatus',
          cell: textCell(
            'orderStatus',
            'font-figtree uppercase text-sm truncate text-clip w-[10ch]',
          ),
          size: 100,
          enableHiding: true,
          enableSorting: true,
          filterFn: groupFilter,
        },
        {
          id: 'createdAt',
          header: 'Creation',
          accessorKey: 'createdAt',
          cell: dateCell(
            'createdAt',
            'font-space text-muted-foreground max-w-[20ch] truncate text-clip',
          ),
          size: 180,
          enableHiding: true,
          enableSorting: true,
        },
        // {
        //   id: 'actions',
        //   accessorKey: '_id',
        //   header: (
        //     <div className='w-fit flex justify-center px-1.5'>
        //       <Icon name='search-magic' className='size-4 md:size-5 opacity-80' />
        //     </div>
        //   ),
        //   cell: ({row}) => (
        //     <RowActions row={row} viewFn={() => handleView(row.original)} />
        //   ),
        //   size: 0,
        //   enableHiding: false,
        //   enableSorting: false,
        // },
      ] as ColumnConfig<Doc<'orders'>>[],
    [],
  )

  // const Data = useCallback(
  //   () => (

  //   ),
  //   [sales_data, handleDeleteSelected, columns, viewer],
  // )

  return (
    <div className='relative'>
      <DataTable
        data={sales_data ?? []}
        title={'Sales'}
        columnConfigs={columns}
        loading={false}
        editingRowId={null}
        onDeleteSelected={handleDeleteSelected}
        deleteIdAccessor={undefined}
      />
    </div>
  )
}

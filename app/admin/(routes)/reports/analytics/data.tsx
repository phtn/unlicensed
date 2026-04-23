'use client'

import {DataTable} from '@/components/table-v2'
import {textCell} from '@/components/table-v2/cells-v2'
import {ColumnConfig} from '@/components/table-v2/create-column'
import {api} from '@/convex/_generated/api'
import {Doc} from '@/convex/_generated/dataModel'
import {useQuery} from 'convex/react'
import {useMemo} from 'react'

type GuestVisitorEventRow = Doc<'guestVisitorEvents'>

export const VisitorLogData = () => {
  const eventsQuery = useQuery(api.guestTracking.q.getRecentEvents, {
    limit: 100,
    type: 'page_view',
  })
  const data = eventsQuery ?? []

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
              <div className='text-xs uppercase font-brk'>
                {row.original._id.substring(0, 8)}
              </div>
            </div>
          ),
        },
        {
          id: 'visitorId',
          header: 'Visitor',
          accessorKey: 'visitorId',
          size: 180,
          cell: ({row}) => (
            <code className='text-xs uppercase'>
              {row.original.visitorId.slice(0, 14)}
            </code>
          ),
        },
        {
          id: 'type',
          header: 'Type',
          accessorKey: 'type',
          size: 120,
          cell: ({row}) => (
            <span className='text-xs uppercase tracking-wide'>
              {row.original.type.replace('_', ' ')}
            </span>
          ),
        },
        {
          id: 'path',
          header: 'Path',
          accessorKey: 'path',
          size: 260,
          cell: ({row}) => (
            <span className='text-sm truncate'>{row.original.path}</span>
          ),
        },
        {
          id: 'deviceType',
          header: 'Device',
          accessorKey: 'deviceType',
          cell: textCell('deviceType', 'uppercase text-xs'),
          size: 100,
        },
        {
          id: 'browser',
          header: 'Browser',
          accessorKey: 'browser',
          cell: textCell('browser', 'uppercase text-xs'),
          size: 100,
        },
        {
          id: 'country',
          header: 'Country',
          accessorKey: 'country',
          size: 120,
        },
        {
          id: 'createdAt',
          header: 'Time',
          accessorKey: 'createdAt',
          size: 180,
          cell: ({row}) => (
            <span className='text-xs text-muted-foreground'>
              {new Date(row.original.createdAt).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </span>
          ),
        },
      ] as ColumnConfig<GuestVisitorEventRow>[],
    [],
  )

  return (
    <div className='relative w-full max-w-full overflow-hidden'>
      <DataTable
        title={'Visitor Logs'}
        data={data}
        loading={!eventsQuery}
        columnConfigs={columns}
        editingRowId={null}
      />
    </div>
  )
}

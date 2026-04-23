'use client'

import {DataTable} from '@/components/table-v2'
import {ColumnConfig} from '@/components/table-v2/create-column'
import {api} from '@/convex/_generated/api'
import type {Doc} from '@/convex/_generated/dataModel'
import {useQuery} from 'convex/react'
import {useMemo} from 'react'

type GuestVisitorRow = Doc<'guestVisitors'>

const EMPTY_VALUE = 'N/A'

const visitorTimestampFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

const formatVisitorTimestamp = (timestamp?: number | null) =>
  timestamp ? visitorTimestampFormatter.format(timestamp) : EMPTY_VALUE

const formatLocation = (visitor: GuestVisitorRow) => {
  const parts = [visitor.city, visitor.region, visitor.country].flatMap(
    (part) => {
      const normalized = part?.trim()
      return normalized ? [normalized] : []
    },
  )

  return parts.length > 0 ? parts.join(', ') : EMPTY_VALUE
}

const formatPath = (visitor: GuestVisitorRow) =>
  visitor.lastPath ?? visitor.firstPath ?? EMPTY_VALUE

export const VisitorData = () => {
  const visitorsQuery = useQuery(api.guestTracking.q.getRecentVisitors, {
    limit: 500,
  })
  const data = visitorsQuery ?? []

  const columns = useMemo(
    () =>
      [
        {
          id: 'visitorId',
          header: 'Visitor',
          accessorKey: 'visitorId',
          size: 190,
          cell: ({row}) => (
            <code className='text-xs uppercase'>
              {row.original.visitorId.slice(0, 18)}
            </code>
          ),
        },
        {
          id: 'lastPath',
          header: 'Last Path',
          accessorKey: 'lastPath',
          size: 260,
          cell: ({row}) => (
            <span className='block truncate text-sm'>
              {formatPath(row.original)}
            </span>
          ),
        },
        {
          id: 'pageViewCount',
          header: 'Views',
          accessorKey: 'pageViewCount',
          size: 90,
          cell: ({row}) => (
            <span className='font-brk text-xs'>
              {row.original.pageViewCount.toLocaleString('en-US')}
            </span>
          ),
        },
        {
          id: 'eventCount',
          header: 'Events',
          accessorKey: 'eventCount',
          size: 90,
          cell: ({row}) => (
            <span className='font-brk text-xs'>
              {row.original.eventCount.toLocaleString('en-US')}
            </span>
          ),
        },
        {
          id: 'city',
          header: 'Location',
          accessorKey: 'city',
          size: 180,
          cell: ({row}) => (
            <span className='block truncate text-xs uppercase'>
              {formatLocation(row.original)}
            </span>
          ),
        },
        {
          id: 'deviceType',
          header: 'Device',
          accessorKey: 'deviceType',
          size: 100,
          cell: ({row}) => (
            <span className='text-xs uppercase'>
              {row.original.deviceType ?? EMPTY_VALUE}
            </span>
          ),
        },
        {
          id: 'browser',
          header: 'Browser',
          accessorKey: 'browser',
          size: 120,
          cell: ({row}) => (
            <span className='text-xs uppercase'>
              {row.original.browser ?? EMPTY_VALUE}
            </span>
          ),
        },
        {
          id: 'linkedUserFid',
          header: 'Linked User',
          accessorKey: 'linkedUserFid',
          size: 170,
          cell: ({row}) => (
            <span className='block truncate font-mono text-[11px] text-muted-foreground'>
              {row.original.linkedUserFid ?? EMPTY_VALUE}
            </span>
          ),
        },
        {
          id: 'firstSeenAt',
          header: 'First Seen',
          accessorKey: 'firstSeenAt',
          size: 170,
          cell: ({row}) => (
            <span className='text-xs text-muted-foreground'>
              {formatVisitorTimestamp(row.original.firstSeenAt)}
            </span>
          ),
        },
        {
          id: 'lastSeenAt',
          header: 'Last Seen',
          accessorKey: 'lastSeenAt',
          size: 170,
          cell: ({row}) => (
            <span className='text-xs text-muted-foreground'>
              {formatVisitorTimestamp(row.original.lastSeenAt)}
            </span>
          ),
        },
      ] as ColumnConfig<GuestVisitorRow>[],
    [],
  )

  return (
    <div className='relative w-full max-w-full overflow-hidden'>
      <DataTable
        title='Visitors'
        data={data}
        loading={visitorsQuery === undefined}
        columnConfigs={columns}
        editingRowId={null}
        defaultPageSize={50}
        defaultLoadedCount={500}
        loadedCountParamKey='visitorsLoadedCount'
      />
    </div>
  )
}

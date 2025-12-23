'use client'

import {api} from '@/convex/_generated/api'
import type {Doc} from '@/convex/_generated/dataModel'
import {Icon, IconName} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {formatTimestamp} from '@/utils/date'
import {transliterate} from '@/utils/fingerprint'
import {
  Card,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  User,
} from '@heroui/react'
import {useQuery} from 'convex/react'
import React, {ReactNode} from 'react'

type Log = Doc<'logs'> & {
  user?: {name: string; email: string; photoUrl?: string} | null
}

const columns = [
  {name: 'USER', uid: 'user'},
  {name: 'DEVICE', uid: 'device'},
  {name: 'OS', uid: 'os'},
  {name: 'BROWSER', uid: 'browser'},
  {name: 'IP ADDRESS', uid: 'ipAddress'},
  {name: 'CITY', uid: 'city'},
  {name: 'COUNTRY', uid: 'country'},
  {name: 'PATH', uid: 'path'},
  {name: 'REFERRER', uid: 'referrer'},
  {name: 'TIME', uid: 'time'},
]

const getDeviceIcon = (deviceType?: string): IconName => {
  // Use eye icon for all device types since specific device icons don't exist
  switch (deviceType) {
    case 'mobile':
      return 'phone'
    case 'tablet':
      return 'tablet'
    case 'desktop':
      return 'mac'
    default:
      return 'pc'
  }
}

// const getDeviceChipColor = (
//   deviceType?: string,
// ): ChipProps['color'] | undefined => {
//   switch (deviceType) {
//     case 'mobile':
//       return 'primary'
//     case 'tablet':
//       return 'secondary'
//     case 'desktop':
//       return 'success'
//     default:
//       return 'default'
//   }
// }

// const getLogTypeChipColor = (type: Log['type']): ChipProps['color'] => {
//   switch (type) {
//     case 'page_visit':
//       return 'primary'
//     case 'api_request':
//       return 'secondary'
//     case 'error':
//       return 'danger'
//     case 'action':
//       return 'warning'
//     default:
//       return 'default'
//   }
// }

interface LogsTableProps {
  fullTable: boolean
  toggleFullTable: VoidFunction
  isMobile: boolean
}

export const LogsTable = ({fullTable, isMobile}: LogsTableProps) => {
  const logs = useQuery(api.logs.q.getLogs, {
    limit: 100,
    type: 'page_visit',
  })

  const renderCell = (log: Log, columnKey: React.Key) => {
    switch (columnKey) {
      case 'user':
        if (log.userId && 'user' in log && log.user) {
          const user = log.user as {
            name: string
            email: string
            photoUrl?: string
          }
          return (
            <User
              avatarProps={{
                radius: 'full',
                size: 'sm',
                src: user.photoUrl,
              }}
              classNames={{
                description: 'text-default-500',
              }}
              name={isMobile ? user.name.split(' ').shift() : user.name}>
              {user.email}
            </User>
          )
        }
        return (
          <div className='flex items-center gap-2'>
            <div className='flex flex-col'>
              <p className='text-sm opacity-80'>Guest</p>
            </div>
          </div>
        )
      case 'device':
        return (
          <div className='flex items-center space-x-2'>
            <Icon
              name={getDeviceIcon(log.deviceType)}
              className={cn(
                'size-6 shrink-0',
                log.deviceType === 'mobile'
                  ? 'text-primary'
                  : log.deviceType === 'tablet'
                    ? 'text-secondary'
                    : log.deviceType === 'desktop'
                      ? 'text-success'
                      : 'text-default-400',
              )}
            />
            <div className=''>
              <p className='text-sm capitalize'>
                {log.deviceType || 'unknown'}
              </p>
              {log.screenWidth && log.screenHeight && (
                <p className='text-xs opacity-50 font-space'>
                  {log.screenWidth}
                  <span className='text-xs px-px'>x</span>
                  {log.screenHeight}
                </p>
              )}
            </div>
          </div>
        )
      case 'os':
        return (
          <div className='flex flex-col'>
            {log.os && (
              <>
                <p className='text-sm capitalize'>{log.os}</p>
                {log.osVersion && (
                  <p className='text-xs opacity-50 font-space'>
                    {log.osVersion}
                  </p>
                )}
              </>
            )}
          </div>
        )
      case 'browser':
        return (
          <div className='flex flex-col'>
            {log.browser ? (
              <>
                <p className='text-sm capitalize'>{log.browser}</p>
                {log.browserVersion && (
                  <p className='text-xs opacity-50 font-space'>
                    v{log.browserVersion}
                  </p>
                )}
              </>
            ) : (
              <p className='text-bold text-tiny text-default-500'>—</p>
            )}
          </div>
        )
      case 'ipAddress':
        return (
          <div className='flex flex-col'>
            <p className='text-sm font-space opacity-80'>{log.ipAddress}</p>
          </div>
        )
      case 'city':
        return (
          <div className='flex flex-col'>
            {log.city && log.city !== 'null, null' && (
              <p className='text-xs'>{log.city}</p>
            )}
          </div>
        )
      case 'country':
        return (
          <div className='flex flex-col'>
            {log.country && log.country !== 'null null' && (
              <p className='text-xs'>{transliterate(log.country)}</p>
            )}
          </div>
        )
      case 'path':
        return (
          <div className='flex items-center gap-2'>
            <div className='flex flex-col min-w-0'>
              {log.method && (
                <p className='font-bold text-tiny'>{log.method}</p>
              )}
              <p className='text-bold text-tiny text-default-400 truncate'>
                {log.path}
              </p>
            </div>
          </div>
        )
      case 'referrer':
        if (log.referrer) {
          try {
            const referrerUrl = new URL(log.referrer)
            const domain = referrerUrl.hostname
            return (
              <div className='flex flex-col min-w-0'>
                <p className='text-bold text-small text-default-600 truncate'>
                  {domain}
                </p>
                <p className='text-bold text-tiny text-default-400 truncate'>
                  {referrerUrl.pathname}
                </p>
              </div>
            )
          } catch {
            return (
              <p className='text-bold text-small text-default-600 truncate'>
                {log.referrer}
              </p>
            )
          }
        }
        return <p className='text-bold text-tiny text-default-400'>Direct</p>
      case 'time':
        return (
          <div className='flex flex-col font-space'>
            <p className='text-sm opacity-80 whitespace-nowrap'>
              {formatTimestamp(log.createdAt)}
            </p>
            {log.responseTime && (
              <p className='text-xs opacity-50'>{log.responseTime}ms</p>
            )}
          </div>
        )
      default:
        return null
    }
  }
  const classNames = React.useMemo(
    () => ({
      td: [
        'first:group-data-[first=true]/tr:before:rounded-none',
        'last:group-data-[first=true]/tr:before:rounded-none',
        'group-data-[middle=true]/tr:before:rounded-none',
        'first:group-data-[last=true]/tr:before:rounded-none',
        'last:group-data-[last=true]/tr:before:rounded-none',
      ],
      tbody: '',
    }),
    [],
  )

  if (logs === undefined) {
    return (
      <Card shadow='sm' className='p-4 dark:bg-dark-table/60'>
        <div className='flex items-center justify-center py-8'>
          <p className='text-sm text-gray-400'>Loading logs...</p>
        </div>
      </Card>
    )
  }

  if (logs.logs.length === 0) {
    return (
      <Card shadow='sm' className='p-4 dark:bg-dark-table/60'>
        <h2 className='text-lg font-semibold font-space mb-4 px-4'>
          Visit Logs
        </h2>
        <div className='flex items-center justify-center py-8'>
          <p className='text-sm text-gray-400'>No logs yet</p>
        </div>
      </Card>
    )
  }

  return (
    <Card
      shadow='none'
      radius='none'
      className={cn(
        'dark:bg-dark-table/40 bg-light-table/0 overflow-hidden md:rounded-t-2xl md:w-full w-screen overflow-x-scroll',
        'transition-transform duration-300',
        {'md:-translate-y-46 -translate-y-42 h-full': fullTable},
      )}>
      <div
        className={cn(
          'h-lvh md:h-[calc(100lvh-64px)] overflow-scroll transition-transform duration-300',
        )}>
        <div className='flex items-end justify-between text-sm font-medium px-3 py-2'>
          <span>Visit Logs</span>
        </div>
        <Table
          removeWrapper
          radius='none'
          classNames={{
            ...classNames,
            tbody: 'overflow-hidden rounded-3xl',
            thead: '',
            th: 'sticky first:rounded-tl-[12.5px] last:rounded-tr-[12.5px] top-0 bg-white/60 dark:bg-dark-table/5 z-10 backdrop-blur-xl h-8 border-b border-gray-200 dark:border-dark-table',
          }}
          aria-label='Visit logs table'>
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn
                key={column.uid}
                align='start'
                className='tracking-wider text-xs font-medium'>
                <div className='drop-shadow-xs'>{column.name}</div>
              </TableColumn>
            )}
          </TableHeader>
          <TableBody emptyContent={'No logs found'} items={logs.logs}>
            {(log) => (
              <TableRow
                key={log._id}
                className='h-8 hover:bg-light-table/60 dark:hover:bg-origin/40 border-b-[0.33px] border-b-light-table last:border-b-0 dark:border-b-dark-table'>
                {(columnKey) => (
                  <TableCell>
                    {renderCell(log, columnKey) as ReactNode}
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

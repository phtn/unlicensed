'use client'

import {User} from '@/components/hero-v3/user'
import {api} from '@/convex/_generated/api'
import type {Doc} from '@/convex/_generated/dataModel'
import {cn} from '@/lib/utils'
import {formatTimestamp} from '@/utils/date'
import {toEmoji} from '@/utils/fingerprint'
import {
  Card,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react'
import {useQuery} from 'convex/react'
import React, {ReactNode} from 'react'

type Log = Doc<'logs'> & {
  user?: {name: string; email: string; photoUrl?: string} | null
}

const columns = [
  {name: 'STATUS', uid: 'status'},
  {name: 'REQUEST', uid: 'request'},
  {name: 'ERROR', uid: 'error'},
  {name: 'USER', uid: 'user'},
  {name: 'CLIENT', uid: 'client'},
  {name: 'COUNTRY', uid: 'country'},
  {name: 'TIME', uid: 'time'},
]

const getErrorMessage = (log: Log): string | null => {
  const meta = log.metadata
  if (!meta) return null
  const message =
    meta.error ??
    meta.message ??
    meta.errorMessage ??
    meta.statusMessage ??
    null
  if (message != null) return String(message).slice(0, 120)
  const entries = Object.entries(meta).slice(0, 2)
  return entries.length > 0
    ? entries.map(([k, v]) => `${k}: ${String(v)}`).join(' · ')
    : null
}

interface LogsTableProps {
  fullTable: boolean
  toggleFullTable: VoidFunction
  isMobile: boolean
}

export const LogsTable = ({fullTable, isMobile}: LogsTableProps) => {
  const logs = useQuery(api.logs.q.getLogs, {
    limit: 100,
    type: 'error',
  })

  const renderCell = (log: Log, columnKey: React.Key) => {
    switch (columnKey) {
      case 'status': {
        const code = log.statusCode
        const is5xx = code !== undefined && code >= 500
        const is4xx = code !== undefined && code >= 400 && code < 500
        return (
          <div className='flex flex-col items-start'>
            <span
              className={cn(
                'font-mono text-sm font-semibold',
                is5xx
                  ? 'text-red-500'
                  : is4xx
                    ? 'text-orange-400'
                    : 'text-default-400',
              )}>
              {code ?? '—'}
            </span>
            {log.method && (
              <span className='font-mono text-[10px] uppercase text-default-400'>
                {log.method}
              </span>
            )}
          </div>
        )
      }
      case 'request':
        return (
          <div className='flex flex-col min-w-0'>
            <p
              className='truncate font-mono text-xs text-default-500'
              title={log.path}>
              {log.path}
            </p>
          </div>
        )
      case 'error': {
        const message = getErrorMessage(log)
        return (
          <div className='flex flex-col min-w-0'>
            {message ? (
              <p className='truncate text-xs text-default-500' title={message}>
                {message}
              </p>
            ) : (
              <p className='text-xs text-default-300'>—</p>
            )}
          </div>
        )
      }
      case 'user':
        if (log.userId && 'user' in log && log.user) {
          const user = log.user as {
            name: string
            email: string
            photoUrl?: string
          }
          return (
            <div className='flex items-center gap-2'>
              <User
                avatar={user.photoUrl}
                name={
                  isMobile
                    ? String(user.name.split(' ').shift())
                    : String(user.name)
                }
                className='size-7 shrink-0'
              />
              <div className='flex flex-col'>
                <span className='text-sm'>
                  {isMobile ? user.name.split(' ').shift() : user.name}
                </span>
                <span className='text-xs text-default-500'>{user.email}</span>
              </div>
            </div>
          )
        }
        return <p className='text-sm opacity-60'>Guest</p>
      case 'client':
        return (
          <div className='flex flex-col'>
            <p className='text-xs capitalize'>{log.browser ?? '—'}</p>
            {log.os && (
              <p className='text-xs capitalize opacity-50'>{log.os}</p>
            )}
          </div>
        )
      case 'country':
        return (
          <div className='flex flex-col'>
            {log.country && log.country !== 'null null' ? (
              <p className='text-xs'>{toEmoji(log.country)}</p>
            ) : (
              <p className='text-xs text-default-300'>—</p>
            )}
          </div>
        )
      case 'time':
        return (
          <div className='flex flex-col font-space'>
            <p className='whitespace-nowrap text-sm opacity-80'>
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

  if (logs === undefined) {
    return (
      <Card className='p-4 dark:bg-dark-table/10 rounded-none'>
        <div className='flex items-center justify-center py-8'>
          <p className='text-sm text-gray-400'>Loading error logs...</p>
        </div>
      </Card>
    )
  }

  if (logs.logs.length === 0) {
    return (
      <Card className='p-4 dark:bg-dark-table/0 rounded-none'>
        <h2 className='mb-4 px-4 font-space text-lg font-semibold'>
          Error Logs
        </h2>
        <div className='flex items-center justify-center py-8'>
          <p className='text-sm text-gray-400'>No errors recorded</p>
        </div>
      </Card>
    )
  }

  return (
    <Card
      className={cn(
        'w-full max-w-full overflow-hidden bg-light-table/0 dark:bg-dark-table/40 md:w-full md:rounded-t-2xl',
        'transition-transform duration-300',
        {'md:-translate-y-46 -translate-y-42 h-full': fullTable},
      )}>
      <div className='h-lvh overflow-auto transition-transform duration-300 md:h-[calc(100lvh-64px)]'>
        <Table aria-label='Error logs table' className='min-w-232'>
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn
                key={column.uid}
                className='sticky top-0 z-10 h-8 border-b border-gray-200 bg-white/60 text-xs font-medium tracking-wider backdrop-blur-xl first:rounded-tl-[12.5px] last:rounded-tr-[12.5px] dark:border-dark-table dark:bg-dark-table/5'>
                <div className='drop-shadow-xs'>{column.name}</div>
              </TableColumn>
            )}
          </TableHeader>
          <TableBody items={logs.logs}>
            {(log) => (
              <TableRow
                key={log._id as string}
                className='h-8 border-b-[0.33px] border-b-light-table last:border-b-0 hover:bg-light-table/60 dark:border-b-dark-table dark:hover:bg-origin/40'>
                {(columnKey) => (
                  <TableCell>
                    {
                      renderCell(
                        log,
                        columnKey as unknown as React.Key,
                      ) as ReactNode
                    }
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

'use client'

import {api} from '@/convex/_generated/api'
import type {Doc} from '@/convex/_generated/dataModel'
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
import {useMemo} from 'react'
import {dateCell} from '../../../_components/ui/cells'

type UserDoc = Doc<'users'>

const columns = [
  {name: 'USER', uid: 'user'},
  {name: 'EMAIL', uid: 'email'},
  {name: 'JOINED', uid: 'joined'},
  {name: 'STATUS', uid: 'status'},
]

export const StaffTable = () => {
  const users = useQuery(api.users.q.getAllUsers, {limit: 100})

  const renderCell = (user: UserDoc, columnKey: React.Key) => {
    switch (columnKey) {
      case 'user':
        return (
          <User
            name={user.name}
            description={user.email}
            avatarProps={{
              src: user.photoUrl,
              size: 'sm',
            }}
          />
        )
      case 'email':
        return (
          <div className='flex flex-col'>
            <p className='text-bold text-sm'>{user.email}</p>
          </div>
        )
      case 'joined':
        return dateCell(user._creationTime)
      case 'status':
        return (
          <div className='flex flex-col'>
            <p className='text-bold text-sm'>Active</p>
          </div>
        )
      default:
        return null
    }
  }

  const classNames = useMemo(
    () => ({
      wrapper: ['max-h-[382px]', 'max-w-3xl'],
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

  return (
    <Card shadow='sm' className='p-4'>
      {/*<div className='flex items-center justify-between mb-4'>
        <h2 className='text-lg font-semibold font-space'>Personnel</h2>
        <p className='text-sm text-gray-400'>{users?.length} users</p>
      </div>*/}
      <Table
        isCompact
        removeWrapper
        aria-label='Personnel table'
        classNames={classNames}>
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn key={column.uid} align='start'>
              {column.name}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody emptyContent={'No users found'} items={users ?? []}>
          {(user) => (
            <TableRow key={user._id} className='h-16'>
              {(columnKey) => (
                <TableCell>{renderCell(user, columnKey)}</TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  )
}

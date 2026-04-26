'use client'

import {User} from '@/components/hero-v3/user'
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
} from '@heroui/react'
import {useQuery} from 'convex/react'
import {dateCell} from './ui/cells'

type UserDoc = Doc<'users'>

const columns = [
  {name: 'USER', uid: 'user'},
  {name: 'EMAIL', uid: 'email'},
  {name: 'JOINED', uid: 'joined'},
  {name: 'STATUS', uid: 'status'},
]

export const PersonnelTable = () => {
  const users = useQuery(api.users.q.getAllUsers, {limit: 100})

  const renderCell = (user: UserDoc, columnKey: React.Key) => {
    switch (columnKey) {
      case 'user':
        return (
          <div className='flex items-center gap-2'>
            <User
              avatar={user.photoUrl}
              name={user.name}
              className='shrink-0'
            />
            <div>
              <p className='text-sm font-medium'>{user.name}</p>
              {user.email && (
                <p className='text-xs text-default-400'>{user.email}</p>
              )}
            </div>
          </div>
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



  return (
    <Card className='p-4'>
      <Table aria-label='Personnel table'>
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn key={column.uid}>{column.name}</TableColumn>
          )}
        </TableHeader>
        <TableBody items={users ?? []}>
          {(user) => (
            <TableRow key={String(user._id)} className='h-16'>
              {(columnKey) => (
                <TableCell>
                  {renderCell(user, columnKey as unknown as React.Key)}
                </TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  )
}

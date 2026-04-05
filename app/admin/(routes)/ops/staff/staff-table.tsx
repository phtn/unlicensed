'use client'

import {api} from '@/convex/_generated/api'
import type {Doc} from '@/convex/_generated/dataModel'
import {
  Card,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react'
import {useQuery} from 'convex/react'
import {dateCell} from '../../../_components/ui/cells'

type StaffDoc = Doc<'staff'>

const columns = [
  {name: 'NAME', uid: 'name'},
  {name: 'EMAIL', uid: 'email'},
  {name: 'POSITION', uid: 'position'},
  {name: 'ROLES', uid: 'roles'},
  {name: 'CREATED', uid: 'created'},
  {name: 'STATUS', uid: 'status'},
]

export const StaffTable = () => {
  const staff = useQuery(api.staff.q.getStaff)

  const renderCell = (member: StaffDoc, columnKey: React.Key) => {
    switch (columnKey) {
      case 'name':
        return (
          <div className='flex flex-col'>
            <p className='font-okxs font-medium text-sm'>
              {member.name || 'N/A'}
            </p>
          </div>
        )
      case 'email':
        return (
          <div className='flex flex-col'>
            <p className='font-medium text-sm'>{member.email}</p>
          </div>
        )
      case 'position':
        return (
          <div className='flex flex-col'>
            <p className='text-bold text-sm'>{member.position}</p>
          </div>
        )
      case 'roles':
        return (
          <div className='flex flex-wrap gap-1'>
            {member.accessRoles.map((role) => (
              <Chip key={role} size='sm' variant='tertiary'>
                {role}
              </Chip>
            ))}
          </div>
        )
      case 'created':
        return dateCell(member.createdAt)
      case 'status':
        return (
          <Chip
            size='sm'
            color={member.active ? 'success' : 'default'}
            variant='tertiary'>
            {member.active ? 'Active' : 'Inactive'}
          </Chip>
        )
      default:
        return null
    }
  }


  return (
    <Card className='p-4'>
      {/*<div className='flex items-center justify-between mb-4'>
        <h2 className='text-lg font-semibold font-space'>Personnel</h2>
        <p className='text-sm text-gray-400'>{users?.length} users</p>
      </div>*/}
      <Table
        aria-label='Staff table'>
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn key={column.uid}>
              {column.name}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody items={staff ?? []}>
          {(member) => (
            <TableRow key={member._id as string} className='h-16'>
              {(columnKey) => (
                <TableCell>{renderCell(member, columnKey as unknown as React.Key)}</TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  )
}

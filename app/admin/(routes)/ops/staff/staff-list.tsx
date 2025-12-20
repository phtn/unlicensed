'use client'

import {Doc} from '@/convex/_generated/dataModel'
import {Icon} from '@/lib/icons'
import {Button, Card, Chip} from '@heroui/react'
import {formatDistanceToNow} from 'date-fns'
import Link from 'next/link'

interface StaffListProps {
  staff: Array<Doc<'staff'>> | undefined
}

const StaffItem = ({member}: {member: Doc<'staff'>}) => (
  <Card
    className='p-4 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors'
    radius='sm'>
    <div className='flex items-start justify-between'>
      <div className='flex-1 space-y-2'>
        <div className='flex items-center gap-2'>
          <h4 className='font-semibold text-base'>
            {member.name || 'Unnamed Staff'}
          </h4>
          <Chip
            size='sm'
            color={member.active ? 'success' : 'default'}
            variant='flat'>
            {member.active ? 'Active' : 'Inactive'}
          </Chip>
        </div>
        <p className='text-sm text-neutral-600 dark:text-neutral-400'>
          {member.email}
        </p>
        <div className='flex items-center gap-2'>
          <p className='text-sm font-medium'>{member.position}</p>
          <span className='text-neutral-400'>•</span>
          <div className='flex flex-wrap gap-1'>
            {member.accessRoles.map((role) => (
              <Chip key={role} size='sm' variant='flat' color='primary'>
                {role}
              </Chip>
            ))}
          </div>
        </div>
        <p className='text-xs text-neutral-500'>
          Created {formatDistanceToNow(member.createdAt, {addSuffix: true})}
        </p>
      </div>
      <Button
        size='sm'
        as={Link}
        isIconOnly
        radius='full'
        variant='flat'
        prefetch
        href={`/admin/ops/staff?tabId=edit&id=${member._id}`}
        className='text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800'>
        <Icon name='pencil-single-solid' className='size-4' />
      </Button>
    </div>
  </Card>
)

export const StaffList = ({staff}: StaffListProps) => {
  return (
    <section className='pt-2'>
      <h3 className='text-2xl tracking-tighter font-semibold px-2 mb-4'>
        Staff Members
      </h3>
      {staff?.length === 0 ? (
        <p className='mt-3 text-sm text-neutral-500 px-2'>
          No staff members yet. Create one to get started.
        </p>
      ) : (
        <ul className='space-y-2'>
          {staff?.map((member) => (
            <li key={member._id}>
              <StaffItem member={member} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

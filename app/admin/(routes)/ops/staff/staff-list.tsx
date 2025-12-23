'use client'

import {Doc} from '@/convex/_generated/dataModel'
import {Icon} from '@/lib/icons'
import {Button, Card, Chip, User} from '@heroui/react'
import {formatDistanceToNow} from 'date-fns'
import Link from 'next/link'

interface StaffListProps {
  staff: Array<Doc<'staff'>> | undefined
}

const StaffItem = ({member}: {member: Doc<'staff'>}) => (
  <Card
    className='p-4 hover:bg-neutral-50 transition-colors dark:hover:bg-dark-table/30 dark:bg-dark-table/40'
    radius='none'
    shadow='none'>
    <div className='flex items-start justify-between'>
      <div className='flex'>
        <div className='flex-1 w-64'>
          <User
            avatarProps={{src: member.avatarUrl}}
            classNames={{
              name: 'mb-1',
              description: 'text-xs opacity-80 text-foreground',
            }}
            name={
              <div className='flex items-center gap-2'>
                <h4 className='font-semibold tracking-tight text-base'>
                  {member.name || 'Unnamed Staff'}
                </h4>
                <Chip
                  size='sm'
                  color={member.active ? 'success' : 'default'}
                  variant='flat'
                  className='bg-emerald-500/10 h-5'>
                  {member.active ? 'Active' : 'Inactive'}
                </Chip>
              </div>
            }
            description={member.position}
          />
        </div>
        <div className='portrait:hidden space-y-1'>
          <div className='flex items-center gap-2'>
            <h4 className='font-semibold tracking-tight text-base text-indigo-500'>
              {member.position}
            </h4>
            <span className='opacity-30'>●</span>
            <div className='flex flex-wrap gap-1'>
              {member.accessRoles.map((role) => (
                <Chip
                  key={role}
                  size='sm'
                  variant='flat'
                  color='primary'
                  className='h-5 bg-sky-500/10'>
                  {role}
                </Chip>
              ))}
            </div>
          </div>
          <p className='text-xs opacity-80'>
            created {formatDistanceToNow(member.createdAt, {addSuffix: true})}
          </p>
        </div>
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
    <section>
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

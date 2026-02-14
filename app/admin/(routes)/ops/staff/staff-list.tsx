'use client'

import {api} from '@/convex/_generated/api'
import type {Doc} from '@/convex/_generated/dataModel'
import {useAuthCtx} from '@/ctx/auth'
import {onError, onSuccess} from '@/ctx/toast'
import {Icon} from '@/lib/icons'
import {Button, Card, Chip, User} from '@heroui/react'
import {useMutation} from 'convex/react'
import {formatDistanceToNow} from 'date-fns'
import Link from 'next/link'
import {useRouter} from 'next/navigation'
import {useCallback, useState} from 'react'

interface StaffListProps {
  staff: Array<Doc<'staff'>> | undefined
}

const StaffItem = ({member}: {member: Doc<'staff'>}) => {
  const {user} = useAuthCtx()
  const router = useRouter()
  const connectStaffForChat = useMutation(api.follows.m.connectStaffForChat)
  const [isConnecting, setIsConnecting] = useState(false)

  const handleChatClick = useCallback(async () => {
    if (!user?.uid) {
      onError('You must be signed in to start a chat')
      return
    }
    setIsConnecting(true)
    try {
      const result = await connectStaffForChat({
        staffId: member._id,
        currentUserFid: user.uid,
      })
      onSuccess('Chat room created')
      router.push(`/account/chat/${result.staffUserFid}`)
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to open chat')
    } finally {
      setIsConnecting(false)
    }
  }, [connectStaffForChat, member._id, router, user?.uid])

  return (
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
                  <h4 className='font-medium text-base'>
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
              <h4 className='font-medium text-base text-indigo-500'>
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
        <div className='flex items-center space-x-4'>
          <Button
            size='sm'
            isIconOnly
            radius='full'
            variant='flat'
            isDisabled={isConnecting}
            isLoading={isConnecting}
            aria-label='Open chat'
            onPress={handleChatClick}
            className='text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800'>
            <Icon name='chat-2-fill' className='size-4 text-featured' />
          </Button>

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
      </div>
    </Card>
  )
}

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

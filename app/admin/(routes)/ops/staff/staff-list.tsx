'use client'

import {User} from '@/components/hero-v3/user'
import {api} from '@/convex/_generated/api'
import type {Doc} from '@/convex/_generated/dataModel'
import {useAuthCtx} from '@/ctx/auth'
import {onError, onSuccess} from '@/ctx/toast'
import {Icon} from '@/lib/icons'
import {getInitials} from '@/utils/initials'
import {Button, Card, Chip} from '@heroui/react'
import {useMutation} from 'convex/react'
import {formatDistanceToNow} from 'date-fns'
import {useRouter} from 'next/navigation'
import {useCallback, useState} from 'react'

interface StaffListProps {
  staff: Array<Doc<'staff'>> | undefined
}

const StaffItem = ({member}: {member: Doc<'staff'>}) => {
  const {user} = useAuthCtx()
  const router = useRouter()
  const navigate = useCallback(
    (path: string) => () => {
      router.push(path)
    },
    [router],
  )
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
    <Card className='rounded-md p-2 md:p-4 hover:bg-neutral-50 transition-colors dark:hover:bg-dark-table/30 dark:bg-dark-table/40'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
        <div className='flex min-w-0 gap-3 sm:gap-4'>
          <div className='flex-1'>
            <User avatar={member.avatarUrl} name={getInitials(member.name)} />
          </div>
          <div className='min-w-0 flex-1 sm:w-72'>
            <p className='break-words font-medium'>{member.name}</p>
            <p className='break-all opacity-60 sm:truncate'>{member.email}</p>
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
                    variant='tertiary'
                    className='h-5 bg-sky-500/10'
                  >
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
        <div className='flex items-center justify-end gap-2 sm:gap-4'>
          <Button
            size='sm'
            isIconOnly
            variant='tertiary'
            isDisabled={isConnecting}
            aria-label='Open chat'
            onPress={handleChatClick}
            className='text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 bg-sidebar/50'
          >
            <Icon name='chat' className='size-5' />
          </Button>

          <Button
            size='sm'
            isIconOnly
            variant='tertiary'
            onPress={navigate(`/admin/ops/staff?tabId=edit&id=${member._id}`)}
            className='text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 bg-sidebar/50'
          >
            <Icon name='pen' className='size-5' />
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
        <p className='mt-3 text-sm text-neutral-500 md:px-2'>
          No staff members yet. Create one to get started.
        </p>
      ) : (
        <ul className='md:space-y-2'>
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

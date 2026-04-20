import {Ascend} from '@/components/expermtl/ascend'
import {LegacyImage} from '@/components/ui/legacy-image'
import {UserType} from '@/convex/users/d'
import {cn} from '@/lib/utils'
import {Card} from '@heroui/react'
import {memo} from 'react'

interface ProfileCardProps {
  user: UserType
}

export const ProfileCard = ({user}: ProfileCardProps) => {
  const initial = (user?.name ?? '').charAt(0).toUpperCase()
  const memberYear = user?.createdAt
    ? new Date(user.createdAt).getFullYear()
    : null

  return (
    <Card className='relative overflow-hidden rounded-xs border border-foreground/10 dark:bg-dark-table/40'>
      <ProfileBackground />
      <Card.Content className='relative z-10 p-6'>
        <div className='flex flex-col items-center gap-4 text-center'>
          {/* Avatar */}
          <div className='size-20 overflow-hidden rounded-full ring-2 ring-foreground/10 ring-offset-2 ring-offset-background'>
            {user?.photoUrl ? (
              <LegacyImage
                src={user.photoUrl}
                alt='Profile'
                className='size-full object-cover'
                loading='lazy'
              />
            ) : (
              <div className='flex size-full items-center justify-center bg-linear-to-br from-indigo-100 to-pink-100 text-3xl font-medium text-foreground/60 dark:from-indigo-900/30 dark:to-pink-900/30'>
                {initial}
              </div>
            )}
          </div>

          {/* Info */}
          <div className='space-y-1.5'>
            <h2 className='font-bone text-lg leading-none tracking-tight'>
              {user?.name}
            </h2>
            {user?.email && (
              <p className='font-okxs text-xs text-default-400'>{user.email}</p>
            )}
            {/*{user?.contact?.phone && (
              <p className='font-okxs text-xs text-default-400'>
                {user.contact.phone}
              </p>
            )}*/}
            {memberYear && (
              <p className='font-okxs text-[10px] uppercase tracking-widest text-default-300'>
                Member since {memberYear}
              </p>
            )}
          </div>
        </div>
      </Card.Content>
    </Card>
  )
}

const ProfileBackground = memo(() => {
  return (
    <Ascend
      starColor={'#d0499a'}
      className={cn(
        'pointer-events-none absolute inset-0 z-0 flex items-center justify-center',
      )}
    />
  )
})

ProfileBackground.displayName = 'ProfileBackground'

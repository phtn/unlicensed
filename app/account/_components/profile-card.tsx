import {Ascend} from '@/components/expermtl/ascend'
import {UserType} from '@/convex/users/d'
import {cn} from '@/lib/utils'
import {Card, CardBody, Image} from '@heroui/react'
import {memo} from 'react'

interface ProfileCardProps {
  user: UserType
}

export const ProfileCard = ({user}: ProfileCardProps) => {
  return (
    <Card
      shadow='none'
      radius='none'
      className='relative border border-foreground/20 rounded-4xl dark:bg-dark-table/40'>
      <ProfileBackground />
      <CardBody className='p-6 min-h-80'>
        <div className='flex flex-col items-center text-center space-y-5 justify-center'>
          <div className=''>
            <div className='size-32 mask-b-from-50% mask-radial-[50%_50%] mask-radial-from-80% rounded-full p-0.5 bg-linear-to-br from-indigo-500 via-purple-500 to-pink-500'>
              <div className='z-200 w-full h-full rounded-full overflow-hidden border-4 border-background bg-background flex items-center justify-center'>
                {user?.photoUrl ? (
                  <Image
                    src={user.photoUrl}
                    alt='Profile'
                    className='size-full object-cover relative z-100'
                  />
                ) : (
                  <div className='w-full h-full flex items-center justify-center font-polysans font-normal bg-linear-to-br from-indigo-100 to-pink-100 dark:from-indigo-900/30 dark:to-pink-900/30 text-4xl text-white dark:text-indigo-400 '>
                    {(user?.name ?? '').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          </div>
          <h2 className='text-xl font-bone tracking-tight'>{user?.name}</h2>
        </div>
      </CardBody>
    </Card>
  )
}

const ProfileBackground = memo(() => {
  // Derive star color during render (simple expression, no need for useMemo)
  // const starColor = theme === 'dark' ? '#d0499a' : '#d0499a'

  return (
    <Ascend
      starColor={'#d0499a'}
      className={cn(
        'flex items-center justify-center absolute z-0 pointer-events-none inset-0',
        '',
        // 'dark:bg-[radial-gradient(ellipse_at_bottom,#262626_0%,#000_60%)] _bg-[radial-gradient(ellipse_at_bottom,_#f5f5f5_0%,_#fff_50%)]',
      )}
    />
  )
})

ProfileBackground.displayName = 'ProfileBackground'

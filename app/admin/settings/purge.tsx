import {api} from '@/convex/_generated/api'
import {Icon} from '@/lib/icons'
import {Button} from '@heroui/react'
import {useMutation} from 'convex/react'
import {useCallback, useState} from 'react'

export const PurgeActions = () => {
  const [purgingUsers, setIsPurgingUsers] = useState(false)
  const purgeUsers = useMutation(api.users.m.purgeTestUsers)

  const handlePurgeUsers = useCallback(async () => {
    setIsPurgingUsers(true)
    await purgeUsers()
      .catch(console.error)
      .finally(() => setIsPurgingUsers(false))
  }, [purgeUsers])

  return (
    <div className='flex flex-col gap-4 px-4 py-4 border-t'>
      <div className='flex items-center gap-6'>
        <Button
          radius='sm'
          size='sm'
          variant='solid'
          color='danger'
          onPress={handlePurgeUsers}>
          <span>Purge Test Users</span>
          <Icon name={purgingUsers ? 'spinners-ring' : 'x'} />
        </Button>
      </div>
    </div>
  )
}

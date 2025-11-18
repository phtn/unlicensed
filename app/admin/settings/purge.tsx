import {api} from '@/convex/_generated/api'
import {Icon} from '@/lib/icons'
import {Button} from '@heroui/react'
import {useMutation} from 'convex/react'
import {useCallback, useState} from 'react'

export const PurgeActions = () => {
  const [purgingUsers, setIsPurgingUsers] = useState(false)
  const [purgingProducts, setIsPurgingProducts] = useState(false)
  const [purgingCategories, setIsPurgingCategories] = useState(false)
  const purgeUsers = useMutation(api.users.m.purgeTestUsers)
  const purgeProducts = useMutation(api.products.m.purgeTestProducts)
  const purgeCategories = useMutation(api.categories.m.purgeTestCategories)

  const handlePurgeUsers = useCallback(async () => {
    setIsPurgingUsers(true)
    await purgeUsers()
      .catch(console.error)
      .finally(() => setIsPurgingUsers(false))
  }, [purgeUsers])

  const handlePurgeProducts = useCallback(async () => {
    setIsPurgingProducts(true)
    await purgeProducts()
      .catch(console.error)
      .finally(() => setIsPurgingProducts(false))
  }, [purgeProducts])

  const handlePurgeCategories = useCallback(async () => {
    setIsPurgingCategories(true)
    await purgeCategories()
      .catch(console.error)
      .finally(() => setIsPurgingCategories(false))
  }, [purgeCategories])

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
        <Button variant='solid' radius='sm' onPress={handlePurgeProducts}>
          <span>Purge Test Products</span>
          <Icon
            className='text-danger'
            name={purgingProducts ? 'spinners-ring' : 'x'}
          />
        </Button>
        <Button variant='solid' radius='sm' onPress={handlePurgeCategories}>
          <span>Purge Test Categories</span>
          <Icon
            className='text-danger'
            name={purgingCategories ? 'spinners-ring' : 'x'}
          />
        </Button>
      </div>
    </div>
  )
}

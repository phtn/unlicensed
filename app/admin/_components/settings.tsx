import {api} from '@/convex/_generated/api'
import {Icon} from '@/lib/icons'
import {Button} from '@heroui/react'
import {useMutation} from 'convex/react'
import {useCallback, useState} from 'react'

export const AdminSettings = () => {
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
    <div className='flex flex-col gap-4 border border-lime-100/20 px-4 py-8 rounded-lg'>
      <h2 className='text-xl font-bold'>Settings</h2>
      <div className='flex items-center gap-6'>
        <Button onPress={handlePurgeUsers}>
          <span>Purge Test Users</span>
          <Icon name={purgingUsers ? 'spinners-ring' : 'x'} />
        </Button>
        <Button onPress={handlePurgeProducts}>
          <span>Purge Test Products</span>
          <Icon name={purgingProducts ? 'spinners-ring' : 'x'} />
        </Button>
        <Button onPress={handlePurgeCategories}>
          <span>Purge Test Categories</span>
          <Icon name={purgingCategories ? 'spinners-ring' : 'x'} />
        </Button>
      </div>
    </div>
  )
}

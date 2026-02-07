'use client'

import {CartHistory} from '@/app/lobby/(store)/cart/cart-history'
import {Button} from '@heroui/react'
import Link from 'next/link'
import {useRouter} from 'next/navigation'
import {useTransition} from 'react'

interface EmptyCartProps {
  onPress?: VoidFunction
}

export const EmptyCart = ({onPress}: EmptyCartProps) => {
  const router = useRouter()
  const [, startTransition] = useTransition()

  const handleItemAdded = () => {
    // Refresh the page to show the cart with the newly added item
    startTransition(() => {
      router.refresh()
    })
  }

  return (
    <div className='w-full md:max-w-2xl mb-4'>
      <div className='text-center space-y-4'>
        <div className='flex items-center justify-center space-x-2'>
          <Button
            size='md'
            radius='none'
            as={Link}
            color='primary'
            href='/lobby/products'
            prefetch
            onPress={onPress}
            className='rounded-lg font-polysans font-medium dark:bg-white dark:text-brand group hover:opacity-100'>
            <span className='dark:text-brand group-hover:opacity-100'>
              All Products
            </span>
          </Button>
          <Button
            size='md'
            radius='none'
            as={Link}
            color='primary'
            href='/lobby/category'
            prefetch
            onPress={onPress}
            className='rounded-lg font-polysans font-medium dark:bg-white dark:text-brand group hover:opacity-100'>
            <span className='dark:text-dark-gray group-hover:opacity-100'>
              Browse by Category
            </span>
          </Button>
        </div>
      </div>

      <CartHistory onItemAdded={handleItemAdded} />
    </div>
  )
}

'use client'

import {CartHistory} from '@/app/lobby/(store)/cart/cart-history'
import {PendingDealsSection} from '@/app/lobby/(store)/deals/components/pending-deals-section'
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
    <div className='w-full md:max-w-2xl mb-4 space-y-6'>
      <PendingDealsSection />
      <div className='text-center space-y-4'>
        <div className='hidden _flex items-center justify-center space-x-2'>
          <Link
            prefetch
            href='/lobby/products'
            onClick={onPress}
            className='rounded-lg font-polysans font-medium dark:bg-white dark:text-brand group hover:opacity-100'>
            <span className='dark:text-brand group-hover:opacity-100'>
              All Products
            </span>
          </Link>
          <Link
            prefetch
            onClick={onPress}
            href='/lobby/category'
            className='rounded-lg font-polysans font-medium dark:bg-white dark:text-brand group hover:opacity-100'>
            <span className='dark:text-dark-gray group-hover:opacity-100'>
              Browse by Category
            </span>
          </Link>
        </div>
      </div>

      <CartHistory onItemAdded={handleItemAdded} />
    </div>
  )
}

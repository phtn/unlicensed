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
    <div className='w-full md:max-w-2xl mb-2'>
      <div className='text-center space-y-4'>
        <p className='font-polysans text-foreground/70'>Your cart is empty.</p>
        <Button
          size='md'
          as={Link}
          color='primary'
          href='/lobby/category'
          prefetch
          variant='shadow'
          onPress={onPress}
          className='font-polysans font-semibold bg-brand/90 hover:bg-brand group hover:opacity-100 hover:shadow-lg shadow-md shadow-brand/50 transition-all duration-200'>
          <span className='drop-shadow-xs text-white group-hover:opacity-100'>
            Browse Products
          </span>
        </Button>
      </div>

      <CartHistory onItemAdded={handleItemAdded} />
    </div>
  )
}

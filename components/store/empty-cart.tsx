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
    <div className='w-full md:max-w-2xl'>
      <div className='text-center space-y-4'>
        <p className='font-polysans text-foreground/70'>Your cart is empty.</p>
        <Button
          size='lg'
          as={Link}
          color='primary'
          href='/lobby/category'
          prefetch
          variant='shadow'
          onPress={onPress}
          className='font-polysans font-semibold bg-brand shadow-brand/50'>
          Browse Products
        </Button>
      </div>

      <CartHistory onItemAdded={handleItemAdded} />
    </div>
  )
}

import {Icon} from '@/lib/icons'
import {Button} from '@heroui/react'
import Link from 'next/link'

interface EmptyCartProps {
  onPress?: VoidFunction
}

export const EmptyCart = ({onPress}: EmptyCartProps) => {
  return (
    <div className='text-center space-y-4 pt-8'>
      <Icon name='bag-solid' className='size-8 md:size-12 mx-auto opacity-50' />
      <h1 className='md:text-lg font-polysans opacity-70'>
        Your cart is empty
      </h1>
      <Button
        size='lg'
        as={Link}
        color='primary'
        href='/category'
        prefetch
        variant='shadow'
        onPress={onPress}
        className='font-polysans font-semibold bg-brand shadow-brand/50'>
        Browse Products
      </Button>
    </div>
  )
}

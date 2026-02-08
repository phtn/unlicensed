import {Icon} from '@/lib/icons'

interface CartPageHeaderProps {
  isPending: boolean
}

export function CartPageHeader({isPending}: CartPageHeaderProps) {
  return (
    <div className='flex items-center justify-between mb-4'>
      <h1 className='text-base font-medium font-brk space-x-2 tracking-tight'>
        <span className='opacity-60'>Cart</span>
        <span className='font-light text-sm'>\</span>
        {isPending ? <Icon name='spinner-dots' /> : <span>Checkout</span>}
      </h1>
    </div>
  )
}

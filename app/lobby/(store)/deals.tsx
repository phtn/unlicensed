import {HyperBadge} from '@/components/main/badge'
import Link from 'next/link'

export const DealsLink = () => {
  return (
    <Link href='/lobby/deals' prefetch>
      <div className='flex items-center justify-center space-x-4 md:justify-start mt-20 md:max-w-6xl md:mx-auto'>
        <span className='font-polysans text-2xl underline underline-offset-4 decoration-4'>
          Checkout
        </span>
        <HyperBadge size='lg' variant='deal'>
          Product Deals
        </HyperBadge>
      </div>
    </Link>
  )
}

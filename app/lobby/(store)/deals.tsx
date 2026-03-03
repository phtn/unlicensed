import {HyperBadge} from '@/components/main/badge'
import Link from 'next/link'

export const DealsLink = () => {
  return (
    <Link href='/lobby/deals' prefetch>
      <div className='flex items-center justify-center space-x-4 md:justify-start mt-20 md:max-w-6xl md:mx-auto'>
        <HyperBadge size='lg' variant='deal'>
          Product Deals
        </HyperBadge>
      </div>
    </Link>
  )
}

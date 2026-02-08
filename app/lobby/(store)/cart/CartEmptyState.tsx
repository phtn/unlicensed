import {Loader} from '@/components/expermtl/loader'
import {EmptyCart} from '@/components/store/empty-cart'

interface CartEmptyStateProps {
  isLoading: boolean
  showEmptyCartLoader: boolean
}

export function CartEmptyState({
  isLoading,
  showEmptyCartLoader,
}: CartEmptyStateProps) {
  if (isLoading || showEmptyCartLoader) {
    return (
      <div className='min-h-screen w-screen pt-20 lg:pt-28 flex items-start justify-center'>
        <Loader />
      </div>
    )
  }

  return (
    <div className='min-h-screen w-screen flex items-start justify-center pt-16 sm:pt-10 md:pt-24 lg:pt-28 px-4 sm:px-6 lg:px-8'>
      <EmptyCart />
    </div>
  )
}

import {StoreProduct} from '@/app/types'
import {Icon} from '@/lib/icons'
import {
  formatStockDisplay,
  getAvailableCartQuantityForDenomination,
} from '@/lib/productStock'
import {Badge} from '@heroui/react'

interface ProductDetailStatsProps {
  product: StoreProduct
  quantityInCart: number
  denomination?: number
  availableQuantity?: number
}

export const ProductDetailStats = ({
  product,
  quantityInCart,
  denomination,
  availableQuantity,
}: ProductDetailStatsProps) => {
  const fallbackAvailableQuantity = getAvailableCartQuantityForDenomination(
    product,
    denomination,
  )

  return (
    <div className='hidden md:flex items-center h-14 border-b border-background/20 bg-background/60 overflow-hidden justify-between gap-1 pl-4 md:w-full'>
      <span className='w-16 md:w-20 text-xs font-clash tracking-widest'>
        {product.categorySlug.toUpperCase()}
      </span>
      <div className='flex items-center space-x-2'>
        {product.categorySlug === 'vapes' ? (
          <span>
            <span className='text-sm md:text-base font-clash font-medium'>
              {product.netWeight}
              {product.netWeightUnit}
            </span>
          </span>
        ) : product.categorySlug === 'extracts' && !!product.thcPercentage ? (
          <span>
            <span className='font-clash font-medium text-xs md:text-sm'>
              THC
            </span>
            <span className='text-xs md:text-sm lowercase'>mg</span>
          </span>
        ) : null}
        {product.categorySlug === 'flower' || !product.thcPercentage ? null : (
          <span className='px-1 md:px-2 text-sm font-thin opacity-30'>|</span>
        )}
        <span className='font-clash font-medium text-xs md:text-sm'>
          {product.strainType}
        </span>{' '}
      </div>

      {quantityInCart > 0 ? (
        <div title='In The Bag' className='pr-2'>
          <Badge.Anchor>
            <div className='w-16 md:w-20 flex items-center justify-end pr-1'>
              <Icon
                name='bag-solid'
                className='size-4 md:size-5 drop-shadow-xs mt-0.5 md:mt-1 mr-4'
              />
            </div>
            <Badge
              variant='soft'
              className='flex items-center justify-center rounded-lg md:mx-0 h-3! aspect-square bg-brand dark:bg-light-brand font-clash font-medium border border-white text-white text-base'
              content={`$`}>
              {/*{quantityInCart}*/} 3
            </Badge>
          </Badge.Anchor>
        </div>
      ) : (
        <span className='opacity-0 text-[9px] w-16 md:w-20 text-sm whitespace-nowrap capitalize'>
          <span className='font-polysans font-semibold text-base'>
            {availableQuantity ??
              (denomination !== undefined
                ? fallbackAvailableQuantity
                : formatStockDisplay(product))}
          </span>{' '}
          left
        </span>
      )}
    </div>
  )
}

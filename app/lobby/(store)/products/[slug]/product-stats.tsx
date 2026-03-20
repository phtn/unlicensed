import {StoreProduct} from '@/app/types'
import {Icon} from '@/lib/icons'
import {formatStockDisplay} from '@/lib/productStock'
import {Badge, Tooltip} from '@heroui/react'

interface ProductDetailStatsProps {
  product: StoreProduct
  quantityInCart: number
  denominationKey: string
  availableQuantity?: number
}

export const ProductDetailStats = ({
  product,
  quantityInCart,
  denominationKey,
  availableQuantity,
}: ProductDetailStatsProps) => {
  return (
    <div className='flex items-center h-14 border-b border-background/20 bg-background/60 overflow-hidden justify-between gap-1 pl-4 md:w-full'>
      <span className='w-16 md:w-20 text-xs font-okxs'>
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
        ) : product.categorySlug === 'extracts' ? (
          <span>
            <span className='font-clash font-medium text-xs md:text-sm'>
              THC
            </span>
            <span className='text-xs md:text-sm lowercase'>mg</span>
          </span>
        ) : null}
        <span className='px-1 md:px-2 text-sm font-thin opacity-30'>|</span>
        <span className='font-clash font-medium text-xs md:text-sm'>
          {product.strainType}
        </span>{' '}
      </div>

      {quantityInCart > 0 ? (
        <Tooltip key='in-cart' content='In The Bag'>
          <Badge
            size='lg'
            variant='shadow'
            className='px-[0.5px]'
            classNames={{
              badge:
                'aspect-square size-5 md:size-6 text-sm md:text-base translate-x-0 -translate-y-1 rounded-xs flex items-center justify-center rounded-md border-1.5 dark:border-background/85 shadow-md backdrop-blur-2xl bg-brand/90',
            }}
            content={
              <div
                suppressHydrationWarning
                className='flex items-center justify-center rounded-xs py-0.5 px-1 md:mx-0 size-4 aspect-square'>
                <span className='font-okxs font-medium text-xs md:text-sm text-white leading-none drop-shadow-xs'>
                  {quantityInCart}
                </span>
              </div>
            }>
            <div className='w-16 md:w-20 flex items-center justify-end pr-1'>
              <Icon
                name='shopping-bag-fill'
                className='size-4 md:size-5 drop-shadow-xs mt-0.5 md:mt-1 mr-4.5'
              />
            </div>
          </Badge>
        </Tooltip>
      ) : (
        <span className='opacity-0 text-[9px] w-16 md:w-20 text-sm whitespace-nowrap capitalize'>
          <span className='font-polysans font-semibold text-base'>
            {availableQuantity ??
              product.stockByDenomination?.[denominationKey] ??
              formatStockDisplay(product)}
          </span>{' '}
          left
        </span>
      )}
    </div>
  )
}

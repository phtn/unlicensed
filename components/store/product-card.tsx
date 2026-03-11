'use client'

import type {StoreProduct} from '@/app/types'
import {Id} from '@/convex/_generated/dataModel'
import {useAddCartItem} from '@/hooks/use-add-cart-item'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {formatDenominationDisplay} from '@/utils/formatDenomination'
import {Button, Card, CardBody, CardFooter, Image} from '@heroui/react'
import NextLink from 'next/link'
import {memo, MouseEvent, useMemo, useState} from 'react'

type ProductCardProps = {
  product: StoreProduct
  /** Resolved image URL; when provided, used instead of product.image (e.g. when product.image is a storage ID) */
  imageUrl?: string | null
  className?: string
}

const formatPrice = (priceCents: number) => {
  const dollars = priceCents / 100
  return dollars % 1 === 0 ? `${dollars.toFixed(0)}` : `${dollars.toFixed(2)}`
}

type PriceOption = {
  price: string
  denom: string
  denominationValue: number
}

/** Builds price options; 1 oz is displayed as "Oz" (no space), other oz/units via formatDenominationDisplay. */
const priceOptionsFromDenomination = (
  priceByDenomination: Record<string, number> | undefined,
  unit: string,
): PriceOption[] | null => {
  if (!priceByDenomination || Object.keys(priceByDenomination).length === 0) {
    return null
  }
  const entries = Object.entries(priceByDenomination)
    .filter(([, cents]) => cents > 0)
    .sort(([a], [b]) => Number(a) - Number(b))
  if (entries.length === 0) return null
  return entries.map(([denom, cents]) => ({
    price: formatPrice(cents),
    denom: formatDenominationDisplay(denom, unit),
    denominationValue: Number(denom),
  }))
}

const ProductCardComponent = ({
  product,
  imageUrl: imageUrlProp,
  className,
}: ProductCardProps) => {
  const imageSrc = imageUrlProp ?? product.image
  const topEffects = product.effects.slice(0, 2)
  const priceOptions = useMemo(
    () =>
      priceOptionsFromDenomination(product.priceByDenomination, product.unit),
    [product.priceByDenomination, product.unit],
  )
  const firstThreeOptions = priceOptions?.slice(0, 3) ?? []
  const [selectedIndex, setSelectedIndex] = useState(0)
  const selectedOption =
    firstThreeOptions[Math.min(selectedIndex, firstThreeOptions.length - 1)] ??
    firstThreeOptions[0] ??
    null
  const netWeightLabel =
    product.netWeight != null || product.netWeightUnit
      ? [product.netWeight, product.netWeightUnit]
          .filter((value) => value != null && value !== '')
          .join(' ')
      : ''
  const batchIdLabel = product.batchId?.trim() ?? ''
  const addItem = useAddCartItem()
  const productId = product._id as Id<'products'> | undefined
  const productHref = `/lobby/products/${product.slug.toLocaleLowerCase()}`

  const handleAddToCart = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!productId || !selectedOption) return
    addItem(productId, 1, selectedOption.denominationValue)
  }

  return (
    <Card
      as={NextLink}
      href={productHref}
      radius='none'
      disableAnimation
      shadow='sm'
      className={cn(
        'group h-full transition-all duration-300 rounded-xs dark:bg-black bg-sidebar min-w-48 max-w-48 sm:min-w-80 md:min-w-72 lg:min-w-64 xl:min-w-76',
        className,
      )}>
      <CardBody className='flex flex-col p-0'>
        <div className='flex justify-center items-center relative overflow-hidden rounded-xs'>
          <div className='absolute size-full overflow-hidden inset-0 z-10 transition-all duration-300' />
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={product.name}
              radius='none'
              shadow='none'
              className='min-w-44 xl:min-w-64 rounded-t-xs rounded-b-sm object-cover aspect-square transition duration-300 group-hover:scale-[1.03]'
              isLoading={!imageSrc}
              loading='lazy'
            />
          ) : (
            <div className='h-44 w-auto min-h-48 xl:min-w-64 aspect-square flex items-center justify-center'>
              <Icon name='spinners-ring' />
            </div>
          )}
        </div>

        <div className='flex flex-col'>
          <div className='flex items-center justify-between gap-2 p-2 h-16'>
            <div className='flex-1 min-w-0'>
              <h3 className='text-sm md:text-base font-okxs truncate capitalize leading-5'>
                {product.name}
              </h3>
              <div className='flex items-center space-x-1 whitespace-nowrap'>
                {product.productTier != null && product.productTier !== '' && (
                  <span className='min-h-6 text-xs md:text-xs font-okxs font-bold opacity-60 dark:opacity-100 dark:text-alum uppercase'>
                    {product.productTier ?? ''}
                    <span className='min-h-6 text-xs px-2 opacity-50 font-bold'>
                      &middot;
                    </span>
                  </span>
                )}

                {netWeightLabel && (
                  <span className='min-h-6 text-xs md:text-xs font-okxs font-normal opacity-60 dark:opacity-100 dark:text-alum lowercase'>
                    {netWeightLabel}
                    {batchIdLabel && (
                      <span className='min-h-6 text-xs px-2 opacity-50 font-bold'>
                        &middot;
                      </span>
                    )}
                  </span>
                )}

                {batchIdLabel && (
                  <span className='min-h-6 text-xs md:text-xs font-okxs font-normal opacity-60 dark:opacity-100 dark:text-alum uppercase'>
                    {batchIdLabel}
                    {/*<span className='min-h-6 text-xs px-2 opacity-50 font-bold'>
                      &middot;
                    </span>*/}
                  </span>
                )}
              </div>
            </div>
            <div
              id='denom-price'
              className='text-2xl h-auto aspect-square flex items-center justify-end text-brand overflow-hidden grow-0'>
              {selectedOption ? `$${selectedOption.price}` : '—'}
            </div>
          </div>
          <div className=' bg-dark-table dark:bg-black w-full flex flex-col'>
            <div
              id='denom-options'
              className='flex h-8 mt-1.5 gap-x-1.5'
              onClick={(e) => e.preventDefault()}
              onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
              role='group'
              aria-label='Select denomination'>
              {firstThreeOptions.map((opt, i) => (
                <button
                  key={opt.denominationValue}
                  type='button'
                  className={cn(
                    'flex-1 flex justify-center items-center text-xs md:text-sm text-white font-okxs transition-colors bg-sidebar/50 dark:bg-dark-table ',
                    selectedIndex === i
                      ? 'dark:bg-white/90 bg-white text-brand hover:bg-sidebar/80 dark:hover:bg-white/75'
                      : 'hover:bg-white/85 hover:text-brand dark:hover:bg-white/80',
                  )}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setSelectedIndex(i)
                  }}>
                  {opt.denom}
                </button>
              ))}
            </div>
            <Button
              radius='none'
              variant='shadow'
              className='bg-brand text-white rounded-xs mt-1.25'
              isDisabled={!productId || !selectedOption}
              onClick={handleAddToCart}>
              Add to Cart
            </Button>
          </div>

          <div className='hidden _flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs uppercase tracking-wide text-color-muted'>
            <span className='pill-surface rounded-full px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs text-foreground/80'>
              <span className='font-bold mr-1 opacity-70'>THC</span>
              <span className='font-space'>
                {product.thcPercentage.toFixed(1)}%
              </span>
            </span>
            {topEffects.map((effect) => (
              <span
                key={effect}
                className='rounded-full bg-[#21A179] _pill-surface px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs capitalize tracking-tight opacity-80 font-space'>
                {effect}
              </span>
            ))}
          </div>
        </div>
      </CardBody>
      <CardFooter className='hidden _flex items-center justify-between px-3 sm:px-5 pb-3 sm:pb-5 pt-0'>
        <div className='flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs tracking-wide text-color-muted'>
          <span className='opacity-60 hidden sm:inline'>(1245 reviews)</span>
          <span className='sm:hidden opacity-60'>(1245)</span>
          <span>{product.rating.toFixed(1)} ★</span>
        </div>
        <span className='text-[10px] sm:text-xs font-semibold text-foreground/70'>
          Details
        </span>
      </CardFooter>
    </Card>
  )
}

ProductCardComponent.displayName = 'ProductCard'

export const ProductCard = memo(ProductCardComponent)

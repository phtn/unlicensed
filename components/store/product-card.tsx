'use client'
/* eslint-disable @next/next/no-img-element -- native img keeps this repeated grid item lightweight */

import type {StoreProduct} from '@/app/types'
import type {Id} from '@/convex/_generated/dataModel'
import {useAddCartItem} from '@/hooks/use-add-cart-item'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {formatDenominationDisplay} from '@/utils/formatDenomination'
import NextLink from 'next/link'
import {memo, type MouseEvent, useMemo, useState} from 'react'

type ProductCardProps = {
  product: StoreProduct
  /** Resolved image URL; when provided, used instead of product.image (e.g. when product.image is a storage ID) */
  imageUrl?: string | null
  className?: string
}

type PriceOption = {
  price: string
  denom: string
  denominationValue: number
}

const EMPTY_PRICE_OPTIONS: PriceOption[] = []

const formatPrice = (priceCents: number) => {
  const dollars = priceCents / 100
  return dollars % 1 === 0 ? `${dollars.toFixed(0)}` : `${dollars.toFixed(2)}`
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

const areStringArraysEqual = (
  left?: readonly string[],
  right?: readonly string[],
) => {
  if (left === right) return true

  const leftLength = left?.length ?? 0
  if (leftLength !== (right?.length ?? 0)) return false

  for (let index = 0; index < leftLength; index += 1) {
    if (left?.[index] !== right?.[index]) return false
  }

  return true
}

const arePriceMapsEqual = (
  left?: Record<string, number>,
  right?: Record<string, number>,
) => {
  if (left === right) return true

  const leftKeys = left ? Object.keys(left) : []
  const rightKeys = right ? Object.keys(right) : []

  if (leftKeys.length !== rightKeys.length) return false

  for (const key of leftKeys) {
    if (left?.[key] !== right?.[key]) return false
  }

  return true
}

const areProductsEqual = (left: StoreProduct, right: StoreProduct) =>
  left._id === right._id &&
  left.slug === right.slug &&
  left.image === right.image &&
  left.name === right.name &&
  left.productType === right.productType &&
  left.productTier === right.productTier &&
  left.productTierLabel === right.productTierLabel &&
  left.subcategory === right.subcategory &&
  left.netWeight === right.netWeight &&
  left.netWeightUnit === right.netWeightUnit &&
  left.batchId === right.batchId &&
  left.unit === right.unit &&
  areStringArraysEqual(left.brand, right.brand) &&
  arePriceMapsEqual(left.priceByDenomination, right.priceByDenomination)

const ProductCardComponent = ({
  product,
  imageUrl: imageUrlProp,
  className,
}: ProductCardProps) => {
  const addItem = useAddCartItem()
  const [selectedIndex, setSelectedIndex] = useState(0)

  const {
    batchIdLabel,
    brandLabel,
    firstThreeOptions,
    netWeightLabel,
    productHref,
    subcategoryLabel,
    tierLabel,
  } = useMemo(() => {
    const brandLabel = product.brand
      ? product.brand.map((brand) => brand.split('-').join(' ')).join(', ')
      : ''
    const firstThreeOptions =
      priceOptionsFromDenomination(
        product.priceByDenomination,
        product.unit,
      )?.slice(0, 3) ?? EMPTY_PRICE_OPTIONS

    return {
      batchIdLabel: product.batchId?.trim() ?? '',
      brandLabel,
      firstThreeOptions,
      netWeightLabel:
        product.netWeight != null || product.netWeightUnit
          ? [product.netWeight, product.netWeightUnit]
              .filter((value) => value != null && value !== '')
              .join(' ')
          : '',
      productHref: `/lobby/products/${product.slug.toLowerCase()}`,
      subcategoryLabel: product.subcategory?.trim() ?? '',
      tierLabel: product.productTierLabel ?? product.productTier ?? '',
    }
  }, [
    product.batchId,
    product.brand,
    product.netWeight,
    product.netWeightUnit,
    product.priceByDenomination,
    product.productTier,
    product.productTierLabel,
    product.slug,
    product.subcategory,
    product.unit,
  ])

  const selectedOption =
    firstThreeOptions[Math.min(selectedIndex, firstThreeOptions.length - 1)] ??
    firstThreeOptions[0] ??
    null
  const imageSrc = imageUrlProp ?? product.image
  const productId = product._id as Id<'products'> | undefined

  const handleAddToCart = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()

    if (!productId || !selectedOption) return

    addItem(productId, 1, selectedOption.denominationValue)
  }

  return (
    <article
      className={cn(
        'group relative h-full min-w-48 max-w-48 overflow-hidden rounded-xs bg-sidebar shadow-sm dark:bg-black sm:min-w-80 md:min-w-72 lg:min-w-64 xl:min-w-76 contain-content [content-visibility:auto] [contain-intrinsic-size:31rem]',
        className,
      )}>
      <NextLink
        href={productHref}
        prefetch={false}
        aria-label={`View ${product.name}`}
        className='absolute inset-0 z-10 rounded-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background'
      />

      <div className='flex h-full flex-col'>
        <div className='relative flex items-center justify-center overflow-hidden rounded-xs bg-sidebar/40 dark:bg-dark-table/40'>
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={product.name}
              loading='lazy'
              decoding='async'
              draggable={false}
              className='aspect-square min-w-44 rounded-xs object-cover transition-transform duration-300 group-hover:scale-[1.03] xl:min-w-64'
            />
          ) : (
            <div className='flex aspect-square h-44 min-h-48 w-auto items-center justify-center xl:min-w-64'>
              <Icon name='spinners-ring' />
            </div>
          )}
        </div>

        <div className='flex flex-1 flex-col'>
          <div className='relative flex items-center justify-between p-2'>
            <div className='min-w-0 flex-1 pr-24'>
              {brandLabel && (
                <p className='mb-0.5 text-xs font-light capitalize tracking-wide opacity-90 md:text-sm font-okxs'>
                  <span className='font-light'>{brandLabel}</span>
                  {product.productType && (
                    <span>
                      <span className='px-1 text-xs font-thin opacity-70 font-okxs'>
                        &middot;
                      </span>
                      {product.productType}
                    </span>
                  )}
                </p>
              )}

              <h3 className='truncate text-base capitalize leading-5 font-clash sm:text-base md:text-lg md:leading-5 lg:text-xl lg:leading-5'>
                {product.name}
              </h3>

              <div className='whitespace-nowrap'>
                <div className='mt-0.5 flex h-4 items-center md:mt-1'>
                  {tierLabel !== '' && (
                    <span className='text-xs font-medium uppercase tracking-wider opacity-80 dark:text-alum dark:opacity-100 md:text-xs md:font-semibold font-clash'>
                      {tierLabel}
                    </span>
                  )}
                </div>

                <div className='flex h-4 items-center whitespace-nowrap'>
                  {subcategoryLabel && (
                    <span className='text-xs font-light capitalize opacity-80 dark:text-alum dark:opacity-100 md:text-sm font-okxs'>
                      {subcategoryLabel}
                      {(netWeightLabel || batchIdLabel) && (
                        <span className='px-1 text-xs font-thin opacity-80'>
                          &middot;
                        </span>
                      )}
                    </span>
                  )}

                  {netWeightLabel && (
                    <span className='text-xs font-normal lowercase opacity-80 dark:text-alum dark:opacity-100 md:text-xs font-okxs'>
                      {netWeightLabel}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className='pointer-events-none absolute right-2 top-2 flex aspect-square h-auto grow-0 items-center justify-end overflow-hidden text-2xl text-brand'>
              {selectedOption ? (
                <span>
                  $<span className='font-black'>{selectedOption.price}</span>
                </span>
              ) : (
                '—'
              )}
            </div>
          </div>

          <div className='mt-auto flex w-full flex-col bg-dark-table dark:bg-black'>
            <div
              className='mt-1.5 flex h-8 gap-x-1.5'
              role='group'
              aria-label='Select denomination'>
              {firstThreeOptions.map((option, index) => (
                <button
                  key={option.denominationValue}
                  type='button'
                  aria-pressed={selectedIndex === index}
                  className={cn(
                    'relative z-20 flex flex-1 items-center justify-center bg-sidebar/50 text-xs text-white transition-colors dark:bg-dark-table md:text-sm font-okxs',
                    selectedIndex === index
                      ? 'bg-white text-brand hover:bg-sidebar/80 dark:bg-white/90 dark:hover:bg-white/75'
                      : 'hover:bg-white/85 hover:text-brand dark:hover:bg-white/80',
                  )}
                  onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    setSelectedIndex(index)
                  }}>
                  {option.denom}
                </button>
              ))}
            </div>

            <button
              type='button'
              className='relative z-20 mt-1.25 rounded-xs bg-brand px-3 py-2 text-sm font-medium text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50'
              disabled={!productId || !selectedOption}
              onClick={handleAddToCart}>
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

ProductCardComponent.displayName = 'ProductCard'

export const ProductCard = memo(
  ProductCardComponent,
  (previousProps, nextProps) =>
    previousProps.className === nextProps.className &&
    previousProps.imageUrl === nextProps.imageUrl &&
    areProductsEqual(previousProps.product, nextProps.product),
)

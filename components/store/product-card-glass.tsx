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

type ProductCardGlassProps = {
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

const ProductCardGlassComponent = ({
  product,
  imageUrl: imageUrlProp,
  className,
}: ProductCardGlassProps) => {
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
        'group relative isolate h-[350.01px] min-h-[350.01px] max-h-[350.01px] min-w-48 max-w-48 overflow-hidden rounded-sm border border-white/15 bg-white/10 shadow-[0_18px_55px_rgba(15,23,42,0.18)] backdrop-blur-xl dark:border-white/10 dark:bg-white/3 sm:min-w-80 md:min-w-72 lg:min-w-64 xl:min-w-76',
        className,
      )}>
      <div className='pointer-events-none absolute inset-0 rounded-[inherit] rounded-tl-xs bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.34),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.16),transparent_33%)] opacity-90' />
      <div className='pointer-events-none absolute inset-[0.5px] rounded-xs border border-white/15' />
      <div className='pointer-events-none absolute inset-x-4 top-0 h-16 bg-linear-to-b from-white/28 to-transparent blur-md dark:from-white/8' />

      <NextLink
        href={productHref}
        prefetch={false}
        aria-label={`View ${product.name}`}
        className='absolute inset-0 z-10 rounded-[inherit] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background'
      />

      <div className='relative flex h-full flex-col rounded-[inherit] bg-linear-to-b from-white/18 via-white/8 to-black/8 dark:from-white/5 dark:via-white/3 dark:to-black/24'>
        <div className='relative p-[0.5px] pb-0'>
          <div className='relative flex items-center justify-center overflow-hidden rounded-xs border border-white/18 border-b-0 bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.24)] backdrop-blur-md dark:border-white/10 dark:bg-black/18'>
            <div className='pointer-events-none absolute inset-0 bg-linear-to-b from-white/14 via-transparent to-black/10' />
            {imageSrc ? (
              <img
                src={imageSrc}
                alt={product.name}
                loading='lazy'
                decoding='async'
                draggable={false}
                className='aspect-square min-w-44 rounded-xs object-cover transition-transform duration-500 group-hover:scale-[1.04] xl:min-w-64'
              />
            ) : (
              <div className='flex aspect-square h-44 min-h-48 w-auto items-center justify-center xl:min-w-64'>
                <Icon name='spinners-ring' />
              </div>
            )}
          </div>
        </div>

        <div className='flex min-h-0 flex-1 flex-col px-3 pb-3 pt-2.5'>
          <div className='relative flex min-h-[5.75rem] items-start justify-between gap-3'>
            <div className='min-w-0 flex-1 pr-22'>
              <div className='mb-0.75 h-4 md:h-5'>
                {brandLabel && (
                  <p className='truncate text-xs font-light capitalize tracking-wide text-foreground/72 md:text-sm dark:text-white/72 font-okxs'>
                    <span>{brandLabel}</span>
                    {product.productType && (
                      <span>
                        <span className='px-1 text-xs font-thin text-foreground/45 dark:text-white/45 font-okxs'>
                          &middot;
                        </span>
                        {product.productType}
                      </span>
                    )}
                  </p>
                )}
              </div>

              <h3 className='truncate text-base capitalize leading-5 text-foreground sm:text-base md:text-lg md:leading-5 lg:text-xl lg:leading-5 dark:text-white font-clash'>
                {product.name}
              </h3>

              <div className='whitespace-nowrap'>
                <div className='mt-1 flex h-4 items-center'>
                  {tierLabel !== '' && (
                    <span className='text-xs font-medium uppercase tracking-[0.2em] text-foreground/65 md:font-semibold dark:text-white/70 font-clash'>
                      {tierLabel}
                    </span>
                  )}
                </div>

                <div className='flex h-4 items-center whitespace-nowrap'>
                  {subcategoryLabel && (
                    <span className='text-xs font-light capitalize text-foreground/70 md:text-sm dark:text-white/72 font-okxs'>
                      {subcategoryLabel}
                      {(netWeightLabel || batchIdLabel) && (
                        <span className='px-1 text-xs font-thin text-foreground/45 dark:text-white/45'>
                          &middot;
                        </span>
                      )}
                    </span>
                  )}

                  {netWeightLabel && (
                    <span className='text-xs font-normal lowercase text-foreground/72 md:text-xs dark:text-white/72 font-okxs'>
                      {netWeightLabel}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className='pointer-events-none absolute right-0 top-0 overflow-hidden rounded-xs bg-white/35 px-3 py-1 text-xl leading-none text-light-brand _shadow-[inset_0_1px_0_rgba(255,255,255,0.24)] backdrop-blur-md dark:bg-black/28 dark:text-light-brand md:text-2xl'>
              {selectedOption ? (
                <span>
                  $<span className='font-black'>{selectedOption.price}</span>
                </span>
              ) : (
                '—'
              )}
            </div>
          </div>

          <div className='mt-auto pt-3'>
            <div
              className='relative z-20 mt-1.5 flex gap-x-1 rounded-xs border border-white/15 bg-black/10 backdrop-blur-md dark:border-white/10 dark:bg-black/22'
              role='group'
              aria-label='Select denomination'>
              {firstThreeOptions.map((option, index) => (
                <button
                  key={option.denominationValue}
                  type='button'
                  aria-pressed={selectedIndex === index}
                  className={cn(
                    'relative z-20 flex h-8 flex-1 items-center justify-center rounded-xs border border-transparent text-xs text-foreground/78 transition-colors md:text-sm dark:text-white/82 font-okxs font-medium',
                    selectedIndex === index
                      ? 'border-white/30 bg-white/88 text-brand dark:bg-white dark:text-brand shadow-[0_8px_20px_rgba(255,255,255,0.18)] dark:border-white/15'
                      : 'bg-white/8 hover:bg-white/24 hover:text-foreground dark:bg-sibebar/2 dark:hover:bg-sidebar/12 dark:hover:text-white',
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
              className='relative z-20 mt-2.5 w-full rounded-xs border border-light-brand/20 bg-light-brand/68 px-2 py-2.5 text-sm font-medium text-dark-table shadow-[inset_0_1px_0_rgba(255,255,255,0.24)] backdrop-blur-md transition-colors hover:bg-brand/80 disabled:cursor-not-allowed disabled:opacity-50 dark:border-light-brand/12 dark:bg-light-brand/84 dark:text-white dark:hover:bg-light-brand/64 font-okxs'
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

ProductCardGlassComponent.displayName = 'ProductCardGlass'

export const ProductCardGlass = memo(
  ProductCardGlassComponent,
  (previousProps, nextProps) =>
    previousProps.className === nextProps.className &&
    previousProps.imageUrl === nextProps.imageUrl &&
    areProductsEqual(previousProps.product, nextProps.product),
)

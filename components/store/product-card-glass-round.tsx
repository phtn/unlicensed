'use client'
/* eslint-disable @next/next/no-img-element -- recovered historical variant intentionally uses native img */

import type {StoreProduct} from '@/app/types'
import type {Id} from '@/convex/_generated/dataModel'
import {formatBrandLabel} from '@/lib/format-brand-label'
import {useAddCartItem} from '@/hooks/use-add-cart-item'
import {Icon} from '@/lib/icons'
import {getAvailableCartQuantityForDenomination} from '@/lib/productStock'
import {cn} from '@/lib/utils'
import {formatDenominationDisplay} from '@/utils/formatDenomination'
import NextLink from 'next/link'
import {memo, type MouseEvent, useMemo, useState} from 'react'

type ProductCardGlassProps = {
  product: StoreProduct
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

const ProductCardGlassRoundComponent = ({
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
      ? product.brand.map((brand) => formatBrandLabel(brand)).join(', ')
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
  const productTypeLabel = product.productType?.trim() ?? ''
  const selectedAvailableQuantity = selectedOption
    ? getAvailableCartQuantityForDenomination(
        product,
        selectedOption.denominationValue,
      )
    : 0
  const isProductUnavailable = product.available === false
  const isSelectedOptionOutOfStock =
    selectedOption !== null && selectedAvailableQuantity < 1
  const isAddToCartDisabled =
    !productId ||
    !selectedOption ||
    isProductUnavailable ||
    isSelectedOptionOutOfStock
  const addToCartLabel = !selectedOption
    ? 'Unavailable'
    : isProductUnavailable
      ? 'Unavailable'
      : isSelectedOptionOutOfStock
        ? 'Not Available'
        : 'Add to Cart'

  const handleAddToCart = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()

    if (isAddToCartDisabled || !productId || !selectedOption) return

    addItem(productId, 1, selectedOption.denominationValue)
  }

  return (
    <article
      data-product-type={productTypeLabel || undefined}
      className={cn(
        'group relative isolate h-fit min-w-48 max-w-48 overflow-hidden rounded-[1.5rem] border border-white/18 bg-white/[0.14] shadow-[0_24px_80px_rgba(15,23,42,0.22),inset_0_1px_0_rgba(255,255,255,0.22)] backdrop-blur-[28px] backdrop-saturate-150 dark:border-white/12 dark:bg-white/5 sm:min-w-80 md:min-w-72 lg:min-w-64 xl:min-w-76',
        className,
      )}>
      <div className='pointer-events-none absolute -left-8 bottom-14 size-24 rounded-full bg-white/18 blur-3xl dark:bg-white/8' />
      <div className='pointer-events-none absolute -right-10 top-6 size-32 rounded-full bg-sky-200/25 blur-3xl dark:bg-sky-100/10' />
      <div
        className={cn(
          'pointer-events-none absolute inset-0 rounded-[inherit] bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.48),transparent_34%),radial-gradient(circle_at_82%_18%,rgba(125,211,252,0.18),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.22),rgba(255,255,255,0.05)_34%,rgba(15,23,42,0.12)_100%)] opacity-95 dark:bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.16),transparent_34%),radial-gradient(circle_at_82%_18%,rgba(125,211,252,0.10),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03)_34%,rgba(2,6,23,0.36)_100%)]',
        )}
      />
      <div
        className={cn(
          'pointer-events-none absolute inset-px rounded-[1.42rem] border border-white/16 dark:border-white/10',
        )}
      />
      <div className='pointer-events-none absolute inset-x-5 top-0 h-20 bg-linear-to-b from-white/38 to-transparent blur-xl dark:from-white/10' />

      <NextLink
        href={productHref}
        prefetch={false}
        aria-label={`View ${product.name}`}
        className='absolute inset-0 z-10 rounded-[inherit] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background'
      />

      <div className='relative flex flex-col gap-2.5 rounded-[inherit] bg-linear-to-b from-white/2 via-white/08 to-white/3 p-2.5 dark:from-white/6 dark:via-white/3 dark:to-black/22'>
        <div className='relative p-[0.5px]'>
          <div className='relative flex items-center justify-center overflow-hidden rounded-[1.2rem] border border-white/18 bg-white/2 shadow-[0_16px_40px_rgba(15,23,42,0.18),inset_0_1px_0_rgba(255,255,255,0.24)] backdrop-blur-2xl dark:border-white/10 dark:bg-black/18'>
            <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.28),transparent_46%),linear-gradient(180deg,rgba(255,255,255,0.08),transparent_34%,rgba(15,23,42,0.12)_100%)]' />
            {imageSrc ? (
              <img
                src={imageSrc}
                alt={product.name}
                loading='lazy'
                decoding='async'
                draggable={false}
                className='aspect-square min-w-44 rounded-[1.15rem] object-cover transition-transform duration-500 group-hover:scale-[1.04] xl:min-w-64'
              />
            ) : (
              <div className='flex aspect-square h-44 min-h-48 w-auto items-center justify-center rounded-[1.15rem] xl:min-w-64'>
                <Icon name='spinners-ring' />
              </div>
            )}
          </div>
        </div>

        <div className='flex min-h-0 flex-1 flex-col rounded-[1.15rem] border border-white/12 bg-white/8 px-3.5 pb-3.5 pt-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/3'>
          <div className='relative flex min-h-23 items-start justify-between gap-3'>
            <div className='min-w-0 flex-1 pr-22'>
              <div className='mb-0.75 h-4 md:h-5'>
                {brandLabel && (
                  <p className='truncate text-xs font-light capitalize tracking-wide text-foreground/72 md:text-sm dark:text-white/72 font-okxs'>
                    <span>{brandLabel}</span>
                    {productTypeLabel && (
                      <span>
                        <span className='px-1 text-xs font-thin text-foreground/45 dark:text-white/45'>
                          &middot;
                        </span>
                        {productTypeLabel}
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

            <div
              className={cn(
                'pointer-events-none absolute right-0 top-0 overflow-hidden rounded-2xl border border-white/28 bg-white/48 px-3 py-1.5 text-xl leading-none text-sky-950 shadow-[0_12px_32px_rgba(148,163,184,0.2),inset_0_1px_0_rgba(255,255,255,0.44)] backdrop-blur-2xl dark:border-white/16 dark:bg-white/12 dark:text-white md:text-2xl',
              )}>
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
              className='relative z-20 mt-1.5 flex gap-x-1 rounded-[1rem] border border-white/14 bg-white/8 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-2xl dark:border-white/10 dark:bg-black/18'
              role='group'
              aria-label='Select denomination'>
              {firstThreeOptions.map((option, index) => (
                <button
                  key={option.denominationValue}
                  type='button'
                  aria-pressed={selectedIndex === index}
                  className={cn(
                    'relative z-20 flex h-8 flex-1 items-center justify-center rounded-[0.85rem] border border-transparent text-xs text-foreground/78 transition-colors md:text-sm dark:text-white/82 font-okxs font-medium',
                    selectedIndex === index
                      ? 'border-white/38 bg-white/92 text-slate-900 shadow-[0_8px_20px_rgba(255,255,255,0.2)] dark:border-white/18 dark:bg-white/90 dark:text-slate-900'
                      : 'bg-white/4 hover:bg-white/16 hover:text-foreground dark:bg-sidebar/2 dark:hover:bg-sidebar/12 dark:hover:text-white',
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
              aria-label={
                selectedOption
                  ? `Add ${product.name} ${selectedOption.denom} to cart`
                  : `Add ${product.name} to cart`
              }
              className={cn(
                'relative z-20 mt-2.5 w-full rounded-[1rem] px-2 py-2.5 text-sm font-medium shadow-[0_18px_36px_rgba(15,23,42,0.12),inset_0_1px_0_rgba(255,255,255,0.52)] backdrop-blur-2xl transition-colors disabled:cursor-not-allowed disabled:opacity-50 font-okxs',
                'border border-white/28 bg-linear-to-b from-white/90 via-white/72 to-white/48 text-slate-900 hover:from-white/96 hover:via-white/80 hover:to-white/58 dark:border-white/16 dark:bg-linear-to-b dark:from-white/28 dark:via-white/18 dark:to-white/12 dark:text-white dark:hover:from-white/34 dark:hover:via-white/24 dark:hover:to-white/16',
              )}
              disabled={isAddToCartDisabled}
              onClick={handleAddToCart}>
              {addToCartLabel}
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

ProductCardGlassRoundComponent.displayName = 'ProductCardGlassRound'

export const ProductCardGlassRound = memo(
  ProductCardGlassRoundComponent,
  (previousProps, nextProps) =>
    previousProps.className === nextProps.className &&
    previousProps.imageUrl === nextProps.imageUrl &&
    areProductsEqual(previousProps.product, nextProps.product),
)

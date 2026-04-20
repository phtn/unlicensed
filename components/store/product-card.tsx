'use client'

import type {StoreProduct} from '@/app/types'
import type {Id} from '@/convex/_generated/dataModel'
import {useAddCartItem} from '@/hooks/use-add-cart-item'
import {Icon} from '@/lib/icons'
import {getAvailableCartQuantityForDenomination} from '@/lib/productStock'
import {cn} from '@/lib/utils'
import {formatDenominationDisplay} from '@/utils/formatDenomination'
import NextImage from '@/components/ui/app-image'
import NextLink from 'next/link'
import {memo, type MouseEvent, useMemo, useState} from 'react'
import {CrossOut} from './cross-out'

type ProductCardProps = {
  product: StoreProduct
  /** Resolved image URL; when provided, used instead of product.image (e.g. when product.image is a storage ID) */
  imageUrl?: string | null
  className?: string
  matchImageHeight?: boolean
}

type PriceOption = {
  price: string
  denom: string
  denominationValue: number
  originalPrice?: string
  isOnSale: boolean
}

const EMPTY_PRICE_OPTIONS: PriceOption[] = []
const PRODUCT_CARD_IMAGE_SIZES =
  '(min-width: 1536px) 19rem, (min-width: 1280px) 17rem, (min-width: 1024px) 15rem, (min-width: 640px) 38vw, 75vw'

const formatPrice = (priceCents: number) => {
  const dollars = priceCents / 100
  return dollars % 1 === 0 ? `${dollars.toFixed(0)}` : `${dollars.toFixed(2)}`
}

const getDenominationCents = (
  priceMap: Record<string, number> | undefined,
  denomination: number,
) => {
  if (!priceMap) return undefined

  const exact = priceMap[String(denomination)]
  if (typeof exact === 'number') return exact

  const matched = Object.entries(priceMap).find(
    ([key]) => Number(key) === denomination,
  )

  return matched?.[1]
}

/** Builds price options; 1 oz is displayed as "Oz" (no space), other oz/units via formatDenominationDisplay. */
const priceOptionsFromDenomination = (
  priceByDenomination: Record<string, number> | undefined,
  salePriceByDenomination: Record<string, number> | undefined,
  availableDenominations: readonly number[] | undefined,
  basePriceCents: number | undefined,
  unit: string,
  onSale: boolean,
): PriceOption[] | null => {
  if (!availableDenominations || availableDenominations.length === 0) {
    return null
  }

  const seenDenominations = new Set<number>()
  const entries = availableDenominations.flatMap((denomination) => {
    if (
      !Number.isFinite(denomination) ||
      denomination <= 0 ||
      seenDenominations.has(denomination)
    ) {
      return []
    }

    seenDenominations.add(denomination)

    const cents =
      getDenominationCents(priceByDenomination, denomination) ??
      basePriceCents ??
      0
    if (cents <= 0) {
      return []
    }

    return [{denomination, cents}]
  })

  if (entries.length === 0) return null

  return entries.map(({denomination, cents}) => {
    const saleCents = getDenominationCents(
      salePriceByDenomination,
      denomination,
    )
    const hasSalePrice =
      onSale &&
      typeof saleCents === 'number' &&
      saleCents >= 0 &&
      saleCents < cents

    return {
      price: formatPrice(hasSalePrice ? saleCents : cents),
      denom: formatDenominationDisplay(String(denomination), unit),
      denominationValue: denomination,
      originalPrice: hasSalePrice ? formatPrice(cents) : undefined,
      isOnSale: hasSalePrice,
    }
  })
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

const areNumberArraysEqual = (
  left?: readonly number[],
  right?: readonly number[],
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
  left.onSale === right.onSale &&
  left.available === right.available &&
  left.stock === right.stock &&
  left.inventoryMode === right.inventoryMode &&
  left.masterStockQuantity === right.masterStockQuantity &&
  left.masterStockUnit === right.masterStockUnit &&
  left.productType === right.productType &&
  left.productTier === right.productTier &&
  left.productTierLabel === right.productTierLabel &&
  left.subcategory === right.subcategory &&
  left.netWeight === right.netWeight &&
  left.netWeightUnit === right.netWeightUnit &&
  left.packSize === right.packSize &&
  left.unit === right.unit &&
  areNumberArraysEqual(
    left.availableDenominations,
    right.availableDenominations,
  ) &&
  areStringArraysEqual(left.brand, right.brand) &&
  arePriceMapsEqual(left.stockByDenomination, right.stockByDenomination) &&
  arePriceMapsEqual(left.priceByDenomination, right.priceByDenomination) &&
  arePriceMapsEqual(left.salePriceByDenomination, right.salePriceByDenomination)

const isRenderableImageSrc = (value: string | null | undefined) =>
  typeof value === 'string' &&
  (value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('/') ||
    value.startsWith('data:') ||
    value.startsWith('blob:'))

type ProductPriceProps = {
  option: PriceOption | null
  variant: 'compact' | 'default'
}

const ProductPrice = ({option, variant}: ProductPriceProps) => {
  if (!option) {
    return <span className='text-sm text-white/60'>—</span>
  }

  const isCompact = variant === 'compact'

  return (
    <div className='flex flex-col-reverse items-end leading-none text-right'>
      {isCompact ? (
        <span className='font-medium tracking-tighter text-[1.45rem] text-light-brand sm:text-[1.75rem]'>
          <span className='font-bone'>${option.price}</span>
        </span>
      ) : (
        <div className='flex items-center font-clash font-light leading-none tracking-tighter text-[1.65rem] text-transparent bg-clip-text bg-linear-to-r from-foreground/80 via-light-brand to-light-brand'>
          <span className='pr-px text-[1.40rem]'>$</span>
          <span className='drop-shadow-2xs'>{option.price}</span>
        </div>
      )}
      {option.isOnSale && option.originalPrice ? (
        <div className='bg-background/80 dark:bg-foreground/30 relative flex leading-none items-center justify-center px-1.5 h-7'>
          <span
            className={cn(
              'font-clash font-medium text-foreground',
              isCompact ? 'text-[0.65rem] sm:text-base' : 'text-lg md:text-xl',
            )}>
            <span className='pr-px text-lg sm:text-lg'>$</span>
            {option.originalPrice}
          </span>
          <CrossOut
            className={cn(
              isCompact
                ? 'h-3 sm:h-3.5'
                : 'size-11 md:size-14 -mt-0.75 md:-mt-1',
            )}
            pathClassName='stroke-light-brand/80 dark:stroke-light-brand/80'
          />
        </div>
      ) : null}
    </div>
  )
}

const ProductCardComponent = ({
  product,
  imageUrl: imageUrlProp,
  className,
  matchImageHeight = false,
}: ProductCardProps) => {
  const addItem = useAddCartItem()
  const [selectedIndex, setSelectedIndex] = useState(0)

  const {
    packSizeLabel,
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
        product.salePriceByDenomination,
        product.availableDenominations,
        product.priceCents,
        product.unit,
        product.onSale,
      )?.slice(0, 3) ?? EMPTY_PRICE_OPTIONS

    return {
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
      packSizeLabel: product.packSize?.toString() ?? '',
    }
  }, [
    product.packSize,
    product.availableDenominations,
    product.brand,
    product.netWeight,
    product.netWeightUnit,
    product.onSale,
    product.priceCents,
    product.priceByDenomination,
    product.salePriceByDenomination,
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
  const hasSaleOption = firstThreeOptions.some((option) => option.isOnSale)
  const imageSrc = isRenderableImageSrc(imageUrlProp)
    ? imageUrlProp
    : isRenderableImageSrc(product.image)
      ? product.image
      : undefined
  const productId = product._id as Id<'products'> | undefined
  const hasMetaBeforePackSize = subcategoryLabel !== '' || netWeightLabel !== ''
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

  if (matchImageHeight) {
    return (
      <article
        data-product-type={productTypeLabel || undefined}
        className={cn(
          'group relative aspect-square min-w-48 max-w-48 overflow-hidden rounded-xs bg-sidebar shadow-sm dark:bg-black sm:min-w-80 md:min-w-72 lg:min-w-64 xl:min-w-76',
          className,
        )}>
        <NextLink
          href={productHref}
          prefetch={false}
          aria-label={`View ${product.name}`}
          className='absolute inset-0 z-10 rounded-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background'
        />

        <div className='relative h-full'>
          <div className='absolute inset-0 overflow-hidden rounded-xs bg-sidebar/40 dark:bg-dark-table/40'>
            {hasSaleOption ? (
              <div className='pointer-events-none absolute right-2 top-2 z-20 overflow-hidden rounded-xs bg-terpenes px-2.5 py-1 shadow-[0_0_20px_rgba(29,155,125,0.25)]'>
                <p className='text-xs font-ios uppercase tracking-widest text-white'>
                  On Sale
                </p>
              </div>
            ) : null}
            {imageSrc ? (
              <NextImage
                src={imageSrc}
                alt={product.name}
                fill
                quality={70}
                loading='lazy'
                sizes={PRODUCT_CARD_IMAGE_SIZES}
                className='object-cover transition-transform duration-300 group-hover:scale-[1.03]'
              />
            ) : (
              <div className='flex h-full w-full items-center justify-center'>
                <Icon name='spinners-ring' />
              </div>
            )}
          </div>

          <div className='pointer-events-none absolute inset-x-0 bottom-0 z-10 h-40 bg-linear-to-t from-black via-black/78 to-transparent' />

          <div className='relative z-20 flex h-full flex-col justify-end px-2 pb-2 text-white'>
            <section
              id='info-details'
              className='relative flex shrink-0 items-start justify-between overflow-hidden pb-2'>
              <div className='min-w-0 flex-1'>
                <div>
                  <div>
                    {brandLabel && (
                      <div className='mb-0.5 h-4 truncate text-base font-okxs font-light capitalize tracking-wide opacity-80'>
                        <span className='font-light'>{brandLabel}</span>
                        {productTypeLabel && (
                          <span>
                            <span className='px-1 text-sm font-thin opacity-70 font-okxs'>
                              &middot;
                            </span>
                            {productTypeLabel}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <NextLink
                    href={productHref}
                    prefetch={false}
                    className='relative z-20 inline-flex min-h-6 max-w-full items-center py-1 text-left pointer-events-auto'>
                    <h3 className='truncate capitalize leading-5 font-clash text-base sm:text-lg'>
                      {product.name}
                    </h3>
                  </NextLink>
                </div>

                <div className='flex items-center justify-between relative top-1'>
                  <div className='whitespace-nowrap pr-16 sm:pr-20'>
                    <div className='mt-0.5 flex h-4 items-center'>
                      {tierLabel !== '' && (
                        <span className='text-[8px] font-okxs font-medium uppercase tracking-widest opacity-75 sm:text-xs'>
                          {tierLabel}
                        </span>
                      )}
                    </div>

                    <div className='flex h-4 items-center whitespace-nowrap'>
                      {subcategoryLabel && (
                        <span className='text-[8px] font-okxs font-light capitalize opacity-85 sm:text-sm'>
                          {subcategoryLabel}
                          {netWeightLabel && (
                            <span className='px-1 text-xs font-thin opacity-70'>
                              &middot;
                            </span>
                          )}
                        </span>
                      )}

                      {netWeightLabel && (
                        <span className='text-[8px] font-okxs font-normal lowercase opacity-85 sm:text-xs'>
                          {netWeightLabel}
                        </span>
                      )}

                      {packSizeLabel && (
                        <span className='text-[8px] font-okxs font-normal lowercase opacity-85 sm:text-xs'>
                          {hasMetaBeforePackSize && (
                            <span className='px-1 text-xs font-thin opacity-85'>
                              &middot;
                            </span>
                          )}
                          <span>{packSizeLabel} pk</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className='pointer-events-none absolute right-0 top-0 flex min-w-0 items-start justify-end font-medium'>
                    <ProductPrice option={selectedOption} variant='compact' />
                  </div>
                </div>
              </div>
            </section>

            <section className='flex w-full flex-col'>
              <div
                role='group'
                className='flex h-10 gap-x-1'
                aria-label='Select denomination'>
                {firstThreeOptions.map((option, index) => (
                  <button
                    key={option.denominationValue}
                    type='button'
                    aria-label={`Select ${option.denom}`}
                    aria-pressed={
                      selectedOption?.denominationValue ===
                      option.denominationValue
                    }
                    className={cn(
                      'relative z-20 flex h-10 flex-1 items-center justify-center bg-white/14 text-xs text-white font-okxs backdrop-blur-sm transition-colors duration-300',
                      selectedOption?.denominationValue ===
                        option.denominationValue
                        ? 'bg-white text-brand hover:bg-white/85'
                        : 'hover:bg-white/28',
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
                className='relative z-20 mt-1.25 rounded-xs bg-brand px-3 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-light-brand active:bg-brand disabled:cursor-not-allowed disabled:opacity-50'
                disabled={isAddToCartDisabled}
                onClick={handleAddToCart}>
                <div className='group-active:scale-94 transition-transform duration-200 disabled:opacity-50'>
                  {addToCartLabel}
                </div>
              </button>
            </section>
          </div>
        </div>
      </article>
    )
  }

  return (
    <article
      data-product-type={productTypeLabel || undefined}
      className={cn(
        'group relative h-fit _md:h-[340.01px] _md:min-h-[340.01px] _md:max-h-[340.01px] min-w-48 max-w-48 overflow-hidden rounded-xs bg-sidebar shadow-sm dark:bg-black sm:min-w-80 md:min-w-72 lg:min-w-64 xl:min-w-76',
        className,
      )}>
      <NextLink
        href={productHref}
        prefetch={false}
        aria-label={`View ${product.name}`}
        className='absolute inset-0 z-10 rounded-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background'
      />

      <div className='flex flex-col h-fit'>
        <div className='relative flex items-center justify-center overflow-hidden rounded-xs bg-sidebar/40 dark:bg-dark-table/40'>
          {hasSaleOption ? (
            <div className='pointer-events-none absolute right-2 top-2 z-20 overflow-hidden rounded-xs bg-terpenes px-2.5 py-1 shadow-[0_0_20px_rgba(29,155,125,0.25)]'>
              <p className='text-xs font-ios uppercase tracking-widest text-white'>
                On Sale
              </p>
            </div>
          ) : null}
          {imageSrc ? (
            <NextImage
              src={imageSrc}
              alt={product.name}
              width={512}
              height={512}
              quality={70}
              sizes={PRODUCT_CARD_IMAGE_SIZES}
              className='aspect-square! min-w-44 rounded-xs object-cover transition-transform duration-300 group-hover:scale-[1.03] xl:min-w-64'
            />
          ) : (
            <div className='flex aspect-square h-44 min-h-48 w-auto items-center justify-center xl:min-w-64'>
              <Icon name='spinners-ring' />
            </div>
          )}
        </div>

        <div className='flex flex-col border-0 border-orange-300 h-fit'>
          <section
            id='info-details'
            className='relative flex shrink-0 items-start justify-between h-28 overflow-hidden bg-amber-200/0 p-2'>
            <div className='min-w-0 flex-1'>
              <div>
                <div className='h-4 md:h-5'>
                  {brandLabel && (
                    <div className='mb-1 md:mb-0.5 h-4 md:h-5 truncate text-xs md:text-sm font-okxs font-light capitalize tracking-wide opacity-75'>
                      <span className='font-light'>{brandLabel}</span>
                      {productTypeLabel && (
                        <span>
                          <span className='px-1 text-sm font-thin opacity-80 font-okxs'>
                            &middot;
                          </span>
                          {productTypeLabel}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <NextLink
                  href={productHref}
                  prefetch={false}
                  className='relative z-20 inline-flex min-h-6 max-w-full items-center pt-0.5 text-left pointer-events-auto'>
                  <h3 className='line-clamp-2 capitalize leading-5 font-clash text-lg md:leading-4 lg:text-base lg:leading-4'>
                    {product.name}
                  </h3>
                </NextLink>
              </div>

              <div className='flex items-center justify-between relative top-1'>
                <div className='whitespace-nowrap pr-16 md:space-y-0.5 md:pr-20'>
                  <div className='md:mt-0.5 flex h-4 items-center'>
                    {tierLabel !== '' && (
                      <span className='text-[8px] md:text-xs md:font-medium font-okxs font-medium uppercase tracking-widest opacity-70 dark:text-alum dark:opacity-100'>
                        {tierLabel}
                      </span>
                    )}
                  </div>

                  <div className='flex h-4 items-center whitespace-nowrap'>
                    {subcategoryLabel && (
                      <span className='text-[8px] sm:text-[8px] font-light capitalize opacity-80 dark:text-alum dark:opacity-100 md:text-sm font-okxs'>
                        {subcategoryLabel}
                        {netWeightLabel && (
                          <span className='px-1 text-xs font-thin opacity-80'>
                            &middot;
                          </span>
                        )}
                      </span>
                    )}

                    {netWeightLabel && (
                      <span className='text-[8px] sm:text-xs font-normal lowercase opacity-80 dark:text-alum dark:opacity-100 md:text-xs font-okxs'>
                        {netWeightLabel}
                      </span>
                    )}

                    {packSizeLabel && (
                      <span className='text-[8px] sm:text-xs font-normal lowercase opacity-80 dark:text-alum dark:opacity-100 md:text-xs font-okxs'>
                        {hasMetaBeforePackSize && (
                          <span className='px-1 text-xs font-thin opacity-80'>
                            &middot;
                          </span>
                        )}
                        <span>{packSizeLabel} pk</span>
                      </span>
                    )}
                  </div>
                </div>
                <div className='pointer-events-none absolute right-0 top-0 flex min-w-0 items-start justify-end font-medium'>
                  <ProductPrice option={selectedOption} variant='default' />
                </div>
              </div>
            </div>
          </section>

          <section className='mt-auto flex w-full flex-col bg-dark-table dark:bg-black'>
            <div
              role='group'
              className='mt-1.5 flex h-10 gap-x-1 md:gap-x-1.25'
              aria-label='Select denomination'>
              {firstThreeOptions.map((option, index) => (
                <button
                  key={option.denominationValue}
                  type='button'
                  aria-label={`Select ${option.denom}`}
                  aria-pressed={
                    selectedOption?.denominationValue ===
                    option.denominationValue
                  }
                  className={cn(
                    'relative z-20 flex h-10 flex-1 items-center justify-center bg-sidebar/50 text-xs md:text-sm text-white dark:bg-dark-table font-okxs',
                    'transition-colors duration-300',
                    selectedOption?.denominationValue ===
                      option.denominationValue
                      ? 'bg-white text-brand hover:bg-sidebar/80 dark:bg-white/90 dark:hover:bg-white/75'
                      : 'hover:bg-white/85 hover:text-light-brand dark:hover:bg-white/80',
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
              className='relative z-20 mt-1.25 rounded-xs bg-brand px-3 py-3 text-sm font-medium text-white transition-colors duration-200 hover:bg-light-brand active:bg-brand disabled:cursor-not-allowed disabled:opacity-50'
              disabled={isAddToCartDisabled}
              onClick={handleAddToCart}>
              <div className='group-active:scale-94 transition-transform duration-200'>
                {addToCartLabel}
              </div>
            </button>
          </section>
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
    previousProps.matchImageHeight === nextProps.matchImageHeight &&
    previousProps.imageUrl === nextProps.imageUrl &&
    areProductsEqual(previousProps.product, nextProps.product),
)

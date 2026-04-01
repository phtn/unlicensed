'use client'

import type {StoreProduct} from '@/app/types'
import type {Id} from '@/convex/_generated/dataModel'
import {useAddCartItem} from '@/hooks/use-add-cart-item'
import {Icon} from '@/lib/icons'
import {isTestProductType, TEST_PRODUCT_TYPE} from '@/lib/product-type'
import {cn} from '@/lib/utils'
import {formatDenominationDisplay} from '@/utils/formatDenomination'
import {Tooltip} from '@heroui/react'
import NextImage from 'next/image'
import NextLink from 'next/link'
import {memo, type MouseEvent, useMemo, useState} from 'react'
import ShimmerText from '../expermtl/shimmer'

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
}

const EMPTY_PRICE_OPTIONS: PriceOption[] = []
const PRODUCT_CARD_IMAGE_SIZES =
  '(min-width: 1536px) 19rem, (min-width: 1280px) 17rem, (min-width: 1024px) 15rem, (min-width: 640px) 38vw, 75vw'

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
  left.packSize === right.packSize &&
  left.unit === right.unit &&
  areStringArraysEqual(left.brand, right.brand) &&
  arePriceMapsEqual(left.priceByDenomination, right.priceByDenomination)

const isRenderableImageSrc = (value: string | null | undefined) =>
  typeof value === 'string' &&
  (value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('/') ||
    value.startsWith('data:') ||
    value.startsWith('blob:'))

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
        product.unit,
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
  const imageSrc = isRenderableImageSrc(imageUrlProp)
    ? imageUrlProp
    : isRenderableImageSrc(product.image)
      ? product.image
      : undefined
  const productId = product._id as Id<'products'> | undefined
  const hasMetaBeforePackSize = subcategoryLabel !== '' || netWeightLabel !== ''
  const productTypeLabel = product.productType?.trim() ?? ''
  const isTestProduct = isTestProductType(productTypeLabel)

  const handleAddToCart = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()

    if (!productId || !selectedOption) return

    addItem(productId, 1, selectedOption.denominationValue)
  }

  const isDemoProduct = brandLabel.toLowerCase().includes('test')

  if (matchImageHeight) {
    return (
      <article
        data-product-type={productTypeLabel || undefined}
        data-test-product={isTestProduct ? 'true' : undefined}
        className={cn(
          'group relative aspect-square min-w-48 max-w-48 overflow-hidden rounded-xs bg-sidebar shadow-sm dark:bg-black sm:min-w-80 md:min-w-72 lg:min-w-64 xl:min-w-76',
          isTestProduct &&
            'border border-orange-300/55 shadow-[0_0_0_1px_rgba(249,115,22,0.22),0_0_28px_rgba(249,115,22,0.18)] dark:border-orange-300/45',
          className,
        )}>
        {isTestProduct ? (
          <>
            <div className='pointer-events-none absolute inset-px z-0 rounded-xs border border-orange-200/35 dark:border-orange-200/20' />
            <div className='pointer-events-none absolute inset-x-6 top-0 z-0 h-px bg-linear-to-r from-transparent via-orange-300/90 to-transparent shadow-[0_0_18px_rgba(251,146,60,0.75)]' />
            <div className='pointer-events-none absolute inset-y-10 right-0 z-0 w-px bg-linear-to-b from-transparent via-orange-300/70 to-transparent shadow-[0_0_18px_rgba(251,146,60,0.65)]' />
          </>
        ) : null}
        <NextLink
          href={productHref}
          prefetch={false}
          aria-label={`View ${product.name}`}
          className='absolute inset-0 z-10 rounded-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background'
        />

        <div className='relative h-full'>
          <div
            className={cn(
              'absolute inset-0 overflow-hidden rounded-xs bg-sidebar/40 dark:bg-dark-table/40',
              isTestProduct &&
                'border-b border-orange-300/60 bg-[radial-gradient(circle_at_top_left,rgba(251,146,60,0.22),transparent_42%),linear-gradient(180deg,rgba(154,52,18,0.18),transparent_52%)] dark:border-orange-300/40',
            )}>
            {isTestProduct ? (
              <>
                <div className='pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(135deg,rgba(251,146,60,0.18),transparent_38%,rgba(234,88,12,0.16)_100%)] mix-blend-screen' />
                <div className='pointer-events-none absolute inset-0 z-10 opacity-70 bg-[linear-gradient(180deg,rgba(255,237,213,0.16)_0%,transparent_22%,transparent_78%,rgba(251,146,60,0.18)_100%)]' />
                <div className='pointer-events-none absolute left-2 top-2 z-20 overflow-hidden rounded-xs border border-orange-300/75 bg-[linear-gradient(135deg,rgba(249,115,22,0.94),rgba(124,45,18,0.94))] px-2.5 py-1 shadow-[0_0_20px_rgba(249,115,22,0.3)] backdrop-blur-md'>
                  <div className='absolute inset-x-0 top-0 h-px bg-orange-100/80' />
                  <p className=' text-xs font-ios uppercase tracking-widest text-orange-50'>
                    {TEST_PRODUCT_TYPE}
                  </p>
                </div>
              </>
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
                      <p className='mb-0.5 h-4 truncate text-[9px] font-okxs font-light capitalize tracking-wide opacity-80'>
                        <span
                          className={cn('font-light', {
                            'font-bone font-normal text-sm tracking-widest uppercase text-orange-200 -mt-2':
                              isDemoProduct,
                          })}>
                          {isDemoProduct ? (
                            <div className='bg-black pb-3 h-fit -translate-y-3 relative z-8888'>
                              <ShimmerText text={'Demo'} surface='light' />
                            </div>
                          ) : (
                            brandLabel
                          )}
                        </span>
                        {productTypeLabel && !isTestProduct && (
                          <span>
                            <span className='px-1 text-[8px] font-thin opacity-70 font-okxs'>
                              &middot;
                            </span>
                            {productTypeLabel}
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                  <Tooltip
                    content={product.name}
                    placement='top'
                    className='border-light-brand border'>
                    <NextLink
                      href={productHref}
                      prefetch={false}
                      className='relative z-20 inline-flex min-h-6 max-w-full items-center py-1 text-left pointer-events-auto'>
                      <h3 className='truncate capitalize leading-5 font-clash text-base sm:text-lg'>
                        {product.name}
                      </h3>
                    </NextLink>
                  </Tooltip>
                </div>

                <div className='flex items-center justify-between relative top-1'>
                  <div className='whitespace-nowrap'>
                    <div className='mt-0.5 flex h-4 items-center'>
                      {tierLabel !== '' && (
                        <span className='text-[8px] font-okxs font-medium uppercase tracking-widest opacity-75 sm:text-xs'>
                          {isDemoProduct ? 'For testing' : tierLabel}
                        </span>
                      )}
                    </div>

                    <div className='flex h-4 items-center whitespace-nowrap'>
                      {subcategoryLabel && (
                        <span
                          className={cn(
                            'text-[8px] font-okxs font-light capitalize opacity-85 sm:text-xs',
                            {'text-[9px]! font-medium': isDemoProduct},
                          )}>
                          {isDemoProduct ? ' USE ONLY' : subcategoryLabel}
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
                  <div className='pointer-events-none absolute right-0 flex aspect-square grow-0 items-center justify-end overflow-hidden font-medium'>
                    {selectedOption ? (
                      <span
                        className={cn(
                          'font-medium tracking-tighter text-[1.45rem] text-light-brand sm:text-[1.75rem]',
                          isTestProduct &&
                            'text-cyan-300 drop-shadow-[0_0_12px_rgba(34,211,238,0.22)]',
                        )}>
                        ${selectedOption.price}
                      </span>
                    ) : (
                      '—'
                    )}
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
                    aria-pressed={selectedIndex === index}
                    className={cn(
                      'relative z-20 flex h-10 flex-1 items-center justify-center bg-white/14 text-xs text-white font-okxs backdrop-blur-sm transition-colors duration-300',
                      selectedIndex === index
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
                className={cn(
                  'relative z-20 mt-1.25 rounded-xs px-3 py-2 text-sm font-medium transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50',
                  isTestProduct
                    ? 'border border-cyan-300/60 bg-cyan-700 text-slate-950 shadow-[0_0_18px_rgba(34,211,238,0.24)] hover:bg-cyan-400 active:bg-cyan-600 dark:border-cyan-300/40 dark:bg-cyan-600 dark:text-white dark:hover:bg-cyan-500 dark:active:bg-cyan-500'
                    : 'bg-brand text-white hover:bg-light-brand active:bg-brand',
                )}
                disabled={!productId || !selectedOption}
                onClick={handleAddToCart}>
                <div className='group-active:scale-94 transition-transform duration-200'>
                  Add to Cart
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
      data-test-product={isTestProduct ? 'true' : undefined}
      className={cn(
        'group relative h-fit _md:h-[340.01px] _md:min-h-[340.01px] _md:max-h-[340.01px] min-w-48 max-w-48 overflow-hidden rounded-xs bg-sidebar shadow-sm dark:bg-black sm:min-w-80 md:min-w-72 lg:min-w-64 xl:min-w-76',
        isTestProduct &&
          'border border-orange-300/55 shadow-[0_0_0_1px_rgba(249,115,22,0.22),0_0_28px_rgba(249,115,22,0.18)] dark:border-orange-300/45',
        className,
      )}>
      {isTestProduct ? (
        <>
          <div className='pointer-events-none absolute inset-px z-0 rounded-xs border border-orange-200/35 dark:border-orange-200/20' />
          <div className='pointer-events-none absolute inset-x-6 top-0 z-0 h-px bg-linear-to-r from-transparent via-orange-300/90 to-transparent shadow-[0_0_18px_rgba(251,146,60,0.75)]' />
          <div className='pointer-events-none absolute inset-y-10 right-0 z-0 w-px bg-linear-to-b from-transparent via-orange-300/70 to-transparent shadow-[0_0_18px_rgba(251,146,60,0.65)]' />
        </>
      ) : null}
      <NextLink
        href={productHref}
        prefetch={false}
        aria-label={`View ${product.name}`}
        className='absolute inset-0 z-10 rounded-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background'
      />

      <div className='flex flex-col h-fit'>
        <div
          className={cn(
            'relative flex items-center justify-center overflow-hidden rounded-xs bg-sidebar/40 dark:bg-dark-table/40',
            isTestProduct &&
              'border-b border-orange-300/60 bg-[radial-gradient(circle_at_top_left,rgba(251,146,60,0.22),transparent_42%),linear-gradient(180deg,rgba(154,52,18,0.18),transparent_52%)] dark:border-orange-300/40',
          )}>
          {isTestProduct ? (
            <>
              <div className='pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(135deg,rgba(251,146,60,0.18),transparent_38%,rgba(234,88,12,0.16)_100%)] mix-blend-screen' />
              <div className='pointer-events-none absolute inset-0 z-10 opacity-70 bg-[linear-gradient(180deg,rgba(255,237,213,0.16)_0%,transparent_22%,transparent_78%,rgba(251,146,60,0.18)_100%)]' />
              <div className='pointer-events-none absolute left-2 top-2 z-20 overflow-hidden rounded-xs border border-orange-300/75 bg-[linear-gradient(135deg,rgba(249,115,22,0.94),rgba(124,45,18,0.94))] px-2.5 py-1 shadow-[0_0_20px_rgba(249,115,22,0.3)] backdrop-blur-md'>
                <div className='absolute inset-x-0 top-0 h-px bg-orange-100/80' />
                <p className=' text-xs font-ios uppercase tracking-widest text-orange-50'>
                  {TEST_PRODUCT_TYPE}
                </p>
              </div>
            </>
          ) : null}
          {imageSrc ? (
            <NextImage
              src={imageSrc}
              alt={product.name}
              width={512}
              height={512}
              quality={70}
              sizes={PRODUCT_CARD_IMAGE_SIZES}
              className='aspect-square min-w-44 rounded-xs object-cover transition-transform duration-300 group-hover:scale-[1.03] xl:min-w-64'
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
            className='relative flex shrink-0 items-start justify-between  sm:h-28 md:h-28 overflow-hidden bg-amber-200/0 p-2'>
            <div className='min-w-0 flex-1'>
              <div>
                <div className=''>
                  {brandLabel && (
                    <p className='mb-1 md:mb-0.5 h-4 md:h-5 truncate text-[9px] md:text-xs font-okxs font-light capitalize tracking-wide opacity-75'>
                      <span
                        className={cn('font-light', {
                          'font-bone font-normal text-sm tracking-widest uppercase dark:text-orange-300 -mt-2':
                            isDemoProduct,
                        })}>
                        {isDemoProduct ? (
                          <div className='bg-black pb-3 h-fit -translate-y-3 relative z-8888'>
                            <ShimmerText text={'Demo'} surface='light' />
                          </div>
                        ) : (
                          brandLabel
                        )}
                      </span>
                      {productTypeLabel && !isTestProduct && (
                        <span>
                          <span className='px-1 text-[8px] font-thin opacity-80 font-okxs'>
                            &middot;
                          </span>
                          {productTypeLabel}
                        </span>
                      )}
                    </p>
                  )}
                </div>
                {/*{isTestProduct ? (
                  <div className='mb-1 flex items-center gap-2'>
                    <span className='h-px w-4 bg-cyan-400/70 shadow-[0_0_12px_rgba(34,211,238,0.7)]' />
                    <span className='font-okxs text-[9px] uppercase tracking-[0.24em] text-cyan-500 dark:text-cyan-300'>
                      Test Product
                    </span>
                  </div>
                ) : null}*/}
                <Tooltip
                  content={product.name}
                  placement='top'
                  className='border-light-brand border'>
                  <NextLink
                    href={productHref}
                    prefetch={false}
                    className='relative z-20 inline-flex min-h-6 max-w-full items-center py-1 text-left pointer-events-auto'>
                    <h3 className='truncate capitalize leading-5 font-clash text-lg md:leading-5 lg:text-base lg:leading-5'>
                      {product.name}
                    </h3>
                  </NextLink>
                </Tooltip>
              </div>

              <div className='flex items-center justify-between relative top-1'>
                <div className='whitespace-nowrap'>
                  <div className='mt-0.5 flex h-4 items-center'>
                    {tierLabel !== '' && (
                      <span className='text-[8px] md:text-xs md:font-medium font-okxs font-medium uppercase tracking-widest opacity-70 dark:text-alum dark:opacity-100'>
                        {isDemoProduct ? 'For testing' : tierLabel}
                      </span>
                    )}
                  </div>

                  <div className='flex h-4 items-center whitespace-nowrap'>
                    {subcategoryLabel && (
                      <span
                        className={cn(
                          'text-[8px] sm:text-xs font-light capitalize opacity-80 dark:text-alum dark:opacity-100 md:text-sm font-okxs',
                          {'text-[9px]! md:font-medium': isDemoProduct},
                        )}>
                        {isDemoProduct ? ' USE ONLY' : subcategoryLabel}
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
                <div className='pointer-events-none absolute right-0 flex aspect-square font-medium h-auto grow-0 items-center justify-end overflow-hidden'>
                  {selectedOption ? (
                    <span>
                      <span
                        className={cn(
                          'font-medium tracking-tighter text-[1.75rem] text-light-brand',
                          isTestProduct &&
                            'text-cyan-600 drop-shadow-[0_0_12px_rgba(34,211,238,0.22)] dark:text-cyan-300',
                        )}>
                        ${selectedOption.price}
                      </span>
                    </span>
                  ) : (
                    '—'
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className='mt-auto flex w-full flex-col bg-dark-table dark:bg-black'>
            <div
              role='group'
              className='mt-1.5 flex h-10 gap-x-1 md:gap-x-1.5'
              aria-label='Select denomination'>
              {firstThreeOptions.map((option, index) => (
                <button
                  key={option.denominationValue}
                  type='button'
                  aria-label={`Select ${option.denom}`}
                  aria-pressed={selectedIndex === index}
                  className={cn(
                    'relative z-20 flex h-10 flex-1 items-center justify-center bg-sidebar/50 text-xs md:text-sm text-white dark:bg-dark-table font-okxs',
                    'transition-colors duration-300',
                    selectedIndex === index
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
              className={cn(
                'relative z-20 mt-1.25 rounded-xs px-3 py-2 text-sm font-medium transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50',
                isTestProduct
                  ? 'border border-cyan-300/60 bg-cyan-700 text-slate-950 shadow-[0_0_18px_rgba(34,211,238,0.24)] hover:bg-cyan-400 active:bg-cyan-600 dark:border-cyan-300/40 dark:bg-cyan-600 dark:text-white dark:hover:bg-cyan-500 dark:active:bg-cyan-500'
                  : 'bg-brand text-white hover:bg-light-brand active:bg-brand',
              )}
              disabled={!productId || !selectedOption}
              onClick={handleAddToCart}>
              <div className='group-active:scale-94 transition-transform duration-200'>
                Add to Cart
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

// className='relative flex h-24 shrink-0 items-start justify-between overflow-hidden p-2 sm:h-28 md:h-24 md:max-h-24 lg:max-h-24 xl:h-36'>

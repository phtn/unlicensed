'use client'

import type {StoreProduct} from '@/app/types'
import type {Id} from '@/convex/_generated/dataModel'
import {formatBrandLabel} from '@/lib/format-brand-label'
import {useAddCartItem} from '@/hooks/use-add-cart-item'
import {Icon} from '@/lib/icons'
import {getAvailableCartQuantityForDenomination} from '@/lib/productStock'
import {cn} from '@/lib/utils'
import {formatDenominationDisplay} from '@/utils/formatDenomination'
import NextImage from 'next/image'
import NextLink from 'next/link'
import {useRouter} from 'next/navigation'
import {memo, type MouseEvent, useMemo, useState} from 'react'

type ProductCardTestProps = {
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

const ProductCardTestComponent = ({
  product,
  imageUrl: imageUrlProp,
  className,
}: ProductCardTestProps) => {
  const addItem = useAddCartItem()
  const router = useRouter()
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
      ? product.brand.map((brand) => formatBrandLabel(brand)).join(', ')
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

  const handleNameClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    void router.push(productHref)
  }

  return (
    <article
      data-product-type={productTypeLabel || undefined}
      className={cn(
        'group relative h-fit _md:h-[340.01px] _md:min-h-[340.01px] _md:max-h-[340.01px] min-w-48 max-w-48 overflow-hidden rounded-xs bg-sidebar shadow-sm dark:bg-black sm:min-w-80 md:min-w-72 lg:min-w-64 xl:min-w-76',
        'border border-cyan-400 dark:border-cyan-400',
        className,
      )}>
      <div className='pointer-events-none absolute inset-px z-0 rounded-[2px] border border-cyan-200/35 dark:border-cyan-200/20' />
      <div className='pointer-events-none absolute inset-x-6 top-0 z-0 h-px bg-linear-to-r from-transparent via-cyan-300/90 to-transparent' />
      <div className='pointer-events-none absolute inset-y-10 right-0 z-0 w-px bg-linear-to-b from-transparent via-cyan-300/70 to-transparent ' />

      <NextLink
        href={productHref}
        prefetch={false}
        aria-label={`View ${product.name}`}
        className='absolute inset-0 z-10 rounded-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background'
      />

      <div className='flex h-fit flex-col'>
        <div
          className={cn(
            'relative flex items-center justify-center overflow-hidden rounded-xs bg-sidebar/40 dark:bg-dark-table/40',
            'border-b border-cyan-300/60 dark:border-cyan-300/40',
          )}>
          <div className='pointer-events-none absolute inset-0 z-10 mix-blend-screen' />
          <div className='pointer-events-none absolute inset-0 z-10 opacity-70' />
          <div className='pointer-events-none absolute left-2 top-2 z-20 overflow-hidden rounded-xs border border-light-brand/75 px-2.5 py-1 bg-light-brand backdrop-blur-md'>
            <div className='absolute inset-x-0 top-0 h-px bg-brand' />
            <p className='text-xs font-ios uppercase tracking-widest text-cyan-50'>
              Experimental
            </p>
          </div>

          {imageSrc ? (
            <NextImage
              src={imageSrc}
              alt={product.name}
              width={512}
              height={512}
              quality={70}
              sizes='(min-width: 1280px) 19rem, (min-width: 1024px) 16rem, (min-width: 768px) 18rem, 100vw'
              className='aspect-square min-w-44 rounded-xs object-cover transition-transform duration-300 group-hover:scale-[1.03] xl:min-w-64'
            />
          ) : (
            <div className='flex aspect-square h-44 min-h-48 w-auto items-center justify-center xl:min-w-64'>
              <Icon name='spinners-ring' />
            </div>
          )}
        </div>

        <div className='flex h-fit flex-col'>
          <section
            id='info-details'
            className='relative flex shrink-0 items-start justify-between overflow-hidden bg-amber-200/0 p-2 sm:h-28 md:h-28'>
            <div className='min-w-0 flex-1'>
              <div>
                <div>
                  {brandLabel && (
                    <div className='mb-1 h-4 truncate text-[9px] font-okxs font-light capitalize tracking-wide opacity-75 md:mb-0.5 md:h-5 md:text-xs'>
                      <span className='font-light'>{brandLabel}</span>
                      {productTypeLabel ? (
                        <span>
                          <span className='px-1 text-[8px] font-thin opacity-80 font-okxs'>
                            &middot;
                          </span>
                          {productTypeLabel}
                        </span>
                      ) : null}
                    </div>
                  )}
                </div>

                <button
                  type='button'
                  title={product.name}
                  onClick={handleNameClick}
                  className='relative z-20 block max-w-full pointer-events-auto text-left'>
                  <h3 className='truncate capitalize font-clash text-lg leading-5 md:leading-5 lg:text-base lg:leading-5'>
                    {product.name}
                  </h3>
                </button>
              </div>

              <div className='relative top-1 flex items-center justify-between'>
                <div className='whitespace-nowrap'>
                  <div className='mt-0.5 flex h-4 items-center'>
                    {tierLabel !== '' && (
                      <span className='font-okxs text-[8px] font-medium uppercase tracking-widest opacity-70 md:text-xs md:font-medium dark:text-alum dark:opacity-100'>
                        {tierLabel}
                      </span>
                    )}
                  </div>

                  <div className='flex h-4 items-center whitespace-nowrap'>
                    {subcategoryLabel && (
                      <span
                        className={cn(
                          'font-okxs text-[8px] font-light capitalize opacity-80 sm:text-xs md:text-sm dark:text-alum dark:opacity-100',
                        )}>
                        {subcategoryLabel}
                        {netWeightLabel && (
                          <span className='px-1 text-xs font-thin opacity-80'>
                            &middot;
                          </span>
                        )}
                      </span>
                    )}

                    {netWeightLabel && (
                      <span className='font-okxs text-[8px] font-normal lowercase opacity-80 sm:text-xs md:text-xs dark:text-alum dark:opacity-100'>
                        {netWeightLabel}
                      </span>
                    )}

                    {packSizeLabel && (
                      <span className='font-okxs text-[8px] font-normal lowercase opacity-80 sm:text-xs md:text-xs dark:text-alum dark:opacity-100'>
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

                <div className='pointer-events-none absolute right-0 flex h-auto grow-0 aspect-square items-center justify-end overflow-hidden font-medium'>
                  {selectedOption ? (
                    <span>
                      <span
                        className={cn(
                          'font-medium tracking-tighter text-[1.75rem] text-light-brand',
                          'text-brand dark:text-light-brand',
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
              className='mt-1.5 flex h-8 gap-x-1 md:gap-x-1.5'
              aria-label='Select denomination'>
              {firstThreeOptions.map((option, index) => (
                <button
                  key={option.denominationValue}
                  type='button'
                  className={cn(
                    'relative z-20 flex flex-1 items-center justify-center bg-sidebar/50 text-xs text-white transition-colors duration-300 md:text-sm dark:bg-dark-table font-okxs',
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
                'border border-cyan-300/60 bg-cyan-500 text-slate-950 shadow-[0_0_18px_rgba(34,211,238,0.24)] hover:bg-cyan-400 active:bg-cyan-600 dark:border-cyan-300/40 dark:bg-cyan-600 dark:text-white dark:hover:bg-cyan-500 dark:active:bg-cyan-500',
              )}
              disabled={isAddToCartDisabled}
              onClick={handleAddToCart}>
              <div className='transition-transform duration-200 group-active:scale-94'>
                {addToCartLabel}
              </div>
            </button>
          </section>
        </div>
      </div>
    </article>
  )
}

ProductCardTestComponent.displayName = 'ProductCardTest'

export const ProductCardTest = memo(
  ProductCardTestComponent,
  (previousProps, nextProps) =>
    previousProps.className === nextProps.className &&
    previousProps.imageUrl === nextProps.imageUrl &&
    areProductsEqual(previousProps.product, nextProps.product),
)

import {StoreProduct} from '@/app/types'
import {cn} from '@/lib/utils'
import {mapCurrencyToSign} from '@/utils/currency'
import {createMultiOptionSlug} from '@/utils/visual-options'
import {Image, Link} from '@heroui/react'

interface CompactProductCardProps extends StoreProduct {
  className?: string
  priority?: boolean
  selectedVariant?: StoreProduct
  variantOptions?: Record<string, string>
  loading?: 'eager' | 'lazy'
}

export const CompactProductCard = ({
  // flavorNotes,
  slug,
  name,
  image,
  // priceCents,
  className,
  priority = false,
  selectedVariant,
  variantOptions,
  // loading = 'lazy',
}: CompactProductCardProps) => {
  const variantPrice = selectedVariant?.priceCents

  let displayPrice = selectedVariant?.priceCents
  if (selectedVariant?.priceCents) {
    displayPrice =
      typeof selectedVariant.priceCents === 'number'
        ? selectedVariant.priceCents
        : parseFloat(selectedVariant.priceCents)
  }

  let href = `/product/${slug}`
  if (variantOptions && Object.keys(variantOptions).length > 0) {
    href = `/product/${createMultiOptionSlug(slug, variantOptions)}`
  }

  return (
    <Link
      href={href}
      className={cn(
        'group flex w-full flex-col overflow-hidden rounded-lg border border-border bg-background shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-lg',
        className,
      )}
      aria-label={`View product: ${name}`}>
      <div className='relative aspect-square overflow-hidden bg-secondary/10'>
        <Image
          src={image || '/default-product-image.svg'}
          alt={name}
          className='object-cover transition-transform duration-500 ease-out group-hover:scale-110'
          sizes='(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 240px'
          loading={priority ? 'eager' : 'lazy'}
        />
      </div>

      <div className='flex flex-1 flex-col p-4'>
        <h3 className='mb-2 line-clamp-2 text-sm font-semibold text-foreground'>
          {name}
        </h3>

        {variantPrice &&
          displayPrice !== null &&
          displayPrice !== undefined && (
            <div className='mt-auto flex items-baseline justify-between'>
              <span className='text-xs text-muted-foreground'>From</span>
              <span className='text-base font-bold text-primary'>
                {mapCurrencyToSign('USD')}
                {typeof displayPrice === 'number'
                  ? displayPrice.toFixed(2)
                  : displayPrice}
              </span>
            </div>
          )}
      </div>
    </Link>
  )
}

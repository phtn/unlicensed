import type {StoreProduct} from '@/app/types'
import {useStorageUrls} from '@/hooks/use-storage-urls'
import {cn} from '@/lib/utils'
import {Card, CardBody, CardFooter, Image} from '@heroui/react'
import NextLink from 'next/link'
import {useMemo} from 'react'
import {HyperActivity} from '../expermtl/activity'
import {HyperBadge} from '../main/badge'

type ProductCardProps = {
  product: StoreProduct
  className?: string
}

const formatPrice = (priceCents: number) => {
  const dollars = priceCents / 100
  return dollars % 1 === 0 ? `${dollars.toFixed(0)}` : `${dollars.toFixed(2)}`
}

export const ProductCard = ({product, className}: ProductCardProps) => {
  const topEffects = product.effects.slice(0, 2)
  
  // Resolve product image URL
  const resolveUrl = useStorageUrls([product.image].filter(Boolean))
  const productImageUrl = useMemo(
    () => resolveUrl(product.image),
    [resolveUrl, product.image],
  )

  return (
    <Card
      as={NextLink}
      href={`/products/${product.slug.toLocaleLowerCase()}`}
      isPressable
      shadow='sm'
      className={cn(
        'group h-full transition-all duration-300 hover:-translate-y-1.5',
        'rounded-4xl',
        className,
      )}>
      <CardBody className='flex flex-col p-0'>
        <div className='flex justify-center items-center relative overflow-hidden sm:rounded-t-3xl'>
          <div className='absolute size-full overflow-hidden inset-0 z-10 bg-linear-to-t from-foreground/10 via-transparent to-transparent opacity-0 border-b-[0.33px] border-transparent group-hover:border-foreground/40 transition-opacity duration-300 group-hover:opacity-100' />
          <Image
            src={productImageUrl || '/default-product-image.svg'}
            alt={product.name}
            className='h-48 sm:h-80 lg:h-72 w-full rounded-t-2xl object-contain aspect-auto transition duration-300 group-hover:scale-[1.03]'
            loading='lazy'
          />
          <div className='absolute left-3 sm:left-4 top-3 sm:top-4 z-20 flex flex-col gap-2'>
            <HyperActivity c={product.featured}>
              <HyperBadge variant='limited' size='sm' />
            </HyperActivity>
          </div>
        </div>

        <div className='flex flex-col gap-3 sm:gap-4 p-3 sm:px-6 h-16'>
          <div className='flex items-start justify-between gap-2 h-full'>
            <div className='space-y-1 sm:space-y-2 flex-1 min-w-0'>
              <h3 className='text-base sm:text-xl font-semibold tracking-tight opacity-80 truncate capitalize'>
                {product.slug.split('-').join(' ')}
              </h3>
            </div>
            <span className='whitespace-nowrap text-base sm:text-lg font-space text-foreground shrink-0'>
              <span className='font-thin opacity-70'>$</span>
              {formatPrice(product.priceCents)}
            </span>
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
          {/*<p className='hidden text-xs opacity-70 font-normal line-clamp-2 sm:line-clamp-3 text-color-muted leading-relaxed'>
            {product.shortDescription}
          </p>*/}
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

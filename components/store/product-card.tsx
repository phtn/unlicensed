import type {StoreProduct} from '@/app/types'
import {cn} from '@/lib/utils'
import {Card, CardBody, CardFooter, Chip, Image} from '@heroui/react'
import NextLink from 'next/link'

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

  return (
    <Card
      as={NextLink}
      href={`/products/${product.slug}`}
      isPressable
      shadow='sm'
      className={cn(
        'group h-full transition-all duration-300 hover:-translate-y-1.5 hover-elevated',
        'rounded-4xl',
        className,
      )}>
      <CardBody className='flex flex-col'>
        <div className='relative overflow-hidden rounded-3xl'>
          <div className='absolute size-96 overflow-hidden inset-0 z-10 bg-linear-to-t from-foreground/10 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100' />
          <Image
            src={product.image}
            alt={product.name}
            className='h-96 w-full rounded-2xl object-contain aspect-auto transition duration-300 group-hover:scale-[1.03]'
          />
          <div className='absolute left-4 top-4 z-20 flex flex-col gap-2'>
            {product.featured ? (
              <Chip
                variant='flat'
                className='rounded-full bg-[#f5c468]/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#1a1f2a] shadow-[0_12px_30px_-18px_rgba(245,196,104,0.6)]'>
                Featured
              </Chip>
            ) : null}
          </div>
        </div>

        <div className='flex flex-col gap-4 p-4'>
          <div className='flex items-start justify-between'>
            <div className='space-y-2'>
              <h3 className='text-lg font-semibold font-space'>
                {product.name}
              </h3>
            </div>
            <span className='whitespace-nowrap text-lg font-space text-foreground'>
              <span className='font-thin opacity-70'>$</span>
              {formatPrice(product.priceCents)}
            </span>
          </div>
          <p className='text-xs opacity-70 font-normal whitespace-nowrap max-w-[44ch] truncate text-ellipsis'>
            {product.shortDescription}
          </p>
          <div className='flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-color-muted'>
            <span className='pill-surface rounded-full px-3 py-1 text-xs text-foreground/80'>
              <span className=' font-bold mr-1 opacity-70'>THC</span>
              <span className='font-space'>
                {product.thcPercentage.toFixed(1)}%
              </span>
            </span>
            {topEffects.map((effect) => (
              <span
                key={effect}
                className='rounded-full pill-surface px-3 py-1 text-xs capitalize tracking-tight opacity-80 font-space'>
                {effect}
              </span>
            ))}
          </div>
        </div>
      </CardBody>
      <CardFooter className='flex items-center justify-between px-5 pb-5'>
        <div className='flex items-center gap-2 text-xs tracking-wide text-color-muted'>
          <span className='opacity-60'>(1245 reviews)</span>
          <span>{product.rating.toFixed(1)} ★</span>
        </div>
        <span className='text-xs font-semibold text-foreground/70'>
          Details
        </span>
      </CardFooter>
    </Card>
  )
}

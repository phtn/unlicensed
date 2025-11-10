import type {StoreProduct} from '@/app/types'
import {cn} from '@/lib/utils'
import {Card, CardBody, CardFooter, Chip} from '@heroui/react'
import Image from 'next/image'
import NextLink from 'next/link'

type ProductCardProps = {
  product: StoreProduct
  className?: string
}

const formatPrice = (priceCents: number) => {
  const dollars = priceCents / 100
  return dollars % 1 === 0 ? `$${dollars.toFixed(0)}` : `$${dollars.toFixed(2)}`
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
        'group h-full surface-card-strong transition-all duration-300 hover:-translate-y-1.5 hover-elevated',
        className,
      )}>
      <CardBody className='flex flex-col gap-5 p-5'>
        <div className='relative overflow-hidden rounded-2xl border border-[var(--surface-outline)] bg-[var(--surface-highlight)]'>
          <div className='absolute inset-0 z-10 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100' />
          <Image
            src={product.image}
            alt={product.name}
            width={640}
            height={640}
            className='h-64 w-full rounded-2xl object-cover transition duration-300 group-hover:scale-[1.03]'
            priority={product.featured}
          />
          <div className='absolute left-4 top-4 z-20 flex flex-col gap-2'>
            {product.featured ? (
              <Chip
                variant='flat'
                className='rounded-full bg-[#f5c468]/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#1a1f2a] shadow-[0_12px_30px_-18px_rgba(245,196,104,0.6)]'>
                Featured
              </Chip>
            ) : null}
            <Chip
              color='default'
              variant='flat'
              className='chip-surface rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-[0.45em] text-color-muted'>
              {product.unit}
            </Chip>
          </div>
        </div>

        <div className='flex flex-col gap-3'>
          <div className='flex items-start justify-between gap-3'>
            <div>
              <h3 className='text-lg font-semibold text-foreground'>
                {product.name}
              </h3>
              <p className='text-sm text-color-muted'>
                {product.shortDescription}
              </p>
            </div>
            <span className='whitespace-nowrap text-sm font-semibold text-foreground'>
              {formatPrice(product.priceCents)}
            </span>
          </div>
          <div className='flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-color-muted'>
            <span className='pill-surface rounded-full px-3 py-1 text-[11px] font-medium text-foreground/80'>
              {product.thcPercentage.toFixed(1)}% THC
            </span>
            {typeof product.cbdPercentage === 'number' ? (
              <span className='pill-surface rounded-full px-3 py-1 text-[11px] font-medium text-foreground/70'>
                {product.cbdPercentage.toFixed(1)}% CBD
              </span>
            ) : null}
            {topEffects.map((effect) => (
              <span
                key={effect}
                className='rounded-full border border-color-border/60 px-3 py-1 text-[11px] font-medium uppercase tracking-widest text-color-muted'>
                {effect}
              </span>
            ))}
          </div>
        </div>
      </CardBody>
      <CardFooter className='flex items-center justify-between px-5 pb-5'>
        <div className='flex items-center gap-2 text-xs uppercase tracking-[0.45em] text-color-muted'>
          <span className='rounded-full border border-[var(--surface-outline)] bg-[var(--surface-highlight)] px-3 py-1 font-semibold text-foreground/80'>
            {product.categorySlug}
          </span>
          <span>{product.rating.toFixed(1)} ★</span>
        </div>
        <span className='text-xs font-semibold text-foreground/70'>
          Details
        </span>
      </CardFooter>
    </Card>
  )
}

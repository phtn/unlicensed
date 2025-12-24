import {StoreProduct} from '@/app/types'
import {formatPrice} from '@/utils/formatPrice'
import {Chip, Image} from '@heroui/react'
import Link from 'next/link'
import {ViewTransition} from 'react'

export const PrimaryCard = (item: StoreProduct) => {
  return (
    <ViewTransition key={item?.slug}>
      <div className='group relative overflow-hidden rounded-3xl border border-foreground/10 bg-background hover:border-foreground/30 transition-all duration-300 hover:-translate-y-1'>
        <Link href={`/products/${item?.slug}`}>
          <div className='space-y-4'>
            {item?.image && (
              <div className='relative aspect-square rounded-2xl overflow-hidden bg-foreground/5'>
                <Image
                  src={item?.image ?? undefined}
                  alt={item.name}
                  className='object-cover transition-transform duration-300 group-hover:scale-105'
                />
              </div>
            )}
            <div className='p-6 space-y-2'>
              <h3 className='text-xl font-semibold text-foreground'>
                {item?.name}
              </h3>
              <p className='text-sm opacity-60 line-clamp-2'>
                {item?.shortDescription}
              </p>
              <div className='flex items-center gap-2 flex-wrap'>
                {item?.effects?.slice(0, 2).map((effect) => (
                  <Chip
                    key={effect}
                    size='sm'
                    variant='flat'
                    className='text-xs'>
                    {effect}
                  </Chip>
                ))}
              </div>
              <div className='flex items-center justify-between pt-2'>
                <span className='text-lg font-semibold text-brand'>
                  {formatPrice(item?.priceCents ?? 0)}
                </span>
                <Chip size='sm' variant='flat' className='text-xs capitalize'>
                  {item?.potencyLevel}
                </Chip>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </ViewTransition>
  )
}

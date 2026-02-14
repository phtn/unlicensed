import {StoreProduct} from '@/app/types'
import {formatPrice} from '@/utils/formatPrice'
import {Chip, Image} from '@heroui/react'
import Link from 'next/link'
import {ViewTransition} from 'react'

export const PrimaryCard = (item: StoreProduct) => {
  return (
    <ViewTransition key={item?.slug}>
      <div className='group relative overflow-hidden rounded-3xl border border-foreground/10 bg-background hover:border-foreground/30 transition-all duration-300 hover:-translate-y-1'>
        <Link href={`/lobby/products/${item?.slug}`}>
          <div>
            {item?.image && (
              <div className='relative aspect-square overflow-hidden bg-foreground/5'>
                <Image
                  src={item?.image ?? undefined}
                  alt={item.name}
                  className='object-cover transition-transform duration-300 group-hover:scale-105'
                />
              </div>
            )}
            <div className='p-4 space-y-2'>
              <h3 className='text-xl font-polysans text-foreground'>
                {item?.name}
              </h3>
              <div className='flex items-center overflow-scroll font-brk gap-2'>
                {item?.flavorNotes?.slice(0, 2).map((flavor) => (
                  <Chip
                    key={flavor}
                    size='sm'
                    variant='flat'
                    className='text-xs bg-flavors/20'>
                    {flavor}
                  </Chip>
                ))}
                {item?.effects?.slice(0, 2).map((effect) => (
                  <Chip
                    key={effect}
                    size='sm'
                    variant='flat'
                    className='text-xs bg-effects/20'>
                    {effect}
                  </Chip>
                ))}
                {item?.terpenes?.slice(0, 2).map((terpene) => (
                  <Chip
                    key={terpene}
                    size='sm'
                    variant='flat'
                    className='text-xs bg-terpenes/20'>
                    {terpene}
                  </Chip>
                ))}
              </div>
              <div className='hidden items-center justify-between pt-2'>
                <span className='text-lg font-semibold font-space'>
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

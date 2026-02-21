'use client'

import {mapNumericFractions} from '@/app/admin/(routes)/inventory/product/product-schema'
import type {StoreProduct} from '@/app/types'
import {Id} from '@/convex/_generated/dataModel'
import {useCart} from '@/hooks/use-cart'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {
  Card,
  CardBody,
  CardFooter,
  Image,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@heroui/react'
import NextLink from 'next/link'
import {useState} from 'react'
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

type PriceOption = {price: string; denom: string; denominationValue: number}

const priceOptionsFromDenomination = (
  priceByDenomination: Record<string, number> | undefined,
  unit: string,
): PriceOption[] | null => {
  if (!priceByDenomination || Object.keys(priceByDenomination).length === 0) {
    return null
  }
  const entries = Object.entries(priceByDenomination).sort(
    ([a], [b]) => Number(a) - Number(b),
  )
  return entries.map(([denom, cents]) => ({
    price: formatPrice(cents),
    denom: `${mapNumericFractions[denom]} ${unit}`,
    denominationValue: Number(denom),
  }))
}

export const ProductCard = ({product, className}: ProductCardProps) => {
  const topEffects = product.effects.slice(0, 2)
  const priceOptions = priceOptionsFromDenomination(
    product.priceByDenomination,
    product.unit,
  )
  const {addItem} = useCart()
  const [popoverOpen, setPopoverOpen] = useState(false)
  const productId = product._id as Id<'products'> | undefined

  return (
    <Card
      as={NextLink}
      href={`/lobby/products/${product.slug.toLocaleLowerCase()}`}
      radius='none'
      isPressable
      disableRipple={false}
      shadow='sm'
      className={cn(
        'group h-full transition-all duration-300 hover:-translate-y-1.5 rounded-3xl',
        className,
      )}>
      <CardBody className='flex flex-col p-0'>
        <div className='flex justify-center items-center relative overflow-hidden sm:rounded-t-3xl'>
          <div className='absolute size-full overflow-hidden inset-0 z-10 bg-linear-to-t from-foreground/10 via-transparent to-transparent opacity-0 border-b-[0.33px] border-transparent group-hover:border-foreground/40 transition-all duration-300 group-hover:opacity-100' />
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              shadow='none'
              className='w-full rounded-t-3xl rounded-b-xl object-cover aspect-square transition duration-300 group-hover:scale-[1.03]'
              isLoading={!product.image}
              loading='eager'
            />
          ) : (
            <div className='w-auto h-40 min-h-40 aspect-square flex items-center justify-center'>
              <Icon name='spinners-ring' />
            </div>
          )}
          <div className='absolute left-5 sm:left-4 top-5 sm:top-4 z-20 flex flex-col gap-2'>
            <HyperActivity c={product.featured}>
              <HyperBadge variant='featured' size='sm' />
            </HyperActivity>
            <HyperActivity c={product.limited}>
              <HyperBadge variant='limited' size='sm' />
            </HyperActivity>
          </div>
        </div>

        <div className='flex flex-col gap-3 sm:gap-4 p-3 sm:px-6 h-16'>
          <div className='flex items-start justify-between gap-2 h-full'>
            <div className='space-y-1 sm:space-y-2 flex-1 min-w-0'>
              <h3 className='text-base sm:text-lg font-okxs truncate capitalize'>
                {product.slug.split('-').join(' ')}
              </h3>
            </div>
            <div className=' flex items-center justify-end whitespace-nowrap text-base sm:text-lg font-okxs text-foreground shrink-0 w-fit'>
              {priceOptions ? (
                <Popover
                  isOpen={popoverOpen}
                  onOpenChange={setPopoverOpen}
                  placement='top-end'
                  showArrow>
                  <PopoverTrigger>
                    <button
                      type='button'
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                      className='font-okxs h-7 text-base sm:text-base hover:bg-sidebar bg-transparent shadow-none min-w-0 w-fit text-left transition-opacity text-brand px-2 rounded-md'>
                      Add to cart
                      {/*{priceOptions.length === 1
                        ? `$${priceOptions[0].price} ∕ ${priceOptions[0].denom}`
                        : `From $${priceOptions[0].price}`}*/}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className='w-32 p-2'>
                    <div className='flex flex-col gap-0.5 w-full'>
                      {priceOptions.map((opt) => (
                        <button
                          key={opt.denominationValue}
                          type='button'
                          disabled={!productId}
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            if (productId) {
                              addItem(productId, 1, opt.denominationValue)
                              setPopoverOpen(false)
                            }
                          }}
                          className={cn(
                            'flex items-center justify-between w-full rounded-lg p-2 text-sm transition-colors font-okxs font-medium',
                            productId
                              ? 'hover:bg-brand hover:text-white active:bg-default-200'
                              : 'opacity-70 cursor-not-allowed',
                          )}>
                          <p className=''>${opt.price}</p>
                          <p className=''>{opt.denom}</p>
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              ) : (
                <>
                  <span className='font-thin opacity-70'>$</span>
                  {formatPrice(product.priceCents)}
                </>
              )}
            </div>
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

'use client'

import {StoreProduct} from '@/app/types'
import {ProductCard} from '@/components/store/product-card'
import {useStorageUrls} from '@/hooks/use-storage-urls'
import {resolveProductImage} from '@/lib/resolve-product-image'
import {cn} from '@/lib/utils'
import type {EmblaCarouselType} from 'embla-carousel'
import useEmblaCarousel from 'embla-carousel-react'
import wheelGesturesPlugin from 'embla-carousel-wheel-gestures'
import Link from 'next/link'
import {
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from 'react'

const AUTOPLAY_DELAY_MS = 4500

interface FireCollectionProps {
  products: StoreProduct[]
}

export const FireCollection = ({products}: FireCollectionProps) => {
  const imageIds = useMemo(
    () =>
      products
        .filter(
          (product) => !!product.image && !product.image.startsWith('http'),
        )
        .map((product) => product.image),
    [products],
  )
  const resolveUrl = useStorageUrls(imageIds)
  const autoplayPausedRef = useRef(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      align: 'start',
      dragFree: true,
      loop: products.length > 1,
      skipSnaps: false,
      watchDrag: true,
      watchResize: true,
    },
    [wheelGesturesPlugin()],
  )

  const scrollTo = useCallback(
    (index: number) => {
      emblaApi?.scrollTo(index)
    },
    [emblaApi],
  )

  const syncSelectedIndex = useEffectEvent((api: EmblaCarouselType) => {
    setSelectedIndex(api.selectedScrollSnap())
  })

  const autoplayNext = useEffectEvent(() => {
    if (!emblaApi || autoplayPausedRef.current || products.length < 2) {
      return
    }

    emblaApi.scrollNext()
  })

  useEffect(() => {
    if (!emblaApi) {
      return
    }

    syncSelectedIndex(emblaApi)
    emblaApi.on('select', syncSelectedIndex)
    emblaApi.on('reInit', syncSelectedIndex)

    return () => {
      emblaApi.off('select', syncSelectedIndex)
      emblaApi.off('reInit', syncSelectedIndex)
    }
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi || products.length < 2) {
      return
    }

    const intervalId = window.setInterval(() => {
      autoplayNext()
    }, AUTOPLAY_DELAY_MS)

    return () => window.clearInterval(intervalId)
  }, [emblaApi, products.length])

  if (products.length === 0) {
    return (
      <section
        id='fire-collection'
        className='mx-auto w-full pt-16 md:max-w-7xl px-2 sm:px-4 md:px-6 xl:px-0 bg-background'>
        <div className='rounded-3xl border border-foreground/10 bg-sidebar/30 px-6 py-10 text-center'>
          <h2 className='text-2xl font-clash font-semibold text-foreground sm:text-3xl'>
            Fire Collection
          </h2>
          <p className='mt-3 text-sm text-foreground/65 sm:text-base'></p>
        </div>
      </section>
    )
  }

  return (
    <section
      id='fire-collection'
      className='mx-auto w-full pt-16 md:max-w-7xl px-2 sm:px-4 md:px-6 xl:px-0 bg-background'>
      <div className='flex flex-col gap-8 rounded-3xl transition-colors'>
        <div className='flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
          <div className='space-y-2'>
            <h2 className='text-3xl font-clash font-semibold tracking-tight sm:text-5xl'>
              <span className='text-brand'>Fire</span> Collection
            </h2>
            {/*<p className='max-w-2xl text-sm text-foreground/70 sm:text-base'>
              One continuous row of the products you want to push right now.
              Swipe across, let autoplay roll, or jump straight into the full
              catalog.
            </p>*/}
          </div>
          <Link
            href='/lobby/products'
            className='flex items-center gap-3 text-xs uppercase tracking-[0.35em] text-color-muted transition-opacity hover:opacity-70'>
            <span>View all</span>
            <span className='h-px w-10 bg-foreground/30' />
            <span>{products.length}</span>
          </Link>
        </div>

        <div
          className='relative'
          onMouseEnter={() => {
            autoplayPausedRef.current = true
          }}
          onMouseLeave={() => {
            autoplayPausedRef.current = false
          }}
          onFocusCapture={() => {
            autoplayPausedRef.current = true
          }}
          onBlurCapture={() => {
            autoplayPausedRef.current = false
          }}>
          <div
            ref={emblaRef}
            className='overflow-hidden'
            role='region'
            aria-roledescription='carousel'
            aria-label='Fire Collection products'>
            <div className='flex touch-pan-y gap-3 pe-4 md:gap-4 md:pe-0'>
              {products.map((product) => (
                <div
                  key={product._id ?? product.slug}
                  className='min-w-0 flex-[0_0_78%] sm:flex-[0_0_52%] lg:flex-[0_0_22rem] xl:flex-[0_0_24rem]'>
                  <ProductCard
                    product={product}
                    imageUrl={resolveProductImage(product.image, resolveUrl)}
                    className='w-full min-w-0 max-w-none sm:min-w-0 md:min-w-0 lg:min-w-0 xl:min-w-0'
                  />
                </div>
              ))}
            </div>
          </div>

          {products.length > 1 && (
            <div className='mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
              <div className='flex items-center gap-2' role='tablist'>
                {products.map((product, index) => (
                  <button
                    key={product._id ?? product.slug}
                    type='button'
                    className={cn(
                      'h-2 rounded-full transition-all duration-300',
                      selectedIndex === index
                        ? 'w-8 bg-foreground'
                        : 'w-2 bg-foreground/25 hover:bg-foreground/45',
                    )}
                    onClick={() => scrollTo(index)}
                    role='tab'
                    aria-selected={selectedIndex === index}
                    aria-label={`Go to ${product.name}`}
                  />
                ))}
              </div>
              <p className='text-xs uppercase tracking-[0.3em] text-foreground/50'>
                Swipe horizontally. Autoplay pauses on hover.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

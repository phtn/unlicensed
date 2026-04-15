'use client'

import {StoreProduct} from '@/app/types'
import {useStorageUrls} from '@/hooks/use-storage-urls'
import {resolveProductImage} from '@/lib/resolve-product-image'
import {cn} from '@/lib/utils'
import type {EmblaCarouselType} from 'embla-carousel'
import useEmblaCarousel from 'embla-carousel-react'
import WheelGesturesPlugin from 'embla-carousel-wheel-gestures'
import {
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from 'react'
import {ProductCard} from './product-card'

interface ProductCarouselProps {
  products: Array<StoreProduct>
  productCount?: number
}

const AUTOPLAY_DELAY_MS = 4500

export const ProductCarousel = ({
  products,
  productCount,
}: ProductCarouselProps) => {
  const totalProducts = productCount ?? products.length
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
    [WheelGesturesPlugin()],
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

  return (
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
        className='ml-[calc(50%-50vw)] mr-[calc(50%-50vw)] w-screen overflow-hidden sm:mx-0 sm:w-full'
        role='region'
        aria-roledescription='carousel'
        aria-label={`Fire Collection products, showing ${products.length} of ${totalProducts}`}>
        <div className='flex touch-pan-y items-stretch'>
          {products.map((product) => (
            <div
              key={product._id ?? product.slug}
              className='mr-1 sm:mr-2 md:mr-3! min-w-0 h-full flex-[0_0_calc((100%-2.5rem)/2.25)] sm:flex-[0_0_calc((100%-1.5rem)/2.5)] md:flex-[0_0_calc((100%-2.25rem)/3.25)] lg:flex-[0_0_calc((100%-3rem)/4)] xl:flex-[0_0_calc((100%-3rem)/5)]'>
              <ProductCard
                product={product}
                imageUrl={resolveProductImage(product.image, resolveUrl)}
                className='h-full w-full min-w-0 max-w-none shrink-0 sm:min-w-0 md:min-w-0 lg:min-w-0 xl:min-w-0'
              />
            </div>
          ))}
        </div>
      </div>

      {products.length > 1 && (
        <div className='mt-5 flex flex-col gap-1 sm:gap-2 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex items-center gap-0' role='tablist'>
            {products.map((product, index) => (
              <button
                key={product._id ?? product.slug}
                type='button'
                className={cn(
                  'relative flex h-6 w-6 items-center justify-center rounded-full transition-colors duration-300',
                  selectedIndex === index
                    ? 'bg-foreground/0'
                    : 'hover:bg-foreground/10',
                )}
                onClick={() => scrollTo(index)}
                role='tab'
                aria-selected={selectedIndex === index}
                aria-label={`Go to ${product.name}`}>
                <span
                  className={cn(
                    'block h-2 rounded-full transition-all duration-300',
                    selectedIndex === index
                      ? 'w-6 bg-foreground'
                      : 'w-2 bg-foreground/25',
                  )}
                />
              </button>
            ))}
          </div>
          <p className='hidden md:block text-xs uppercase tracking-[0.3em] text-foreground/50'>
            Swipe left or right
          </p>
        </div>
      )}
    </div>
  )
}

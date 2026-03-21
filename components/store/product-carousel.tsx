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
}
const AUTOPLAY_DELAY_MS = 4500

export const ProductCarousel = ({products}: ProductCarouselProps) => {
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
        className='overflow-hidden'
        role='region'
        aria-roledescription='carousel'
        aria-label='Fire Collection products'>
        <div className='flex touch-pan-y'>
          {products.map((product) => (
            <div
              key={product._id ?? product.slug}
              className='me-3 min-w-0 flex-[0_0_78%] sm:flex-[0_0_52%] md:me-4 lg:flex-[0_0_calc((100%-4rem)/4.333333)]'>
              <ProductCard
                product={product}
                imageUrl={resolveProductImage(product.image, resolveUrl)}
                className='w-full min-w-0 max-w-none shrink-0 sm:min-w-0 md:min-w-0 lg:min-w-0 xl:min-w-0 md:h-[350.01px] md:min-h-[350.01px] md:max-h-[350.01px]'
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
          <p className='hidden md:block text-xs uppercase tracking-[0.3em] text-foreground/50'>
            Swipe left or right
          </p>
        </div>
      )}
    </div>
  )
}

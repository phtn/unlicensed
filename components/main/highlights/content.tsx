import {useScreenResizeObserver} from '@/hooks/use-screen-resize-observer'
import {cn} from '@/lib/utils'
import type {EmblaCarouselType} from 'embla-carousel'
import useEmblaCarousel from 'embla-carousel-react'
import wheelGesturesPlugin from 'embla-carousel-wheel-gestures'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {SlideButtonProps, Slider, SliderControls, type Slide} from './slider'

interface HomepageCarouselProps {
  slides: Array<Slide>
  /** Measured height of the hero image (from NewHome); used so content below does not overlap or fall short. */
  heroImageHeight?: number | null
  className?: string
}

export const Highlights = ({
  slides = [],
  heroImageHeight,
  className,
}: HomepageCarouselProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: 'start',
      skipSnaps: false,
      inViewThreshold: 0.5,
      watchDrag: true,
      watchResize: true,
      watchSlides: false,
    },
    [wheelGesturesPlugin()],
  )

  const [selectedIndex, setSelectedIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const {height} = useScreenResizeObserver()

  const scrollTo = useCallback(
    (index: number) => {
      emblaApi?.scrollTo(index)
    },
    [emblaApi],
  )

  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext()
  }, [emblaApi])

  const controls = useMemo(
    () =>
      [
        {
          label: 'Previous-Slide',
          icon: 'chevron-left',
          onPress: scrollPrev,
        },
        {
          label: 'Next-Slide',
          icon: 'chevron-right',
          onPress: scrollNext,
        },
      ] as SlideButtonProps[],
    [scrollPrev, scrollNext],
  )

  const onSelect = useCallback((api: EmblaCarouselType) => {
    if (api) {
      setSelectedIndex(api.selectedScrollSnap())
    }
  }, [])

  useEffect(() => {
    if (!emblaApi) return
    /// eslint-disable-next-line react-hooks/exhaustive-deps
    onSelect(emblaApi)
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)

    return () => {
      emblaApi.off('select', onSelect)
      emblaApi.off('reInit', onSelect)
    }
  }, [emblaApi, onSelect])

  if (!slides || slides.length === 0) {
    return null
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative w-full bg-background h-fit',
        'cursor-grab active:cursor-grabbing',
        className,
      )}
      style={
        heroImageHeight != null && heroImageHeight > 0
          ? {height: height}
          : undefined
      }
      role='region'
      aria-roledescription='carousel'
      aria-label='Featured products carousel'>
      {/*<div className='absolute dark:text-white text-xl font-bold z-9999 top-20 left-6'>
        {height}x{width} px
      </div>*/}
      <div
        ref={emblaRef}
        className='overflow-hidden md:snap-x 2xl:h-screen md:snap-mandatory md:scroll-smooth md:[-webkit-overflow-scrolling:touch] md:scrollbar-none md:[scrollbar-width:none] md:[&::-webkit-scrollbar]:hidden motion-safe:scroll-smooth'>
        {slides.map((slide, index) => (
          <Slider key={index} {...slide} />
        ))}
      </div>

      {slides.length > 1 && (
        <>
          <div className='bg-linear-to-r from-foreground/5 via-foreground/1 to-foreground/5 inset-0 lg:block'>
            <div className='mx-auto pl-4'>
              <div className='flex'>
                <div className='flex' role='tablist'>
                  {slides.map((_, index) => (
                    <button
                      key={index}
                      className={cn(
                        'h-2 rounded-full transition-all duration-300',
                        selectedIndex === index
                          ? 'w-8 bg-foreground'
                          : 'w-2 bg-foreground/30 hover:bg-foreground/50',
                      )}
                      onClick={() => scrollTo(index)}
                      role='tab'
                      aria-selected={selectedIndex === index}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
                <SliderControls controls={controls} />
              </div>
            </div>
          </div>

          <div className='absolute inset-0 flex justify-center lg:hidden'>
            {slides.map((_, index) => (
              <button
                key={index}
                className={cn(
                  'relative h-2.5 rounded-full transition-all duration-300',
                  "before:pointer-events-none before:absolute before:inset-2 before:content-['']",
                  selectedIndex === index
                    ? 'w-8 bg-foreground'
                    : 'w-2.5 bg-foreground/40 active:bg-foreground/60',
                )}
                onClick={() => scrollTo(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

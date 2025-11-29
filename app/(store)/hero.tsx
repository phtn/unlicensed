'use client'

import {Tag} from '@/components/base44/tag'
import {Icon, IconName} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Button, Image} from '@heroui/react'
import type {EmblaCarouselType} from 'embla-carousel'
import useEmblaCarousel from 'embla-carousel-react'
import {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {StoreProduct} from '../types'

export interface Highlight {
  id: string
  imageUrl: string
  imageAlt: string
  title: ReactNode
  description: string
  ctaText: string
  ctaHref: string
  tag?: string
  product?: StoreProduct & {selectedVariant?: unknown}
  variantOptions?: Record<string, string>
}

interface HomepageCarouselProps {
  slides: Highlight[]
  className?: string
}

export const Highlights = ({slides = [], className}: HomepageCarouselProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'start',
    skipSnaps: false,
    inViewThreshold: 0.7,
    watchDrag: true,
    watchResize: true,
    watchSlides: false,
  })

  const [selectedIndex, setSelectedIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

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
        'relative max-w-7xl mx-auto pt-10 md:pt-24 h-[80lvh] md:h-[70lvh]',
        'cursor-grab active:cursor-grabbing',
        className,
      )}
      role='region'
      aria-roledescription='carousel'
      aria-label='Featured products carousel'>
      <div
        ref={emblaRef}
        className='rounded-4xl overflow-hidden md:snap-x h-full md:snap-mandatory md:scroll-smooth md:[-webkit-overflow-scrolling:touch] md:scrollbar-none md:[scrollbar-width:none] md:[&::-webkit-scrollbar]:hidden motion-safe:scroll-smooth'>
        <div className='flex'>
          {slides.map((slide, index) => (
            <Slide key={index} {...slide} />
          ))}
        </div>
      </div>

      {slides.length > 1 && (
        <>
          <div className='absolute bg-linear-to-r from-foreground/5 via-foreground/1 to-foreground/5 rounded-xl inset-x-0 bottom-8 hidden lg:block'>
            <div className='container mx-auto pl-4'>
              <div className='flex items-center justify-between'>
                <div className='flex gap-2' role='tablist'>
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

          <div className='absolute inset-x-0 bottom-6 flex justify-center gap-3 lg:hidden'>
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

const Slide = ({
  tag,
  title,
  description,
  imageUrl,
  // imageAlt,
  ctaHref,
  ctaText,
  // product,
  // variantOptions,
}: Highlight) => {
  return (
    <div className=' relative min-w-full flex-[0_0_100%] px-6 md:snap-start md:snap-always'>
      <div className=''>
        <div className='grid lg:grid-cols-2 gap-12 items-center'>
          <div>
            <Tag text={tag} />
            {title}
            <p className='hidden md:flex text-lg opacity-70 mb-10 max-w-[38ch] leading-relaxed'>
              {description}
            </p>

            <div className='flex items-center md:gap-4 lg:gap-5 relative z-100'>
              <Button
                as='a'
                href={ctaHref}
                className='bg-dark-gray dark:bg-white dark:hover:text-background hover:bg-brand/80 hover:text-foreground text-white dark:text-brand font-medium px-6 py-3'>
                {ctaText}
              </Button>
              <Button
                variant='flat'
                className='hidden md:flex items-center gap-2'>
                <span>Strain Finder</span>
                <Icon name='search' className='w-4 h-4' />
              </Button>
            </div>
          </div>

          <div className='relative flex justify-end max-h-[50lvh] overflow-hidden'>
            <Image
              src={imageUrl}
              alt='Beautiful flower'
              className='w-full aspect-auto select-none'
            />
          </div>
        </div>
      </div>
    </div>
  )
}

interface SlideButtonProps {
  onPress: VoidFunction
  label: string
  icon: IconName
}

const SliderButton = ({onPress, label, icon}: SlideButtonProps) => {
  return (
    <Button
      isIconOnly
      className={cn(
        'flex h-10 w-10 items-center justify-center rounded-xl',
        'group hover:bg-foreground/5 bg-transparent',
        'focus-visible:ring-ring focus-visible:ring-offset-2',
        'focus-visible:outline-none focus-visible:ring-2',
      )}
      onPress={onPress}
      aria-label={label}>
      <Icon name={icon} className='size-4' />
    </Button>
  )
}

const SliderControls = ({controls}: {controls: SlideButtonProps[]}) => {
  return (
    <div className='flex gap-2'>
      {controls.map((control) => (
        <SliderButton
          key={control.label}
          icon={control.icon}
          label={control.label}
          onPress={control.onPress}
        />
      ))}
    </div>
  )
}

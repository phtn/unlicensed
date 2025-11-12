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
        'relative max-w-7xl mx-auto pt-10 md:pt-24 h-[80lvh] md:h-[64lvh]',
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
                className='bg-primary hover:bg-primary-foreground text-white font-medium px-6 py-3'>
                {ctaText}
              </Button>
              <Button variant='faded' className='flex items-center gap-2'>
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

/*
<div
              key={control.id}
              className='relative min-w-full flex-[0_0_100%] @container md:snap-start md:snap-always'
              role='group'
              aria-roledescription='slide'
              aria-label={`Slide ${index + 1} of ${slides.length}`}>
              <div className='container mx-auto'>
                <div className='relative min-h-[500px] px-4 py-12 sm:min-h-[550px] sm:py-16 lg:grid lg:min-h-0 lg:grid-cols-2 lg:items-center lg:gap-12 lg:py-16 xl:gap-16'>
                  <div className='absolute inset-0 -z-10 lg:hidden'>
                    <div className='absolute inset-0 bg-linear-to-b from-background/90 via-background/75 to-background/90' />
                    <Image
                      src={slide.imageUrl}
                      alt=''
                      width={768}
                      height={500}
                      className='size-full object-cover object-center opacity-25'
                      priority={index === 0}
                      quality={30}
                      sizes='(max-width: 768px) 50vw, 100vw'
                    />
                  </div>

                  <div className='relative flex flex-col justify-center space-y-6 text-center lg:px-4 lg:text-left'>
                    <div className='space-y-4'>
                      <h2 className='text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl xl:text-6xl'>
                        {slide.title}
                      </h2>
                      <p className='mx-auto max-w-md text-balance text-base text-muted-foreground sm:text-lg lg:mx-0 lg:text-xl'>
                        {slide.subtitle}
                      </p>
                    </div>

                    <div className='flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start'>
                      <Button className='w-full sm:w-auto lg:px-8 lg:py-6 lg:text-lg'>
                        <Link href={slide.ctaHref}>{slide.ctaText}</Link>
                      </Button>
                      <Button
                        variant='bordered'
                        className='w-full sm:w-auto lg:px-8 lg:py-6 lg:text-lg'>
                        <Link href='/search'>Browse All Categories</Link>
                      </Button>
                    </div>
                  </div>

                  <div className='relative hidden lg:block lg:px-4'>
                    <div className='relative h-[400px] w-full overflow-hidden rounded-lg bg-white lg:h-[500px] xl:h-[600px]'>
                      <Image
                        src={slide.imageUrl}
                        alt={slide.imageAlt}
                        width={600}
                        height={600}
                        className='size-full object-contain'
                        priority={index === 0}
                        quality={85}
                        sizes='(min-width: 1024px) 50vw, 0vw'
                      />

                      {slide.product && (
                        <div className='absolute bottom-4 right-4 hidden w-[200px] md:block lg:bottom-8 lg:right-8 lg:w-[240px]'>
                          <CompactProductCard
                            {...slide.product}
                            selectedVariant={slide.product}
                            variantOptions={slide.variantOptions}
                            priority={index === 0}
                            className='bg-background/95 shadow-xl backdrop-blur-sm'
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
*/

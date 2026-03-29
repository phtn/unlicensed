import {Highlights} from '@/components/main/highlights/content'
import {useScreenResizeObserver} from '@/hooks/use-screen-resize-observer'
import {cn} from '@/lib/utils'
import {Button} from '@heroui/react'
import Link from 'next/link'
import {useEffect, useMemo, useRef, useState} from 'react'
import {Slide} from '../main/highlights/slider'

const MOBILE_BREAKPOINT = 575
const MD_BREAKPOINT = 768

export const NewHome = () => {
  const {isPortrait, width} = useScreenResizeObserver()
  const isMobile = width < MOBILE_BREAKPOINT
  const isPortraitBelowMd = width < MD_BREAKPOINT && isPortrait
  const heroImageWrapRef = useRef<HTMLDivElement>(null)
  const [heroImageHeight, setHeroImageHeight] = useState<number | null>(null)
  const shopNowOffsetClassName = isPortraitBelowMd
    ? 'bottom-32'
    : isMobile
      ? 'bottom-[8.333%]'
      : 'bottom-[15.3%]'

  useEffect(() => {
    const el = heroImageWrapRef.current
    if (!el || !isMobile) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const boxSize = Array.isArray(entry.borderBoxSize)
          ? entry.borderBoxSize[0]
          : entry.borderBoxSize
        const nextHeight = boxSize?.blockSize ?? entry.contentRect.height

        if (nextHeight > 0) {
          setHeroImageHeight((currentHeight) =>
            currentHeight === nextHeight ? currentHeight : nextHeight,
          )
        }
      }
    })

    observer.observe(el)
    return () => observer.disconnect()
  }, [isMobile])

  // const {height: h, width: w} = useScreenResizeObserver()

  const slides = useMemo(
    () =>
      [
        {
          id: 'id',
          tag: '',
          imageUrl: isMobile
            ? 'https://res.cloudinary.com/dx0heqhhe/image/upload/v1773341566/Revised_mobile_f5wwdo.webp'
            : 'https://res.cloudinary.com/dx0heqhhe/image/upload/v1773341316/Revised_jhykmd.webp',
          imageAlt: '',
          title: '',
          description: '',
          ctaText: 's',
          ctaHref: '',
        },
      ] as Array<Slide>,
    [isMobile],
  )

  return (
    <div
      className='relative bg-linear-to-b bg-background dark:bg-black 2xl:h-screen'
      style={
        isMobile && heroImageHeight != null
          ? {height: heroImageHeight}
          : undefined
      }>
      <div
        ref={heroImageWrapRef}
        className=' bg-black top-0 left-0 w-full sm:h-[44vh] md:h-[50vh] lg:h-[58vh] xl:h-[75vh] 2xl:h-[85vh]'>
        <Highlights heroImageHeight={heroImageHeight} slides={slides} />
      </div>

      <Button
        as={Link}
        size='lg'
        id='shop-now'
        radius='none'
        href='/lobby/category'
        variant='solid'
        className={cn(
          'absolute left-1/2 z-10 -translate-x-1/2 opacity-100 bg-white text-brand uppercase font-clash font-semibold px-8 sm:px-8 py-2 sm:py-3 text-lg lg:text-xl hover:opacity-100 _dark:text-dark-gray _hover:bg-brand _dark:hover:text-white _dark:bg-white md:bottom-24 lg:bottom-24 xl:bottom-28 2xl:bottom-44 md:w-64',
          shopNowOffsetClassName,
        )}>
        Shop Now
      </Button>
    </div>
  )
}

// const slides = useMemo(
//   () =>
//     [
//       {
//         id: 'rapid-fire',
//         tag: 'Rapid Fire',
//         imageUrl: '/static/slurry.webp',
//         imageAlt: '',
//         title: <TitleV2 title='THRIVE' subtitle='WHERE FAST MINDS' />,
//         description: 'Pure elevation. Crafted for the modern mind.',
//         ctaText: 'Shop Now',
//         ctaHref: '/lobby/collection',
//       },
//       {
//         id: 'flower',
//         tag: 'Flower',
//         imageUrl: '/static/devilsm.webp',
//         imageAlt: '',
//         title: <Title title='Elevated' subtitle='Modern Evenings.' />,
//         description:
//           'Hyper-seasonal releases, terpene-rich cultivars, chef-crafted edibles, and sparkling infusions.',
//         ctaText: 'Shop Flowers',
//         ctaHref: '/lobby/category/flower',
//       },
//       {
//         id: 'edibles',
//         imageUrl:
//           'https://cdn.shopify.com/s/files/1/0693/8119/3966/files/Chillout_25mg_d8.png?v=1723894235&width=600',
//         tag: 'Edibles',
//         imageAlt: 'Edible Gummy Image',
//         title: <Title title='Uplifting' subtitle='Morning Glow.' />,
//         description:
//           'A chef-led recipe using cold-pressed citrus and nano-emulsified THC for a crisp, uplifting edible. Balanced with guava nectar for a lush finish.',
//         ctaText: 'Shop Edibles',
//         ctaHref: '/lobby/category/edibles',
//       },
//       {
//         id: 'extracts',
//         tag: 'Extracts',
//         imageUrl: `https://cdn.shopify.com/s/files/1/0693/8119/3966/files/Thca_diamond.png?v=1734635477&width=600`,
//         imageAlt: 'Diamond Image',
//         title: <Title title='Diamond' subtitle='Rich THCa.' />,
//         description:
//           'A diamond in the rough. These THCa diamonds are small, solid, crystalline structures that you can smoke or vape for a potent high. Each package contains 1g.',
//         ctaText: 'Shop Concentrates',
//         ctaHref: '/lobby/category/concentrates',
//       },
//       {
//         id: 'vapes',
//         tag: 'Vapes',
//         imageUrl: `https://www.itshyfe.com/wp-content/uploads/2023/03/kite-rosin-carts.jpg`,
//         imageAlt: 'Hot Choco Image',
//         title: <Title title='Hibernate' subtitle='Into Sound Slumber.' />,
//         description:
//           'Powerful sleep support meets rich cocoa indulgence. A decadent chocolate elixir for experienced connoisseurs looking for deepest slumber.',
//         ctaText: 'Shop Beverages',
//         ctaHref: '/lobby/category/beverages',
//       },
//     ] as Highlight[],
//   [],
// )

/*
<Image
          id='hero-image'
          alt='hero-image'
          width={isMobile ? 1168 : 2752}
          height={isMobile ? 1536 : 1150}
          className='absolute hidden top-0 left-0 w-[calc(104lvw)] h-auto aspect-4/5 sm:w-full sm:aspect-auto bg-cover'
          src={
            isMobile
              ? // 'https://res.cloudinary.com/dx0heqhhe/image/upload/v1772559002/hero-mobile_unh1to.webp'
                'https://res.cloudinary.com/dx0heqhhe/image/upload/v1772603013/hero-mobile-v2_vaiesj.webp'
              : 'https://res.cloudinary.com/dx0heqhhe/image/upload/v1772552114/hero-image_ivcsbu.webp'
          }
        />
*/

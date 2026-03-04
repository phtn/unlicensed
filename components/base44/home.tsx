import {Highlights} from '@/app/lobby/(store)/hero'
import {useMobile} from '@/hooks/use-mobile'
import {Button} from '@heroui/react'
import Image from 'next/image'
import Link from 'next/link'
import {useEffect, useRef, useState} from 'react'

export const NewHome = () => {
  const isMobile = useMobile()
  const heroImageWrapRef = useRef<HTMLDivElement>(null)
  const [heroImageHeight, setHeroImageHeight] = useState<number | null>(null)

  useEffect(() => {
    const el = heroImageWrapRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const h = entry.contentRect.height
        const boxSize = entry.borderBoxSize
        setHeroImageHeight(boxSize[0].inlineSize ?? 0)
        console.log('entry', boxSize[0].inlineSize, 'h', h)
        // if (typeof h === 'number' && h > 0) setHeroImageHeight(h)
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      className='relative bg-linear-to-b bg-background dark:bg-black'
      style={
        heroImageHeight != null ? {minHeight: heroImageHeight + 40} : undefined
      }>
      <div
        ref={heroImageWrapRef}
        className='absolute h-fit top-0 left-0 w-full min-h-screen'>
        <Image
          id='hero-image'
          alt='hero-image'
          width={isMobile ? 1168 : 2752}
          height={isMobile ? 1536 : 1136}
          className='absolute top-0 left-0 w-screen h-auto portrait:aspect-4/5 sm:aspect-4/5 md:aspect-video!'
          src={
            isMobile
              ? // 'https://res.cloudinary.com/dx0heqhhe/image/upload/v1772559002/hero-mobile_unh1to.webp'
                'https://res.cloudinary.com/dx0heqhhe/image/upload/v1772603013/hero-mobile-v2_vaiesj.webp'
              : 'https://res.cloudinary.com/dx0heqhhe/image/upload/v1772552114/hero-image_ivcsbu.webp'
          }
        />
      </div>
      <div className='flex justify-end w-fit px-4 sticky z-9999 top-4 left-4 bg-black/50 text-orange-200'>
        Image Height: {heroImageHeight}
      </div>
      <Highlights
        isMobile={isMobile}
        heroImageHeight={heroImageHeight}
        slides={[
          {
            id: 'id',
            tag: '',
            imageUrl: '',
            imageAlt: '',
            title: '',
            description: '',
            ctaText: '',
            ctaHref: '',
          },
        ]}
      />
      <Button
        as={Link}
        size='lg'
        radius='none'
        href='/lobby/category'
        variant='solid'
        className='absolute top-1/2 translate-y-24 lg:-translate-y-4/5 left-1/2 -translate-x-1/2 opacity-100 bg-white text-brand uppercase font-clash font-semibold px-8 sm:px-8 py-2 sm:py-3 text-lg lg:text-xl hover:opacity-100 _dark:text-dark-gray _hover:bg-brand _dark:hover:text-white  _dark:bg-white'>
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

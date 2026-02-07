import {Highlight, Highlights} from '@/app/lobby/(store)/hero'
import {useMemo} from 'react'
import {ShopFinder} from './finder'
import {Title, TitleV2} from './title'

export const NewHome = () => {
  const slides = useMemo(
    () =>
      [
        {
          id: 'rapid-fire',
          tag: 'Rapid Fire',
          imageUrl: '/static/slurry.webp',
          imageAlt: '',
          title: <TitleV2 title='THRIVE' subtitle='WHERE FAST MINDS' />,
          description: 'Pure elevation. Crafted for the modern mind.',
          ctaText: 'Shop Collection',
          ctaHref: '/lobby/collection',
        },
        {
          id: 'flower',
          tag: 'Flower',
          imageUrl: '/static/devilsm.webp',
          imageAlt: '',
          title: <Title title='Elevated' subtitle='Modern Evenings.' />,
          description:
            'Hyper-seasonal releases, terpene-rich cultivars, chef-crafted edibles, and sparkling infusions.',
          ctaText: 'Shop Flowers',
          ctaHref: '/lobby/category/flower',
        },
        {
          id: 'edibles',
          imageUrl:
            'https://cdn.shopify.com/s/files/1/0693/8119/3966/files/Chillout_25mg_d8.png?v=1723894235&width=600',
          tag: 'Edibles',
          imageAlt: 'Edible Gummy Image',
          title: <Title title='Uplifting' subtitle='Morning Glow.' />,
          description:
            'A chef-led recipe using cold-pressed citrus and nano-emulsified THC for a crisp, uplifting edible. Balanced with guava nectar for a lush finish.',
          ctaText: 'Shop Edibles',
          ctaHref: '/lobby/category/edibles',
        },
        {
          id: 'extracts',
          tag: 'Extracts',
          imageUrl: `https://cdn.shopify.com/s/files/1/0693/8119/3966/files/Thca_diamond.png?v=1734635477&width=600`,
          imageAlt: 'Diamond Image',
          title: <Title title='Diamond' subtitle='Rich THCa.' />,
          description:
            'A diamond in the rough. These THCa diamonds are small, solid, crystalline structures that you can smoke or vape for a potent high. Each package contains 1g.',
          ctaText: 'Shop Concentrates',
          ctaHref: '/lobby/category/concentrates',
        },
        {
          id: 'vapes',
          tag: 'Vapes',
          imageUrl: `https://www.itshyfe.com/wp-content/uploads/2023/03/kite-rosin-carts.jpg`,
          imageAlt: 'Hot Choco Image',
          title: <Title title='Hibernate' subtitle='Into Sound Slumber.' />,
          description:
            'Powerful sleep support meets rich cocoa indulgence. A decadent chocolate elixir for experienced connoisseurs looking for deepest slumber.',
          ctaText: 'Shop Beverages',
          ctaHref: '/lobby/category/beverages',
        },
      ] as Highlight[],
    [],
  )
  return (
    <div className='bg-linear-to-b dark:from-black dark:to-[#1f1f1f]/80 from-background to-white'>
      <Highlights slides={slides} />
      <div className='px-4 pb-10 max-w-7xl mx-auto'>
        <ShopFinder />
      </div>
    </div>
  )
}

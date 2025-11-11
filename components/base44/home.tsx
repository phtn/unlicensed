import {Highlights} from '@/app/(store)/hero'
import {Icon} from '@/lib/icons'
import {Button} from '@heroui/react'
import {ShopFinder} from './finder'
import {Nav} from './nav'
import {Title} from './title'

export const NewHome = () => {
  return (
    <div className='min-h-screen bg-accent'>
      <Nav />

      <Highlights
        slides={[
          {
            id: 'flower',
            tag: 'Flower',
            imageUrl:
              'https://cdn.shopify.com/s/files/1/0693/8119/3966/files/Slurricane_transparent.png?v=1759173573&width=1488',
            imageAlt: '',
            title: <Title title='Elevated' subtitle='Modern Evenings.' />,
            description:
              'Hyper-seasonal releases, terpene-rich cultivars, chef-crafted edibles, and sparkling infusions—all sourced from boutique growers and makers we know by name.',
            ctaText: 'Shop Flowers',
            ctaHref: '/category/flower',
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
            ctaHref: 'https://example.com',
          },
          {
            id: 'concentrates',
            tag: 'Concentrates',
            imageUrl: `https://cdn.shopify.com/s/files/1/0693/8119/3966/files/Thca_diamond.png?v=1734635477&width=600`,
            imageAlt: 'Diamond Image',
            title: <Title title='Diamond' subtitle='Rich THCa.' />,
            description:
              'A diamond in the rough. These THCa diamonds are small, solid, crystalline structures that you can smoke or vape for a potent high. Each package contains 1g.',
            ctaText: 'Shop Concentrates',
            ctaHref: 'https://example.com',
          },
          {
            id: 'beverages',
            tag: 'beverages',
            imageUrl: `https://cdn.shopify.com/s/files/1/0693/8119/3966/files/SleepytimeHotCocoaAdvanced_PLP_JuanStock_18092025.png?v=1758209621&width=600`,
            imageAlt: 'Hot Choco Image',
            title: <Title title='Hibernate' subtitle='Into Sound Slumber.' />,
            description:
              'Powerful sleep support meets rich cocoa indulgence. A decadent chocolate elixir for experienced connoisseurs looking for deepest slumber.',
            ctaText: 'Shop Beverages',
            ctaHref: 'https://example.com',
          },
        ]}
        className='cursor-grab active:cursor-grabbing'
      />

      {/* Scroll Indicator */}
      <div className='flex justify-end px-6 bg-foreground/10 py-2'>
        <div className='max-w-7xl w-full flex justify-end'>
          <Button
            isIconOnly
            className='rounded-full size-7 flex items-center justify-center bg-transparent hover:bg-transparent hover:text-teal-600 transition-colors'>
            <Icon name='arrow-down' className='hidden lg:flex size-5' />
          </Button>
        </div>
      </div>

      {/* Shop by Category */}
      <ShopFinder />

      {/* Bottom Spacing */}
    </div>
  )
}

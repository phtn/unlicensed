import {Title} from '@/components/base44/title'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Image} from '@heroui/react'
import Link from 'next/link'
import {Activity} from 'react'

export interface Brand {
  name: string
  slug: string
  icon: string
  description?: string
  featured?: boolean
}

export interface EnhancedBrand extends Brand {
  productCount: number
}

export const brands: EnhancedBrand[] = [
  {
    name: 'CBX',
    slug: 'cbx',
    icon: '/svg/cbx.svg',
    description: 'Premium quality meets exceptional craftsmanship',
    featured: true,
    productCount: 0,
  },
  {
    name: 'Wizard Trees',
    slug: 'wizard-trees',
    icon: '/svg/wizard-trees.svg',
    description: 'Magical strains for the discerning connoisseur',
    featured: true,
    productCount: 2,
  },
  {
    name: 'Jungle Boys',
    slug: 'jungle-boys',
    icon: '/svg/jungle-boys.svg',
    description: 'Cultivated excellence from seed to harvest',
    featured: false,
    productCount: 1,
  },
  {
    name: 'Heirbloom',
    slug: 'heirbloom',
    icon: '/svg/heirbloom.svg',
    description: 'Legacy genetics, modern innovation',
    featured: false,
    productCount: 0,
  },
]

export const AllBrands = () => {
  return (
    <section className='px-4 sm:px-6 py-20 sm:py-24 lg:pb-32'>
      <div className='max-w-7xl mx-auto'>
        <div className='mb-8 sm:mb-12'>
          <div className='space-y-1'>
            <h2 className='text-3xl font-clash font-semibold tracking-tight sm:text-5xl'>
              <span className='text-brand'>All</span> Brands
            </h2>
          </div>
          <p className='text-sm sm:text-base opacity-60'>
            Explore our complete collection of trusted partners
          </p>
        </div>

        <Activity mode={brands.length === 0 ? 'visible' : 'hidden'}>
          <div className='max-w-7xl mx-auto pt-20'>
            <div className='flex flex-col items-center justify-center gap-4 px-6 py-24 text-center'>
              <Title
                titleStyle='lowercase'
                title='Nothing here yet.'
                subtitle={
                  <div className='flex items-center relative'>
                    <Icon
                      name='chevron-double-left'
                      className='rotate-90 size-12 text-featured opacity-100 relative z-30'
                    />
                    <span>check back soon</span>
                  </div>
                }
              />
            </div>
          </div>
        </Activity>

        {/* Asymmetric Grid Layout */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8'>
          {brands.map((brand, index) => (
            <Link
              href={`/lobby/brands?id=${brand.slug}`}
              key={brand.slug}
              className={cn(
                'group relative overflow-hidden rounded-2xl sm:rounded-3xl border border-foreground/10 dark:border-dark-gray/50 transition-all duration-500 hover:border-foreground/30 hover:shadow-xl',
                // Create visual interest with varying heights
                index % 3 === 0 && 'sm:row-span-1',
                index % 3 === 1 && 'sm:row-span-1',
                index % 3 === 2 && 'sm:row-span-1',
              )}>
              <div className='relative flex flex-col p-6 dark:bg-background bg-foreground sm:p-8 min-h-50 sm:min-h-62.5'>
                {/* Background Accent */}
                <div className='absolute top-0 right-0 w-32 h-32 bg-brand/5 dark:bg-brand/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500' />

                {/* Brand Logo */}
                <div className='relative z-10 mb-4 sm:mb-6 shrink-0'>
                  <div className='relative w-24 sm:w-28 lg:w-32 h-14 sm:h-16 lg:h-20'>
                    <Image
                      src={brand.icon}
                      alt={brand.name}
                      className='w-full h-full object-contain opacity-90 dark:opacity-100'
                      loading='lazy'
                    />
                  </div>
                </div>

                {/* Brand Info */}
                <div className='relative z-10 flex-1 flex flex-col justify-between'>
                  <div>
                    {/*<h3 className='text-xl sm:text-2xl text-brand font-polysans font-bold mb-2 sm:mb-3 capitalize'>
                            {brand.name}
                          </h3>*/}
                    {/*{brand.description && (
                      <p className='text-xs sm:text-sm opacity-70 mb-4 leading-relaxed line-clamp-2'>
                        {brand.description}
                      </p>
                    )}*/}
                  </div>

                  {/* Product Count */}
                  <div className='flex items-center justify-between pt-4 border-t border-foreground/10 dark:border-dark-gray/30'>
                    <span className='text-sm text-white opacity-60 font-okxs'>
                      {brand.productCount} Products
                    </span>
                    <Icon
                      name='arrow-right'
                      className='size-4 text-white group-hover:translate-x-1 transition-transform duration-300'
                    />
                  </div>
                </div>

                {/* Hover Effect */}
                <div className='absolute inset-0 bg-linear-to-br from-brand/0 to-brand/0 group-hover:from-brand/5 group-hover:to-brand/3 transition-all duration-500 rounded-2xl sm:rounded-3xl' />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

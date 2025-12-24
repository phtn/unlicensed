import {StoreProduct} from '@/app/types'
import {Loader} from '@/components/expermtl/loader'
import {api} from '@/convex/_generated/api'
import {useToggle} from '@/hooks/use-toggle'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Button, Image} from '@heroui/react'
import {useQuery} from 'convex/react'
import Link from 'next/link'
import {Activity} from 'react'
import {Tag} from '../../../../components/base44/tag'
import {Title} from '../../../../components/base44/title'

interface CategoryContentProps {
  slug: string
  products: StoreProduct[]
}
export const CategoryContent = ({products, slug}: CategoryContentProps) => {
  const category = useQuery(api.categories.q.getCategoryBySlug, {slug})
  const heroImage = useQuery(
    api.categories.q.getHeroImage,
    category ? {id: category._id} : 'skip',
  )

  const {on: navigating, toggle} = useToggle()

  return (
    <div className='min-h-screen overflow-x-hidden'>
      <Activity mode={products.length === 0 ? 'visible' : 'hidden'}>
        <div className='max-w-7xl h-screen mx-auto pt-28'>
          <Tag text={slug} />
          <div className=' flex flex-col items-center justify-center gap-4 px-6 py-24 text-center'>
            <Title title='Nothing here yet' subtitle='Check back soon' />
          </div>
        </div>
      </Activity>
      <section className='pt-6 sm:pt-8 md:pt-10 lg:pt-14 xl:pt-24 2xl:pt-28 pb-12 sm:pb-16 lg:pb-20 px-4 sm:px-6 bg-background'>
        <div className='max-w-7xl mx-auto overflow-hidden'>
          <div className='grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center'>
            <div className=''>
              <Tag text={slug} />
              <Title title={slug} subtitle='Exotic Flavors' />
              <p className='hidden sm:flex text-sm sm:text-base lg:text-base opacity-60 mb-6 sm:mb-8 lg:mb-12 max-w-md leading-relaxed'>
                Enjoy the beauty of nature with our exquisite flower collection.
                Explore our selection today and discover your soul strain.
              </p>

              <div className='hidden sm:flex items-center gap-3 sm:gap-4 lg:gap-5 relative z-50 flex-wrap'>
                <Button
                  as='a'
                  href={'#'}
                  size='lg'
                  className='dark:bg-white opacity-100 dark:text-dark-gray hover:bg-brand dark:hover:text-white bg-brand hover:text-white text-white font-medium px-4 sm:px-8 py-2 sm:py-3 text-xs sm:text-sm md:text-base lg:text-lg'>
                  <span className='drop-shadow-xs'>Shop by Brand</span>
                </Button>
                <Button
                  size='lg'
                  as={Link}
                  href={'/strain-finder'}
                  prefetch
                  onPress={toggle}
                  variant='light'
                  className='hidden border dark:border-dark-gray sm:flex items-center gap-2 dark:text-brand font-medium bg-light-gray/25 dark:bg-dark-gray/20 px-4 sm:px-8 py-2 sm:py-3 text-xs sm:text-sm md:text-base lg:text-lg'>
                  <span className='tracking-tight'>Strain Finder</span>
                  <Icon
                    name={navigating ? 'spinners-ring' : 'search-magic'}
                    className='w-3 h-3 sm:w-4 sm:h-4 dark:text-white'
                  />
                </Button>
              </div>
            </div>

            <div className='relative flex items-center justify-center lg:justify-end max-h-[40vh] sm:max-h-[45vh] lg:max-h-[50lvh] overflow-visible'>
              {heroImage ? (
                <div
                  id='hero-image'
                  className='h-80 md:h-120 w-full mask-[url("https://res.cloudinary.com/dx0heqhhe/image/upload/v1766560488/chevs_drc0jt.svg")] mask-cover bg-cover bg-center bg-no-repeat'
                  style={{backgroundImage: `url(${heroImage})`}}
                />
              ) : (
                <Loader />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Case Studies Grid */}
      <section className='py-6 sm:py-8 px-4 sm:px-6 pb-20 sm:pb-24 lg:pb-32'>
        <div className='max-w-7xl mx-auto rounded-4xl py-4 px-6 bg-sidebar/40 dark:bg-sidebar'>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 lg:gap-0 w-full'>
            {products.map((product) => (
              <Link
                key={product._id?.substring(-8)}
                href={`/products/${product.slug}`}
                prefetch={true}
                className='group/item cursor-pointer w-full'>
                {/* Product Image */}
                <div className='relative flex items-center justify-center bg-transparent rounded-t-2xl sm:rounded-t-3xl overflow-hidden h-50 sm:h-64 lg:h-54'>
                  <Image
                    src={product.image ?? undefined}
                    alt={product.name}
                    className='mask mask-parallelogram size-50 aspect-square shrink-0 object-cover'
                    loading='lazy'
                  />
                  <div
                    className={`absolute inset-0 bg-linear-to-br group-hover:opacity-70 transition-opacity duration-300`}></div>

                  {/* Metric Badge */}
                  <div className='flex items-center gap-1.5 sm:gap-2 absolute top-3 sm:top-4 lg:top-0 right-3 sm:right-4 lg:right-6'>
                    <span className='hidden group-hover/item:flex bg-foreground/10 backdrop-blur-sm text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-2 rounded-full'>
                      <span className='font-extrabold opacity-70 font-fugaz tracking-wide'>
                        THC
                      </span>
                      <span className='font-space font-medium ml-1'>
                        {product.thcPercentage}%
                      </span>
                    </span>
                    <span className='bg-foreground/5 text-xs px-1 sm:px-1.5 py-1 sm:py-1.5 rounded-full'>
                      <Icon
                        name={
                          product.potencyLevel === 'medium'
                            ? 'strength-medium'
                            : 'strength-high'
                        }
                        className={cn(
                          'size-5 sm:size-6 lg:size-7 -scale-x-100 text-sky-500',
                          {
                            'text-teal-500': product.potencyLevel === 'medium',
                            'text-red-400 scale-x-100':
                              product.potencyLevel === 'high',
                          },
                        )}
                      />
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className='w-full p-3 sm:p-4 _rounded-b-2xl _sm:rounded-b-3xl border-b border-transparent group-hover/item:border-foreground/30'>
                  <div className='flex-1 min-w-0'>
                    <h4 className='flex items-center justify-center text-lg sm:text-base lg:text-lg font-sans font-semibold tracking-tight mb-1'>
                      <span className='capitalize truncate'>
                        {product.name.split('-').join(' ')}
                      </span>
                      <span className='font-light text-base sm:text-lg lg:text-xl whitespace-nowrap'></span>
                    </h4>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

// <img class="mask mask-parallelogram size-25" src="https://cdn.flyonui.com/fy-assets/components/radio/image-1.png" alt="mask image" />

/* Scroll Indicator */
/*
      <div className='hidden _flex justify-end px-6 pb-12'>
        <div className='max-w-7xl w-full flex justify-end'>
          <button className='w-10 h-10 rounded-full flex items-center justify-center hover:text-teal-500 transition-colors'>
            <Icon name='arrow-down' className='w-4 h-4' />
          </button>
        </div>
      </div>
<div className='flex justify-end px-4 sm:px-6 pb-8 sm:pb-10 lg:pb-12 bg-background shadow'>
        <div className='hidden max-w-7xl mx-auto w-full overflow-x-auto h-11 sm:h-14 lg:h-20 bg-foreground/10 lg:rounded-4xl rounded-xl sm:rounded-2xl _flex items-center lg:justify-center gap-2 sm:gap-3 lg:gap-4 px-3 lg:px-0 scrollbar-hide'>
          {[
            'Indica',
            'Sativa',
            'Hybrid',
            'Bestsellers',
            'New',
            'Relaxed',
            'Creative',
            'Sharp',
            'Euphoric',
            'Happy',
            'Sleepy',
            'Wild',
            'Calm',
          ].map((filter, index) => (
            <div
              key={index}
              className='text-white bg-foreground/20 tracking-tight font-sans font-medium px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg sm:rounded-xl text-xs sm:text-sm whitespace-nowrap'>
              {filter}
            </div>
          ))}
        </div>
      </div>
*/

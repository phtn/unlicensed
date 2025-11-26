import {StoreProduct} from '@/app/types'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Button, Image} from '@heroui/react'
import {Lens} from '../ui/lens'
import {Tag} from './tag'
import {Title} from './title'

interface CategoryContentProps {
  slug: string
  products: StoreProduct[]
}
export const CategoryContent = ({products, slug}: CategoryContentProps) => {
  if (products.length === 0) {
    return (
      <div className='min-h-screen flex flex-col items-center justify-center gap-4 px-6 py-24 text-center'>
        <Tag text={slug} />
        <Title title='Nothing here yet' subtitle='Check back soon' />
      </div>
    )
  }
  // const products = [
  //   {
  //     id: 1,
  //     name: 'rainbow-runtz',
  //     thc: '19.73',
  //     priceCents: 1300,
  //     potency: 'medium',
  //     description:
  //       'Experience pure relaxation. This THCa flower converts to regular Delta-9 THC when it&apos;s heated or smoked, and leads to total chill.',
  //     image:
  //       'https://cdn.shopify.com/s/files/1/0693/8119/3966/files/RainbowRuntz_transparent.png?v=1759172011&width=1488',
  //   },
  //   {
  //     id: 2,
  //     name: 'Slurricane',
  //     thc: '16.53',
  //     priceCents: 1700,
  //     potency: 'high',
  //     description:
  //       'Feels like a forest stroll. Chill out with this THCa flower that converts to regular Delta-9 THC when it&apos;s heated or smoked.',
  //     image:
  //       'https://cdn.shopify.com/s/files/1/0693/8119/3966/files/Slurricane_transparent.png?v=1759173573&width=1488',
  //   },
  //   {
  //     id: 3,
  //     name: 'Tangie',
  //     thc: '28.89',
  //     priceCents: 1700,
  //     potency: 'high',
  //     description:
  //       'Sweet tangerine bursts deliver waves of social energy, sparking lively conversation.',
  //     image:
  //       'https://cdn.shopify.com/s/files/1/0693/8119/3966/files/Tangie_PLP_transparent.png?v=1759171330&width=1488',
  //   },
  //   {
  //     id: 4,
  //     name: 'Pluto',
  //     thc: '24.43',
  //     priceCents: 1700,
  //     potency: 'high',
  //     description:
  //       'Cerebral stimulation with deep relaxation for a focused, creative mind and calm body.',
  //     image:
  //       'https://cdn.shopify.com/s/files/1/0693/8119/3966/files/Pluto_transparent.png?v=1759173347&width=1488',
  //   },
  // ]

  return (
    <div className='min-h-screen overflow-x-hidden'>
      {/*<Nav>
        <span className='capitalize'>{slug}</span>
      </Nav>*/}

      {/* Hero Section */}
      <section className='pt-6 sm:pt-8 lg:pt-20 xl:pt-28 pb-12 sm:pb-16 lg:pb-20 px-4 sm:px-6 bg-background'>
        <div className='max-w-7xl mx-auto'>
          <div className='grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center'>
            <div>
              <Tag text={slug} />
              <Title title={slug} subtitle='Extremely Flavorful' />
              <p className='hidden sm:flex text-sm sm:text-base lg:text-lg text-gray-500 mb-6 sm:mb-8 lg:mb-10 max-w-lg leading-relaxed'>
                {/*TODO: Add content here*/}
                Enjoy the beauty of nature with our exquisite flower collection.
                Explore our selection today and discover your soul strain.
              </p>

              <div className='hidden sm:flex items-center gap-3 sm:gap-4 lg:gap-5 relative z-50 flex-wrap'>
                <Button
                  as='a'
                  href={'#'}
                  size='sm'
                  className='capitalize bg-foreground hover:bg-secondary-foreground dark:bg-brand text-white font-medium px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm'>
                  New {slug}
                </Button>
                <Button
                  variant='faded'
                  size='sm'
                  className='flex items-center gap-2 text-xs sm:text-sm'>
                  <span>Strain Finder</span>
                  <Icon name='search' className='w-3 h-3 sm:w-4 sm:h-4' />
                </Button>
              </div>
            </div>

            <div className='relative flex justify-center lg:justify-end max-h-[40vh] sm:max-h-[45vh] lg:max-h-[50lvh] overflow-visible'>
              <Image
                src={products[0].image}
                alt={slug}
                className='w-full aspect-auto object-contain'
                loading='eager'
                sizes='(max-width: 1024px) 100vw, 50vw'
              />
            </div>
          </div>
        </div>
      </section>
      <div className='flex justify-end px-4 sm:px-6 pb-8 sm:pb-10 lg:pb-12 bg-background shadow'>
        <div className='max-w-7xl mx-auto w-full overflow-x-auto h-11 sm:h-14 lg:h-20 bg-foreground/10 lg:rounded-4xl rounded-xl sm:rounded-2xl flex items-center lg:justify-center gap-2 sm:gap-3 lg:gap-4 px-3 lg:px-0 scrollbar-hide'>
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

      {/* Scroll Indicator */}
      <div className='hidden _flex justify-end px-6 pb-12'>
        <div className='max-w-7xl w-full flex justify-end'>
          <button className='w-10 h-10 rounded-full flex items-center justify-center hover:text-teal-500 transition-colors'>
            <Icon name='arrow-down' className='w-4 h-4' />
          </button>
        </div>
      </div>

      {/* Case Studies Grid */}
      <section className='py-6 sm:py-8 px-4 sm:px-6 pb-20 sm:pb-24 lg:pb-32'>
        <div className='max-w-7xl mx-auto'>
          <h2 className='text-2xl sm:text-3xl font-extrabold tracking-tight mb-6 sm:mb-8'>
            Bestsellers
          </h2>
          <div className='grid md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8'>
            {products.map((product) => (
              <div
                key={product._id?.substring(-8)}
                className='group cursor-pointer'>
                {/* Product Image */}
                <div className='relative flex items-center border-t border-x border-foreground/10 bg-transparent p-3 sm:p-4 justify-center rounded-t-2xl sm:rounded-t-3xl overflow-hidden h-64 sm:h-80 lg:h-96'>
                  <Lens lensSize={150}>
                    <Image
                      src={product.image}
                      alt={product.name}
                      className='size-100 aspect-auto object-contain'
                      loading='lazy'
                      sizes='(max-width: 768px) 100vw, 50vw'
                    />
                  </Lens>
                  <div
                    className={`absolute inset-0 bg-linear-to-br group-hover:opacity-70 transition-opacity duration-300`}></div>

                  {/* Metric Badge */}
                  <div className='flex items-center gap-1.5 sm:gap-2 absolute top-3 sm:top-4 lg:top-6 right-3 sm:right-4 lg:right-6'>
                    <span className='bg-foreground/10 backdrop-blur-sm text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-2 rounded-full'>
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
                <div className='flex items-start justify-between p-3 sm:p-4 gap-3 sm:gap-4 bg-foreground/20 border-foreground/30 border rounded-b-2xl sm:rounded-b-3xl'>
                  <div className='flex-1 min-w-0'>
                    <h4 className='flex flex-col sm:flex-row sm:items-center sm:gap-3 lg:gap-4 text-lg sm:text-xl lg:text-2xl font-space font-bold tracking-tight mb-1 sm:mb-2'>
                      <span className='capitalize truncate'>
                        {product.name.split('-').join(' ')}
                      </span>
                      <span className='font-light text-base sm:text-lg lg:text-xl whitespace-nowrap'>
                        ${product.priceCents / 100}
                      </span>
                    </h4>
                    <p className='text-xs sm:text-sm opacity-80 leading-relaxed line-clamp-2'>
                      {product.shortDescription}
                    </p>
                  </div>
                  <Button
                    as='a'
                    href={`/products/${product.slug}`}
                    isIconOnly
                    size='sm'
                    className='rounded-full text-background bg-foreground/80 flex items-center justify-center shrink-0 mt-1'>
                    <Icon
                      name='chevron-right'
                      className='w-3 h-3 sm:w-4 sm:h-4'
                    />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Button, Image} from '@heroui/react'
import {Nav} from './nav'
import {Tag} from './tag'
import {Title} from './title'

interface CategoryContentProps {
  slug: string
}
export const CategoryContent = ({slug}: CategoryContentProps) => {
  const products = [
    {
      id: 1,
      name: 'rainbow-runtz',
      thc: '19.73',
      priceCents: 1300,
      potency: 'medium',
      description:
        'Experience pure relaxation. This THCa flower converts to regular Delta-9 THC when it&apos;s heated or smoked, and leads to total chill.',
      image:
        'https://cdn.shopify.com/s/files/1/0693/8119/3966/files/RainbowRuntz_transparent.png?v=1759172011&width=1488',
    },
    {
      id: 2,
      name: 'Slurricane',
      thc: '16.53',
      priceCents: 1700,
      potency: 'high',
      description:
        'Feels like a forest stroll. Chill out with this THCa flower that converts to regular Delta-9 THC when it&apos;s heated or smoked.',
      image:
        'https://cdn.shopify.com/s/files/1/0693/8119/3966/files/Slurricane_transparent.png?v=1759173573&width=1488',
    },
    {
      id: 3,
      name: 'Tangie',
      thc: '28.89',
      priceCents: 1700,
      potency: 'high',
      description:
        'Sweet tangerine bursts deliver waves of social energy, sparking lively conversation.',
      image:
        'https://cdn.shopify.com/s/files/1/0693/8119/3966/files/Tangie_PLP_transparent.png?v=1759171330&width=1488',
    },
    {
      id: 4,
      name: 'Pluto',
      thc: '24.43',
      priceCents: 1700,
      potency: 'high',
      description:
        'Cerebral stimulation with deep relaxation for a focused, creative mind and calm body.',
      image:
        'https://cdn.shopify.com/s/files/1/0693/8119/3966/files/Pluto_transparent.png?v=1759173347&width=1488',
    },
  ]

  return (
    <div className='min-h-screen'>
      <Nav>
        <span className='capitalize'>{slug}</span>
      </Nav>

      {/* Hero Section */}
      <section className='pt-10 lg:pt-28 pb-20 px-6 bg-accent'>
        <div className='max-w-7xl mx-auto'>
          <div className='grid lg:grid-cols-2 gap-12 items-center'>
            <div>
              <Tag text={slug} />
              <Title title='Flower' subtitle='Extremely Flavorful' />
              <p className='hidden lg:flex text-lg text-gray-500 mb-10 max-w-lg leading-relaxed'>
                {/*TODO: Add content here*/}
                Enjoy the beauty of nature with our exquisite flower collection.
                Explore our selection today and discover your soul strain.
              </p>

              <div className='hidden lg:flex items-center md:gap-4 lg:gap-5 relative z-50'>
                <Button
                  as='a'
                  href={'#'}
                  className='bg-foreground hover:bg-secondary-foreground text-white font-medium px-6 py-3'>
                  New Flowers
                </Button>
                <Button variant='faded' className='flex items-center gap-2'>
                  <span>Strain Finder</span>
                  <Icon name='search' className='w-4 h-4' />
                </Button>
              </div>
            </div>

            <div className='relative flex justify-end max-h-[50lvh] overflow-hidden'>
              <Image
                src='https://cdn.shopify.com/s/files/1/0693/8119/3966/files/IceCreamCake_transparent.png?v=1759173178&width=1488'
                alt='Beautiful flower'
                className='w-full aspect-auto'
              />
            </div>
            <div className='lg:hidden flex items-center justify-center gap-4 lg:gap-5 relative z-50'>
              <Button
                as='a'
                href={'#'}
                className='bg-foreground hover:bg-secondary-foreground text-white font-medium px-6 py-3'>
                New Flowers
              </Button>
              <Button variant='faded' className='flex items-center gap-2'>
                <span>Strain Finder</span>
                <Icon name='search' className='w-4 h-4' />
              </Button>
            </div>
          </div>
        </div>
      </section>
      <div className='flex justify-end px-6 pb-12 bg-accent shadow'>
        <div className='max-w-7xl mx-auto w-full overflow-auto h-12 lg:h-20 bg-foreground/10 lg:rounded-4xl rounded-2xl flex items-center lg:justify-center gap-4 px-3 lg:px-0'>
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
              className='text-white bg-foreground/20 tracking-tight font-sans font-medium px-3 py-1 rounded-xl'>
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
      <section className='py-6 px-6 pb-32'>
        <div className='max-w-7xl mx-auto'>
          <h2 className='text-3xl font-extrabold tracking-tight mb-8'>
            Bestsellers
          </h2>
          <div className='grid md:grid-cols-2 gap-8'>
            {products.map((product) => (
              <div key={product.id} className='group cursor-pointer'>
                {/* Product Image */}
                <div className='relative flex items-center border-t border-x border-foreground/10 bg-transparent p-4 justify-center rounded-t-3xl overflow-hidden h-96'>
                  <Image
                    src={product.image}
                    alt={product.name}
                    className='size-100 aspect-auto object-contain'
                  />
                  <div
                    className={`absolute inset-0 bg-linear-to-br group-hover:opacity-70 transition-opacity duration-300`}></div>

                  {/* Metric Badge */}
                  <div className='flex items-center gap-2 absolute top-6 right-6'>
                    <span className='bg-foreground/10 backdrop-blur-sm text-xs px-3 py-2 rounded-full'>
                      <span className='font-extrabold opacity-70'>THC</span>
                      <span className='font-space font-medium ml-1'>
                        {product.thc}%
                      </span>
                    </span>
                    <span className='bg-foreground/5 text-xs px-1.5 py-1.5 rounded-full'>
                      <Icon
                        name='strength'
                        className={cn('size-6', {
                          'text-green-600': product.potency === 'medium',
                          'text-red-400 -scale-x-100':
                            product.potency === 'high',
                        })}
                      />
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className='flex items-start justify-between p-4 gap-4 bg-foreground/20 border-foreground/30 border rounded-b-3xl'>
                  <div>
                    <h4 className='flex items-center gap-4 text-2xl font-space font-bold tracking-tight mb-2'>
                      <span className='capitalize'>
                        {product.name.split('-').join(' ')}
                      </span>
                      <span className='font-light text-xl'>
                        ${product.priceCents / 100}
                      </span>
                    </h4>
                    <p className='text-sm opacity-80 leading-relaxed'>
                      {product.description}
                    </p>
                  </div>
                  <Button
                    as='a'
                    href={`/products/${product.name}`}
                    isIconOnly
                    className='rounded-full text-background bg-foreground/80 flex items-center justify-center shrink-0 mt-1'>
                    <Icon name='chevron-right' className='w-4 h-4' />
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

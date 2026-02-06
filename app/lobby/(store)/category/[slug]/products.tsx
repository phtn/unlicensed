import {StoreProduct} from '@/app/types'
import {Tag} from '@/components/base44/tag'
import {Title} from '@/components/base44/title'
import {Loader} from '@/components/expermtl/loader'
import {EmptyCategory} from '@/components/store/empty-category'
import {ProductCard} from '@/components/store/product-card'
import {api} from '@/convex/_generated/api'
import {useToggle} from '@/hooks/use-toggle'
import {Icon} from '@/lib/icons'
import {Button} from '@heroui/react'
import {useQuery} from 'convex/react'
import Link from 'next/link'
import {Activity, ViewTransition} from 'react'

interface ProductsProps {
  slug: string
  products: StoreProduct[]
}
export const Products = ({products, slug}: ProductsProps) => {
  const category = useQuery(api.categories.q.getCategoryBySlug, {slug})
  const categories = useQuery(api.categories.q.listCategories)
  const heroImage = useQuery(
    api.categories.q.getHeroImage,
    category ? {id: category._id} : 'skip',
  )

  const {on: navigating, toggle} = useToggle()

  return (
    <div className='min-h-screen overflow-x-hidden'>
      <section className='pt-6 sm:pt-8 md:pt-10 lg:pt-14 xl:pt-24 2xl:pt-28 pb-12 sm:pb-16 lg:pb-20 px-4 sm:px-6 bg-background'>
        <div className='max-w-7xl mx-auto overflow-hidden'>
          <div className='grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center'>
            <div className=''>
              <Tag text={slug} />
              <Title title={slug} subtitle={category?.highlight} />
              <p className='hidden sm:flex text-sm sm:text-base lg:text-base opacity-60 mb-6 sm:mb-8 lg:mb-12 max-w-md leading-relaxed'>
                Enjoy the beauty of nature with our exquisite flower collection.
                Explore our selection today and discover your soul strain.
              </p>

              <div className='hidden sm:flex items-center gap-3 sm:gap-4 lg:gap-5 relative z-50 flex-wrap'>
                <Button
                  size='lg'
                  as={Link}
                  href={'/lobby/brands'}
                  prefetch
                  className='dark:bg-white opacity-100 dark:text-dark-gray hover:bg-brand dark:hover:text-white bg-brand hover:text-white text-white font-medium px-4 sm:px-8 py-2 sm:py-3 text-xs sm:text-sm md:text-base lg:text-lg'>
                  <span className='drop-shadow-xs'>Shop by Brand</span>
                </Button>
                <Button
                  size='lg'
                  as={Link}
                  href={'/lobby/strain-finder'}
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

            <div className='relative flex items-center justify-center lg:justify-end h-[40vh] sm:h-[45vh] lg:h-[50lvh] overflow-visible'>
              <ViewTransition enter='auto'>
                {heroImage ? (
                  <div
                    id='hero-image'
                    className='h-80 md:h-120 w-full mask-[url("https://res.cloudinary.com/dx0heqhhe/image/upload/v1766560488/chevs_drc0jt.svg")] mask-cover bg-cover bg-center bg-no-repeat'
                    style={{backgroundImage: `url(${heroImage})`}}
                  />
                ) : (
                  <div className='size-full flex justify-center'>
                    <Loader />
                  </div>
                )}
              </ViewTransition>
            </div>
          </div>
        </div>
      </section>

      {/* Case Studies Grid */}
      <section className='py-6 sm:py-8 px-4 sm:px-6 pb-20 sm:pb-24 lg:pb-32'>
        <div className='max-w-7xl mx-auto rounded-[3.5rem] md:p-6 bg-sidebar/40 dark:bg-transparent dark:md:bg-sidebar'>
          <Activity mode={products.length === 0 ? 'visible' : 'hidden'}>
            <EmptyCategory />
          </Activity>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6 lg:gap-6 w-full'>
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </div>
      </section>
      <section className='py-12 sm:py-16 lg:py-20 px-4 sm:px-6 max-w-7xl mx-auto'>
        <div className='flex flex-col gap-20'>
          <div className='flex flex-wrap items-center justify-between gap-4'>
            <div className='space-y-1'>
              <h2 className='text-xl font-polysans font-semibold tracking-tight sm:text-5xl'>
                Browse Category
              </h2>
            </div>
            <div className='w-full md:w-fit flex items-center justify-between gap-2'>
              {categories
                ?.filter((cat) => cat.slug !== slug)
                .map((cat) => (
                  <Button
                    key={cat._id}
                    size='sm'
                    as={Link}
                    href={`/lobby/category/${cat.slug}`}
                    prefetch
                    className='dark:bg-white opacity-100 dark:text-dark-gray hover:bg-brand dark:hover:text-white bg-foreground hover:text-white text-white font-medium px-5 py-5 text-base lg:text-lg capitalize tracking-tighter'>
                    <span className='drop-shadow-xs'>{cat.name}</span>
                  </Button>
                ))}
            </div>
          </div>
        </div>
      </section>
      <div className='flex justify-center w-full px-4 md:hidden pb-20'>
        <Button
          size='lg'
          as={Link}
          href={'/lobby/brands'}
          fullWidth
          className='dark:bg-white h-14 opacity-100 dark:text-dark-gray md:hover:bg-brand dark:hover:text-white bg-brand md:hover:text-white text-white font-polysans font-medium px-4 sm:px-8 py-2 sm:py-3 text-lg'>
          <span className='drop-shadow-xs'>Shop by Brand</span>
        </Button>
      </div>
    </div>
  )
}

'use client'

import {StoreProduct} from '@/app/types'
import {Tag} from '@/components/base44/tag'
import {Title, TitleV4} from '@/components/base44/title'
import {ProductCard} from '@/components/store/product-card'
import {api} from '@/convex/_generated/api'
import {useStorageUrls} from '@/hooks/use-storage-urls'
import {adaptProduct} from '@/lib/convexClient'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Button, Image} from '@heroui/react'
import {useQuery} from 'convex/react'
import Link from 'next/link'
import {parseAsString, useQueryState} from 'nuqs'
import {Activity, useMemo} from 'react'

interface Brand {
  name: string
  slug: string
  icon: string
  description?: string
  featured?: boolean
}

interface EnhancedBrand extends Brand {
  productCount: number
}

const brands: Brand[] = [
  {
    name: 'CBX',
    slug: 'cbx',
    icon: '/svg/cbx.svg',
    description: 'Premium quality meets exceptional craftsmanship',
    featured: true,
  },
  {
    name: 'Wizard Trees',
    slug: 'wizard-trees',
    icon: '/svg/wizard-trees.svg',
    description: 'Magical strains for the discerning connoisseur',
    featured: true,
  },
  {
    name: 'Jungle Boys',
    slug: 'jungle-boys',
    icon: '/svg/jungle-boys.svg',
    description: 'Cultivated excellence from seed to harvest',
    featured: false,
  },
  {
    name: 'Heirbloom',
    slug: 'heirbloom',
    icon: '/svg/heirbloom.svg',
    description: 'Legacy genetics, modern innovation',
    featured: false,
  },
]

export const Content = () => {
  const [selectedBrandId, setSelectedBrandId] = useQueryState(
    'id',
    parseAsString.withDefault(''),
  )
  const productsQuery = useQuery(api.products.q.listProducts, {limit: 100})
  const selectedBrandProductsQuery = useQuery(
    api.products.q.listProducts,
    selectedBrandId ? {brand: selectedBrandId, limit: 24} : 'skip',
  )
  const getProductBrands = (brands?: string | string[]) =>
    Array.isArray(brands) ? brands : brands ? [brands] : []

  // Group products by brand and count them
  const brandCounts = useMemo(() => {
    if (!productsQuery) return new Map<string, number>()
    const counts = new Map<string, number>()
    productsQuery.forEach((product) => {
      getProductBrands(product.brand).forEach((brand) => {
        const brandSlug = brand.toLowerCase().replace(/\s+/g, '-')
        counts.set(brandSlug, (counts.get(brandSlug) || 0) + 1)
      })
    })
    return counts
  }, [productsQuery])

  // Enhance brands with product counts
  const enhancedBrands = useMemo<EnhancedBrand[]>(() => {
    return brands.map((brand) => ({
      ...brand,
      productCount: brandCounts.get(brand.slug) || 0,
    }))
  }, [brandCounts])

  const featuredBrands = enhancedBrands.filter((b) => b.featured)
  const selectedBrand =
    enhancedBrands.find((brand) => brand.slug === selectedBrandId) ?? null
  const selectedBrandProducts = useMemo<StoreProduct[]>(() => {
    return selectedBrandProductsQuery?.map(adaptProduct) ?? []
  }, [selectedBrandProductsQuery])
  const isSelectedBrandLoading =
    selectedBrandId !== '' && selectedBrandProductsQuery === undefined
  const selectedBrandImageIds = useMemo(
    () =>
      selectedBrandProducts
        .map((product) => product.image)
        .filter(
          (image): image is string => !!image && !image.startsWith('http'),
        ),
    [selectedBrandProducts],
  )
  const resolveSelectedBrandImage = useStorageUrls(selectedBrandImageIds)
  const selectedBrandProductsWithImages = useMemo(
    () =>
      selectedBrandProducts.map((product) => {
        if (!product.image) {
          return product
        }

        const resolvedUrl = resolveSelectedBrandImage(product.image)
        const imageUrl =
          resolvedUrl && resolvedUrl.startsWith('http')
            ? resolvedUrl
            : product.image.startsWith('http')
              ? product.image
              : null

        return {
          ...product,
          image: imageUrl,
        }
      }),
    [selectedBrandProducts, resolveSelectedBrandImage],
  )

  const toggleBrand = (brandSlug: string) => {
    void setSelectedBrandId(brandSlug === selectedBrandId ? null : brandSlug)
  }

  return (
    <div className='min-h-screen pt-16 sm:pt-20 md:pt-24 lg:pt-28 xl:pt-28 pb-16 sm:pb-20 lg:pb-24 px-4 sm:px-6 overflow-x-hidden bg-background'>
      {selectedBrand && (
        <section className='px-4 sm:px-6 pb-10 sm:pb-14 lg:pb-16'>
          <div className='max-w-7xl mx-auto'>
            <div className='mb-6 sm:mb-8 flex flex-col gap-4'>
              <div className='space-y-4'>
                <Tag text={selectedBrand.name} />
                <TitleV4
                  title={`${selectedBrand.name}`}
                  subtitle={
                    <div>
                      Found <span className='opacity-50 font-ios ml-2'>(</span>
                      {selectedBrandProductsWithImages.length}
                      <span className='opacity-50 font-ios mr-2'>)</span>{' '}
                      product
                      {selectedBrandProductsWithImages.length !== 1 ? 's' : ''}
                    </div>
                  }
                />
              </div>
              <div className='flex flex-wrap items-center gap-3'>
                <Button
                  size='lg'
                  as={Link}
                  radius='none'
                  href={`/lobby/products?brand=${selectedBrand.slug}`}
                  className='dark:bg-white opacity-100 dark:text-dark-gray md:hover:bg-brand dark:hover:text-white bg-brand md:hover:text-white text-white font-polysans font-medium px-6 sm:px-8 py-3 sm:py-4 text-base'>
                  <span className='drop-shadow-xs'>All Products</span>
                </Button>
                <Button
                  size='lg'
                  variant='light'
                  radius='none'
                  onPress={() => void setSelectedBrandId(null)}
                  className='border dark:border-light-gray/40 font-polysans font-medium bg-light-gray/25 dark:bg-dark-gray/20 px-4 sm:px-8 py-2 sm:py-3 text-base lg:text-lg'>
                  <span className='tracking-tight'>Clear selection</span>
                </Button>
              </div>
            </div>

            {isSelectedBrandLoading && (
              <div className='rounded-lg border border-foreground/10 dark:border-dark-gray/40 bg-sidebar/30 px-6 py-16 text-center'>
                <div className='flex items-center justify-center gap-3 text-sm sm:text-base opacity-70'>
                  <Icon name='spinners-ring' className='size-4 animate-spin' />
                  <span>Loading {selectedBrand.name} products...</span>
                </div>
              </div>
            )}

            {selectedBrandProductsWithImages.length > 0 && (
              <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-6'>
                {selectedBrandProductsWithImages.map((product) => (
                  <ProductCard
                    key={product._id ?? product.slug}
                    product={product}
                    imageUrl={product.image}
                  />
                ))}
              </div>
            )}

            {!isSelectedBrandLoading &&
              selectedBrandProductsWithImages.length === 0 && (
                <div className='rounded-lg border border-foreground/10 dark:border-dark-gray/40 bg-sidebar/30 px-6 py-16 text-center'>
                  <p className='text-sm sm:text-base opacity-70'>
                    No products are currently available for {selectedBrand.name}
                    .
                  </p>
                </div>
              )}
          </div>
        </section>
      )}
      {/* Hero Section - Asymmetric Layout */}
      <section className='relative'>
        <div className='max-w-7xl mx-auto'>
          {/* Header */}
          <div className='mb-12 sm:mb-16 lg:mb-20'>
            <Tag text='Brands' />
            <Title
              title='Curated Excellence'
              subtitle='Partner Brands We Trust'
            />
            <p className='hidden text-sm sm:text-base lg:text-lg opacity-60 mt-6 sm:mt-8 max-w-2xl leading-relaxed'>
              Each brand in our collection represents a commitment to quality,
              innovation, and the highest standards of cultivation. Discover the
              stories behind the names that define excellence.
            </p>
          </div>

          {/* Featured Brands - Large Showcase */}
          <div className='grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 mb-12 sm:mb-16'>
            {featuredBrands.map((brand, index) => (
              <button
                type='button'
                key={brand.slug}
                onClick={() => toggleBrand(brand.slug)}
                aria-pressed={selectedBrandId === brand.slug}
                className={cn(
                  'group relative overflow-hidden rounded-3xl sm:rounded-4xl bg-sidebar/40 dark:bg-sidebar border border-foreground/10 dark:border-dark-gray/50 transition-all duration-500 hover:border-foreground/30 hover:shadow-2xl',
                  selectedBrandId === brand.slug &&
                    'border-brand shadow-2xl shadow-brand/10',
                  index === 0 && 'lg:row-span-2',
                )}>
                <div
                  className={cn(
                    'relative flex flex-col p-8 sm:p-10 lg:p-12 min-h-75 sm:min-h-100 lg:min-h-125',
                    index === 0 && 'lg:min-h-150',
                  )}>
                  {/* Background Pattern */}
                  <div className='absolute inset-0 opacity-5 dark:opacity-10'>
                    <div className='absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.1),transparent_70%)]' />
                  </div>

                  {/* Brand Logo */}
                  <div className='relative z-10 mb-6 sm:mb-8 shrink-0'>
                    <div className='relative w-32 sm:w-40 lg:w-48 h-20 sm:h-24 lg:h-28'>
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
                      <h3 className='text-2xl sm:text-3xl lg:text-4xl font-polysans font-bold mb-3 sm:mb-4 capitalize'>
                        {brand.name}
                      </h3>
                      {brand.description && (
                        <p className='text-sm sm:text-base opacity-70 mb-4 sm:mb-6 leading-relaxed max-w-md'>
                          {brand.description}
                        </p>
                      )}
                    </div>

                    {/* Product Count & CTA */}
                    <div className='flex items-center justify-between pt-6 border-t border-foreground/10 dark:border-dark-gray/30'>
                      <div className='flex items-center gap-2'>
                        <span className='text-xs sm:text-sm opacity-60 font-medium'>
                          {brand.productCount} Products
                        </span>
                      </div>
                      <div className='flex items-center gap-2 text-brand group-hover:gap-3 transition-all duration-300'>
                        <span className='text-sm sm:text-base font-medium'>
                          Explore
                        </span>
                        <Icon name='arrow-right' className='size-4 sm:size-5' />
                      </div>
                    </div>
                  </div>

                  {/* Hover Effect Overlay */}
                  <div className='absolute inset-0 bg-linear-to-br from-brand/0 via-brand/0 to-brand/0 group-hover:from-brand/5 group-hover:via-brand/3 group-hover:to-brand/5 transition-all duration-500 rounded-3xl sm:rounded-4xl' />
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Regular Brands Grid - Masonry Style */}
      <section className='py-6 sm:py-8 px-4 sm:px-6 pb-20 sm:pb-24 lg:pb-32'>
        <div className='max-w-7xl mx-auto'>
          <div className='mb-8 sm:mb-12'>
            <h2 className='text-xl sm:text-2xl lg:text-3xl font-polysans font-bold mb-2'>
              All Brands
            </h2>
            <p className='text-sm sm:text-base opacity-60'>
              Explore our complete collection of trusted partners
            </p>
          </div>

          <Activity mode={enhancedBrands.length === 0 ? 'visible' : 'hidden'}>
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
            {enhancedBrands.map((brand, index) => (
              <button
                type='button'
                key={brand.slug}
                onClick={() => toggleBrand(brand.slug)}
                aria-pressed={selectedBrandId === brand.slug}
                className={cn(
                  'group relative overflow-hidden rounded-2xl sm:rounded-3xl border border-foreground/10 dark:border-dark-gray/50 transition-all duration-500 hover:border-foreground/30 hover:shadow-xl',
                  selectedBrandId === brand.slug &&
                    'border-brand shadow-xl shadow-brand/10',
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
                      <h3 className='text-xl sm:text-2xl text-brand font-polysans font-bold mb-2 sm:mb-3 capitalize'>
                        {brand.name}
                      </h3>
                      {brand.description && (
                        <p className='text-xs sm:text-sm opacity-70 mb-4 leading-relaxed line-clamp-2'>
                          {brand.description}
                        </p>
                      )}
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
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className='py-12 sm:py-16 lg:py-20 px-4 sm:px-6'>
        <div className='max-w-4xl mx-auto text-center'>
          <div className='rounded-3xl sm:rounded-4xl bg-sidebar/40 dark:bg-sidebar border border-foreground/10 dark:border-dark-gray/50 p-8 sm:p-12 lg:p-16'>
            <h2 className='text-xl sm:text-3xl lg:text-4xl font-polysans font-bold mb-4 sm:mb-6 portrait:max-w-[15ch]'>
              Looking for something specific?
            </h2>
            <p className='text-sm sm:text-base lg:text-lg opacity-70 mb-6 sm:mb-8 max-w-2xl mx-auto'>
              Try our Strain-Finder to discover products that match your
              preferences.
            </p>
            <div className='flex flex-col sm:flex-row items-center justify-center gap-4'>
              <Button
                as={Link}
                href='/lobby/strain-finder'
                prefetch
                size='lg'
                endContent={
                  <Icon
                    name='search-magic'
                    className='dark:text-brand text-white'
                  />
                }
                className='dark:bg-white opacity-100 dark:text-dark-gray md:hover:bg-brand dark:hover:text-white bg-brand md:hover:text-white text-white font-polysans font-medium px-6 sm:px-8 py-3 sm:py-4 text-base'>
                <span className='drop-shadow-xs'>Strain Finder</span>
              </Button>

              <Button
                size='lg'
                as={Link}
                href={'/lobby/products'}
                prefetch
                variant='light'
                endContent={
                  <Icon name={'search'} className='dark:text-white' />
                }
                className='border dark:border-light-gray/40 sm:flex items-center gap-2 font-polysans font-medium bg-light-gray/25 dark:bg-dark-gray/20 px-4 sm:px-8 py-2 sm:py-3 text-base lg:text-lg'>
                <span className='tracking-tight'>Advanced Search</span>
              </Button>
              <Button
                as={Link}
                href='/lobby/deals'
                prefetch
                size='lg'
                endContent={<Icon name='box-bold' className=' text-white' />}
                className='bg-terpenes opacity-100 text-white font-polysans font-medium px-6 sm:px-8 py-3 sm:py-4 text-base'>
                <span className='drop-shadow-xs'>Find Deals</span>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

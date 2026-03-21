'use client'

import {Products} from '@/app/lobby/(store)/category/[slug]/products'
import {StoreProduct} from '@/app/types'
import {Tag} from '@/components/base44/tag'
import {Title} from '@/components/base44/title'
import {Loader} from '@/components/expermtl/loader'
import {api} from '@/convex/_generated/api'
import {useStorageUrls} from '@/hooks/use-storage-urls'
import {useToggle} from '@/hooks/use-toggle'
import {adaptProduct} from '@/lib/convexClient'
import {Icon} from '@/lib/icons'
import {resolveProductImage} from '@/lib/resolve-product-image'
import {cn} from '@/lib/utils'
import {Button} from '@heroui/react'
import {usePaginatedQuery, useQuery} from 'convex/react'
import {AnimatePresence, motion, useReducedMotion} from 'motion/react'
import Link from 'next/link'
import {parseAsString, useQueryState} from 'nuqs'
import {useCallback, useEffect, useMemo, useRef, ViewTransition} from 'react'
import {CATEGORY_PRODUCTS_PAGE_SIZE} from './constants'

interface ContentProps {
  slug: string
  initialProducts: StoreProduct[]
}

const COLLAPSED_BRAND_COUNT = 1

export const Content = ({initialProducts, slug}: ContentProps) => {
  const shouldReduceMotion = useReducedMotion()
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const [brand, setBrand] = useQueryState(
    'brand',
    parseAsString.withDefault(''),
  )
  const [productType] = useQueryState(
    'productType',
    parseAsString.withDefault(''),
  )
  const [tier, setTier] = useQueryState('tier', parseAsString.withDefault(''))
  const [subcategory, setSubcategory] = useQueryState(
    'subcategory',
    parseAsString.withDefault(''),
  )

  const category = useQuery(api.categories.q.getCategoryBySlug, {slug})
  const categories = useQuery(api.categories.q.listCategories)
  const heroImage = useQuery(
    api.categories.q.getHeroImage,
    category ? {id: category._id} : 'skip',
  )

  const hasActiveProductFilters =
    brand !== '' || productType !== '' || tier !== '' || subcategory !== ''

  const {
    results: paginatedProductResults,
    status: paginatedProductsStatus,
    loadMore: loadMoreProducts,
  } = usePaginatedQuery(
    api.products.q.listCategoryProductsPaginated,
    {
      brand: brand || undefined,
      categorySlug: slug,
      productType: productType || undefined,
      subcategory: subcategory || undefined,
      tier: tier || undefined,
    },
    {initialNumItems: CATEGORY_PRODUCTS_PAGE_SIZE},
  )

  const paginatedProducts = useMemo(
    () =>
      paginatedProductResults.map((product) => adaptProduct(product, category)),
    [category, paginatedProductResults],
  )

  const products = useMemo(() => {
    if (
      !hasActiveProductFilters &&
      paginatedProductsStatus === 'LoadingFirstPage' &&
      paginatedProducts.length === 0
    ) {
      return initialProducts
    }

    return paginatedProducts
  }, [
    hasActiveProductFilters,
    initialProducts,
    paginatedProducts,
    paginatedProductsStatus,
  ])

  const filterOptions = useMemo(() => {
    const brands = (category?.brands ?? [])
      .map((entry) => ({value: entry.slug, label: entry.name}))
      .sort((a, b) => a.label.localeCompare(b.label))

    const tiers = (category?.tiers ?? [])
      .map((entry) => ({value: entry.slug, label: entry.name}))
      .sort((a, b) => a.label.localeCompare(b.label))

    const subcategories = (category?.subcategories ?? [])
      .map((entry) => ({value: entry.slug, label: entry.name}))
      .sort((a, b) => a.label.localeCompare(b.label))

    return {
      brands,
      tiers,
      subcategories,
    }
  }, [category])

  const {on: isBrandListExpanded, toggle: toggleBrandList} = useToggle()

  const primaryBrandOptions = useMemo(() => {
    if (filterOptions.brands.length <= COLLAPSED_BRAND_COUNT) {
      return filterOptions.brands
    }

    const initialBrands = filterOptions.brands.slice(0, COLLAPSED_BRAND_COUNT)
    if (isBrandListExpanded) {
      return initialBrands
    }

    if (!brand || initialBrands.some((entry) => entry.value === brand)) {
      return initialBrands
    }

    const selectedBrand = filterOptions.brands.find(
      (entry) => entry.value === brand,
    )

    if (!selectedBrand) {
      return initialBrands
    }

    return [...initialBrands.slice(0, COLLAPSED_BRAND_COUNT - 1), selectedBrand]
  }, [brand, filterOptions.brands, isBrandListExpanded])

  const overflowBrandOptions = useMemo(() => {
    if (filterOptions.brands.length <= COLLAPSED_BRAND_COUNT) {
      return []
    }

    const primaryValues = new Set(
      primaryBrandOptions.map((brandOption) => brandOption.value),
    )

    return filterOptions.brands.filter(
      (brandOption) => !primaryValues.has(brandOption.value),
    )
  }, [filterOptions.brands, primaryBrandOptions])

  const hasCollapsibleBrands =
    filterOptions.brands.length > COLLAPSED_BRAND_COUNT
  const hiddenBrandCount = overflowBrandOptions.length

  const canLoadMoreProducts = paginatedProductsStatus === 'CanLoadMore'
  const isLoadingMoreProducts = paginatedProductsStatus === 'LoadingMore'
  const isLoadingInitialProducts =
    paginatedProductsStatus === 'LoadingFirstPage' &&
    (hasActiveProductFilters || initialProducts.length === 0)

  useEffect(() => {
    if (!canLoadMoreProducts) return

    const currentTarget = loadMoreRef.current
    if (!currentTarget) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadMoreProducts(CATEGORY_PRODUCTS_PAGE_SIZE)
        }
      },
      {rootMargin: '640px 0px'},
    )

    observer.observe(currentTarget)

    return () => {
      observer.disconnect()
    }
  }, [canLoadMoreProducts, loadMoreProducts])

  const imageIds = useMemo(
    () =>
      products
        .filter(
          (product) => !!product.image && !product.image.startsWith('http'),
        )
        .map((product) => product.image),
    [products],
  )
  const resolveUrl = useStorageUrls(imageIds)
  const getImageUrl = useCallback(
    (image: string | null | undefined) =>
      resolveProductImage(image, resolveUrl),
    [resolveUrl],
  )

  const {on: navigating, toggle: toggleNavigating} = useToggle()

  return (
    <div className='min-h-screen overflow-x-hidden'>
      <section className='pt-6 sm:pt-8 md:pt-10 lg:pt-14 xl:pt-24 2xl:pt-28 pb-2 sm:pb-16 lg:pb-20 px-4 sm:px-6 bg-background'>
        <div className='max-w-7xl mx-auto overflow-hidden'>
          <div className='grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center'>
            <div className=''>
              <Tag text={slug} />
              <Title title={slug} subtitle={category?.highlight} />
              <p className='hidden md:flex text-sm sm:text-base lg:text-base opacity-60 mb-6 sm:mb-8 lg:mb-12 max-w-md leading-relaxed'>
                {category?.description}
              </p>

              <div className='hidden md:flex items-center gap-3 sm:gap-4 lg:gap-5 relative z-50 flex-wrap'>
                <Button
                  size='lg'
                  as={Link}
                  prefetch
                  radius='none'
                  href={'/lobby/brands'}
                  className='dark:bg-white opacity-100 dark:text-dark-gray hover:bg-brand rounded-xs dark:hover:text-white bg-brand hover:text-white text-white font-clash font-medium px-4 sm:px-8 py-2 sm:py-3 text-xs sm:text-sm md:text-base lg:text-lg'>
                  <span className='drop-shadow-xs'>Shop by Brand</span>
                </Button>
                <Button
                  size='lg'
                  as={Link}
                  prefetch
                  radius='none'
                  variant='light'
                  onPress={toggleNavigating}
                  href={'/lobby/deals'}
                  className='hidden border dark:border-light-gray/80 sm:flex rounded-xs items-center gap-2 dark:text-terpenes font-medium bg-light-gray/25 dark:bg-dark-gray/20 px-4 sm:px-8 py-2 sm:py-3 text-xs sm:text-sm md:text-base lg:text-lg'>
                  <span className='tracking-tight'>Find Deals</span>
                  <Icon
                    name={navigating ? 'spinners-ring' : 'search-magic'}
                    className='w-3 h-3 sm:w-4 sm:h-4 dark:text-white'
                  />
                </Button>
              </div>
            </div>

            <div className='relative items-center justify-center lg:justify-end flex flex-col sm:flex-row md:h-[40vh] lg:h-[50lvh] overflow-visible'>
              <ViewTransition enter='auto' exit='auto'>
                {heroImage ? (
                  <div
                    id='hero-image'
                    className='hidden md:flex md:h-120 w-full mask-[url("https://res.cloudinary.com/dx0heqhhe/image/upload/v1766560488/chevs_drc0jt.svg")] mask-cover bg-cover bg-center bg-no-repeat'
                    style={{backgroundImage: `url(${heroImage})`}}
                  />
                ) : (
                  <div className='w-full h-96 flex items-center justify-center'>
                    <div className='scale-40'>
                      <Loader className='scale=20' />
                    </div>
                  </div>
                )}
              </ViewTransition>
            </div>
          </div>
        </div>
      </section>

      {(filterOptions.brands.length > 0 ||
        filterOptions.tiers.length > 0 ||
        filterOptions.subcategories.length > 0) && (
        <section className='px-4 sm:px-6 pb-4'>
          <div className='max-w-7xl mx-auto flex flex-col gap-3'>
            {filterOptions.tiers.length > 0 && (
              <div className='flex flex-wrap items-center gap-1'>
                <span className='text-sm font-clash font-semibold mr-2 uppercase'>
                  Tiers
                </span>
                <Button
                  size='sm'
                  radius='none'
                  variant={tier === '' ? 'solid' : 'flat'}
                  className={cn('min-w-0 h-6 font-bold uppercase', {
                    'bg-brand text-white': tier === '',
                  })}
                  onPress={() => setTier('')}>
                  All
                </Button>
                {filterOptions.tiers.map((tierOption) => (
                  <Button
                    key={tierOption.value}
                    size='sm'
                    radius='none'
                    variant={tier === tierOption.value ? 'solid' : 'flat'}
                    className={cn('min-w-0 h-6 font-semibold uppercase', {
                      'bg-brand text-white': tier === tierOption.value,
                    })}
                    onPress={() => setTier(tierOption.value)}>
                    {tierOption.label}
                  </Button>
                ))}
              </div>
            )}
            {filterOptions.subcategories.length > 0 && (
              <div className='flex flex-wrap items-center gap-2 mt-0.5'>
                <span className='text-sm font-clash font-semibold mr-2 uppercase'>
                  Subcategory
                </span>
                <Button
                  size='sm'
                  radius='none'
                  variant={subcategory === '' ? 'solid' : 'flat'}
                  className={cn('min-w-0 h-6 font-bold uppercase', {
                    'bg-brand text-white': subcategory === '',
                  })}
                  onPress={() => setSubcategory('')}>
                  All
                </Button>
                {filterOptions.subcategories.map((subcategoryOption) => (
                  <Button
                    key={subcategoryOption.value}
                    size='sm'
                    radius='none'
                    variant={
                      subcategory === subcategoryOption.value ? 'solid' : 'flat'
                    }
                    className={cn('min-w-0 h-6 font-semibold uppercase', {
                      'bg-brand text-white':
                        subcategory === subcategoryOption.value,
                    })}
                    onPress={() => setSubcategory(subcategoryOption.value)}>
                    {subcategoryOption.label}
                  </Button>
                ))}
              </div>
            )}
            {filterOptions.brands.length > 0 && (
              <div className='grid min-h-22 gap-1.5 sm:grid-cols-[auto_1fr] sm:items-start'>
                <div className='flex flex-col gap-1.5'>
                  <div className='flex flex-wrap items-center gap-1'>
                    <span className='text-sm font-clash font-semibold uppercase sm:pt-1'>
                      Brand
                    </span>
                    <Button
                      size='sm'
                      radius='none'
                      variant={brand === '' ? 'solid' : 'flat'}
                      className={cn('min-w-0 h-6 font-bold uppercase', {
                        'bg-brand text-white': brand === '',
                      })}
                      onPress={() => setBrand('')}>
                      All
                    </Button>
                    {primaryBrandOptions.map((brandOption) => (
                      <Button
                        key={brandOption.value}
                        size='sm'
                        radius='none'
                        variant={brand === brandOption.value ? 'solid' : 'flat'}
                        className={cn('min-w-0 h-6 font-semibold uppercase', {
                          'bg-brand text-white': brand === brandOption.value,
                        })}
                        onPress={() => setBrand(brandOption.value)}>
                        {brandOption.label}
                      </Button>
                    ))}
                    {hasCollapsibleBrands && (
                      <Button
                        size='sm'
                        radius='none'
                        variant='flat'
                        aria-expanded={isBrandListExpanded}
                        className='min-w-0 h-6 font-semibold uppercase'
                        endContent={
                          <Icon
                            name='chevron-down'
                            className={cn(
                              'size-3 transition-transform',
                              isBrandListExpanded && 'rotate-180',
                            )}
                          />
                        }
                        onPress={toggleBrandList}>
                        {isBrandListExpanded
                          ? 'Show less'
                          : `+${hiddenBrandCount} more`}
                      </Button>
                    )}
                  </div>
                  <AnimatePresence initial={false}>
                    {isBrandListExpanded && overflowBrandOptions.length > 0 && (
                      <motion.div
                        key='brand-overflow'
                        initial='collapsed'
                        animate='expanded'
                        exit='collapsed'
                        variants={{
                          expanded: {
                            opacity: 1,
                            height: 'auto',
                            transition: shouldReduceMotion
                              ? {duration: 0.16}
                              : {
                                  duration: 0.22,
                                  ease: [0.22, 1, 0.36, 1],
                                  when: 'beforeChildren',
                                  delayChildren: 0.02,
                                  staggerChildren: 0.035,
                                },
                          },
                          collapsed: {
                            opacity: 0,
                            height: 0,
                            transition: shouldReduceMotion
                              ? {duration: 0.12}
                              : {
                                  duration: 0.18,
                                  ease: [0.4, 0, 0.2, 1],
                                  when: 'afterChildren',
                                  staggerChildren: 0.025,
                                  staggerDirection: -1,
                                },
                          },
                        }}
                        className='overflow-hidden'>
                        <motion.div className='flex flex-wrap items-center gap-1'>
                          {overflowBrandOptions.map((brandOption) => (
                            <motion.div
                              key={brandOption.value}
                              variants={{
                                expanded: {
                                  opacity: 1,
                                  y: 0,
                                  filter: 'blur(0px)',
                                  transition: shouldReduceMotion
                                    ? {duration: 0.12}
                                    : {
                                        duration: 0.2,
                                        ease: [0.22, 1, 0.36, 1],
                                      },
                                },
                                collapsed: {
                                  opacity: 0,
                                  y: -4,
                                  filter: shouldReduceMotion
                                    ? 'blur(0px)'
                                    : 'blur(3px)',
                                  transition: shouldReduceMotion
                                    ? {duration: 0.1}
                                    : {
                                        duration: 0.14,
                                        ease: [0.4, 0, 1, 1],
                                      },
                                },
                              }}>
                              <Button
                                size='sm'
                                radius='none'
                                variant={
                                  brand === brandOption.value ? 'solid' : 'flat'
                                }
                                className={cn(
                                  'min-w-0 h-6 font-semibold uppercase',
                                  {
                                    'bg-brand text-white':
                                      brand === brandOption.value,
                                  },
                                )}
                                onPress={() => setBrand(brandOption.value)}>
                                {brandOption.label}
                              </Button>
                            </motion.div>
                          ))}
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>
        </section>
      )}
      {/**/}
      <Products
        products={products}
        getImageUrl={getImageUrl}
        isLoading={isLoadingInitialProducts}
        footer={
          (canLoadMoreProducts || isLoadingMoreProducts) && (
            <div className='flex justify-center pt-6'>
              <div
                ref={loadMoreRef}
                aria-hidden
                className='flex h-10 w-full items-center justify-center'>
                <Icon
                  name='spinners-ring'
                  className={cn(
                    'size-4 transition-opacity',
                    isLoadingMoreProducts ? 'opacity-60' : 'opacity-25',
                  )}
                />
              </div>
            </div>
          )
        }
      />
      {/**/}
      <section className='py-6 sm:py-10 lg:py-20 px-4 sm:px-6 max-w-7xl mx-auto'>
        <div className='flex flex-col gap-20'>
          <div className='flex flex-wrap items-center justify-between gap-4'>
            <div className='space-y-1'>
              <h2 className='text-2xl font-clash font-bold tracking-normal sm:text-4xl'>
                Browse Category
              </h2>
            </div>
            <div className='w-full md:w-fit flex items-center justify-between gap-1 md:gap-2'>
              <Button
                size='sm'
                as={Link}
                href={`/lobby/deals`}
                radius='none'
                prefetch
                className='bg-terpenes opacity-100 text-white font-medium px-5 py-5 text-base lg:text-lg capitalize tracking-tight md:tracking-normal'>
                <span className='drop-shadow-xs'>Deals</span>
              </Button>
              {categories
                ?.filter((cat) => cat.slug !== slug)
                .map((cat) => (
                  <Button
                    key={cat._id}
                    size='sm'
                    as={Link}
                    href={`/lobby/category/${cat.slug}`}
                    prefetch
                    radius='none'
                    className='portrait:w-full dark:bg-white opacity-100 dark:text-dark-gray hover:bg-brand dark:hover:text-white bg-foreground hover:text-white text-white font-medium px-5 py-5 text-base lg:text-lg capitalize tracking-tighter'>
                    <span className='drop-shadow-xs'>{cat.name}</span>
                  </Button>
                ))}
            </div>
          </div>
        </div>
      </section>
      <div className='flex justify-center w-full px-4 sm:px-6 md:px-4 md:hidden pb-20'>
        <Button
          size='lg'
          radius='none'
          as={Link}
          href={'/lobby/brands'}
          fullWidth
          className='dark:bg-brand dark:text-white h-11 md:h-14 opacity-100 md:hover:bg-brand dark:hover:text-white bg-brand md:hover:text-white text-white font-clash font-bold px-4 sm:px-8 py-2 sm:py-3 text-lg'>
          <span className='drop-shadow-xs'>Shop by Brand</span>
        </Button>
      </div>
    </div>
  )
}

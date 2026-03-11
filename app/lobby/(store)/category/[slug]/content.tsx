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
import {useQuery} from 'convex/react'
import Link from 'next/link'
import {parseAsString, useQueryState} from 'nuqs'
import {useCallback, useMemo, ViewTransition} from 'react'

interface ContentProps {
  slug: string
  initialProducts: StoreProduct[]
}

export const Content = ({initialProducts, slug}: ContentProps) => {
  const [tier, setTier] = useQueryState('tier', parseAsString.withDefault(''))
  const [subcategory, setSubcategory] = useQueryState(
    'subcategory',
    parseAsString.withDefault(''),
  )

  const productsQuery = useQuery(api.products.q.listProducts, {
    categorySlug: slug,
    limit: 20,
  })

  const baseProducts = useMemo(() => {
    const nextProducts = productsQuery?.map(adaptProduct)
    return nextProducts && nextProducts.length > 0
      ? nextProducts
      : initialProducts
  }, [initialProducts, productsQuery])

  const products = useMemo(() => {
    return baseProducts.filter((p) => {
      if (tier && p.productTier !== tier) return false
      if (subcategory && p.subcategory !== subcategory) return false
      return true
    })
  }, [baseProducts, tier, subcategory])

  const filterOptions = useMemo(() => {
    const tiers = new Set<string>()
    const subcategories = new Set<string>()
    for (const p of baseProducts) {
      if (p.productTier) tiers.add(p.productTier)
      if (p.subcategory) subcategories.add(p.subcategory)
    }
    return {
      tiers: Array.from(tiers).sort(),
      subcategories: Array.from(subcategories).sort(),
    }
  }, [baseProducts])

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

  const category = useQuery(api.categories.q.getCategoryBySlug, {slug})
  const categories = useQuery(api.categories.q.listCategories)
  const heroImage = useQuery(
    api.categories.q.getHeroImage,
    category ? {id: category._id} : 'skip',
  )

  const {on: navigating, toggle} = useToggle()

  return (
    <div className='min-h-screen overflow-x-hidden'>
      <section className='pt-6 sm:pt-8 md:pt-10 lg:pt-14 xl:pt-24 2xl:pt-28 pb-4 sm:pb-16 lg:pb-20 px-4 sm:px-6 bg-background'>
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
                  onPress={toggle}
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

      {(filterOptions.tiers.length > 0 ||
        filterOptions.subcategories.length > 0) && (
        <section className='px-4 sm:px-6 pb-4'>
          <div className='max-w-7xl mx-auto flex flex-wrap items-center gap-3'>
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
                {filterOptions.tiers.map((t) => (
                  <Button
                    key={t}
                    size='sm'
                    radius='none'
                    variant={tier === t ? 'solid' : 'flat'}
                    className={cn('min-w-0 h-6 font-semibold uppercase', {
                      'bg-brand text-white': tier === t,
                    })}
                    onPress={() => setTier(t)}>
                    {t}
                  </Button>
                ))}
              </div>
            )}
            {filterOptions.subcategories.length > 0 && (
              <div className='flex flex-wrap items-center gap-2'>
                <span className='text-sm font-clash font-semibold mr-2 uppercase'>
                  Subcategory
                </span>
                <Button
                  size='sm'
                  radius='none'
                  variant={subcategory === '' ? 'solid' : 'flat'}
                  className='min-w-0'
                  onPress={() => setSubcategory('')}>
                  All
                </Button>
                {filterOptions.subcategories.map((s) => (
                  <Button
                    key={s}
                    size='sm'
                    radius='none'
                    variant={subcategory === s ? 'solid' : 'flat'}
                    className='min-w-0 capitalize'
                    onPress={() => setSubcategory(s)}>
                    {s}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      <Products products={products} getImageUrl={getImageUrl} />
      <section className='py-12 sm:py-16 lg:py-20 px-4 sm:px-6 max-w-7xl mx-auto'>
        <div className='flex flex-col gap-20'>
          <div className='flex flex-wrap items-center justify-between gap-4'>
            <div className='space-y-1'>
              <h2 className='text-xl font-clash font-semibold tracking-tight sm:text-4xl'>
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
      <div className='flex justify-center w-full px-4 md:hidden pb-20'>
        <Button
          size='lg'
          radius='none'
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

'use client'
import type {StoreCategory, StoreProduct} from '@/app/types'
import {NewHome} from '@/components/base44/home'
import {QuickScroll} from '@/components/base44/quick-scroll'
import {Footer} from '@/components/ui/footer'
import {api} from '@/convex/_generated/api'
import {adaptCategory, adaptProduct} from '@/lib/convexClient'
import type {BuildType} from '@/lib/flags'
import {useQuery} from 'convex/react'
import {useMemo} from 'react'
import {FullCollection} from './collection'
import {FeaturedProducts} from './featured'
import {StrainFinderMini} from './strain-finder'

interface StorefrontPageProps {
  initialCategories: StoreCategory[]
  initialProducts: StoreProduct[]
  delay?: number
  buildType?: BuildType
}

export const Content = ({
  initialCategories,
  initialProducts,
  // delay,
  // buildType,
}: StorefrontPageProps) => {
  const categoriesQuery = useQuery(api.categories.q.listCategories, {})
  const productsQuery = useQuery(api.products.q.listProducts, {})
  const categories = useMemo(
    () => categoriesQuery?.map(adaptCategory) ?? initialCategories,
    [categoriesQuery, initialCategories],
  )
  const products = useMemo(
    () => productsQuery?.map(adaptProduct) ?? initialProducts,
    [productsQuery, initialProducts],
  )
  // const isMobile = useMobile()
  const featuredProducts = useMemo(
    () => products.filter((item) => item.featured).slice(0, 4),
    [products],
  )

  // const buildTypeColors: Record<BuildType, string> = {
  //   testing: 'bg-yellow-500/90',
  //   debug: 'bg-purple-500/90',
  //   staging: 'bg-orange-500/90',
  //   production: 'bg-green-500/90',
  // }

  return (
    <div className='space-y-12 sm:space-y-24 md:space-y-40 overflow-x-hidden'>
      {/*{(delay !== undefined && delay > 0) || buildType !== 'production' ? (
        <div className='fixed bottom-4 right-4 z-50 flex flex-col gap-2'>
          {delay !== undefined && delay > 0 && (
            <div className='rounded-lg bg-blue-500/90 text-white px-4 py-2 text-sm font-medium shadow-lg backdrop-blur-sm'>
              ⏱️ Delay: {delay}ms
            </div>
          )}
          {buildType && buildType !== 'production' && (
            <div
              className={`rounded-lg ${buildTypeColors[buildType]} text-white px-4 py-2 text-sm font-medium shadow-lg backdrop-blur-sm uppercase tracking-wider`}>
              {buildType}
            </div>
          )}
        </div>
      ) : null}*/}
      <NewHome />
      <FeaturedProducts featuredProducts={featuredProducts} />

      {/*<Brands columnCount={isMobile ? 4 : 5} />*/}

      <FullCollection products={products} categories={categories} />

      <QuickScroll
        className='bg-transparent border-b-[0.33px] border-dotted border-foreground/10'
        href='#finder'
      />
      <StrainFinderMini categories={categories.slice(0, 4)} />

      <Footer />
    </div>
  )
}

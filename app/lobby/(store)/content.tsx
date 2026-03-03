'use client'
import type {StoreCategory, StoreProduct} from '@/app/types'
import {NewHome} from '@/components/base44/home'
import {api} from '@/convex/_generated/api'
import {adaptCategory, adaptProduct} from '@/lib/convexClient'
import type {BuildType} from '@/lib/flags'
import {useQuery} from 'convex/react'
import {useMemo} from 'react'
import {FullCollection} from './collection'
import {DealsMini} from './deals/components/deals-mini'

interface StorefrontPageProps {
  initialCategories: StoreCategory[]
  initialProducts: StoreProduct[]
  delay?: number
  buildType?: BuildType
}

export const Content = ({
  initialCategories,
  initialProducts,
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

  return (
    <div className='space-y-12 sm:space-y-24 md:space-y-40 overflow-x-hidden'>
      <NewHome />
      {/*<FeaturedProducts featuredProducts={featuredProducts} />*/}
      <FullCollection products={products} categories={categories} />
      <DealsMini categories={categories} />
    </div>
  )
}

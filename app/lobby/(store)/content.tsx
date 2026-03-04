'use client'
import type {StoreCategory, StoreProduct} from '@/app/types'
import {NewHome} from '@/components/base44/home'
import {api} from '@/convex/_generated/api'
import {useScrollY} from '@/hooks/use-scroll-y'
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
  const scrollY = useScrollY()
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

  return (
    <div className='overflow-x-hidden' data-scroll-y={scrollY}>
      <NewHome />
      <FullCollection products={products} categories={categories} />
      <DealsMini categories={categories} />
    </div>
  )
}

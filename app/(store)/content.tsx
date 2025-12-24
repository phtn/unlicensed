'use client'
import type {StoreCategory, StoreProduct} from '@/app/types'
import {NewHome} from '@/components/base44/home'
import {QuickScroll} from '@/components/base44/quick-scroll'
import {Footer} from '@/components/ui/footer'
import {api} from '@/convex/_generated/api'
import {useMobile} from '@/hooks/use-mobile'
import {adaptCategory, adaptProduct} from '@/lib/convexClient'
import {useQuery} from 'convex/react'
import {useMemo} from 'react'
import {Brands} from './brands'
import {FullCollection} from './collection'
import {FeaturedProducts} from './featured'
import {StrainFinderMini} from './strain-finder'

interface StorefrontPageProps {
  initialCategories: StoreCategory[]
  initialProducts: StoreProduct[]
  delay?: number
}

export const Content = ({
  initialCategories,
  initialProducts,
  delay,
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
  const isMobile = useMobile()
  const featuredProducts = useMemo(
    () => products.filter((item) => item.featured).slice(0, 4),
    [products],
  )

  return (
    <div className='space-y-40  flex-1'>
      {delay !== undefined && delay > 0 && (
        <div className='fixed bottom-4 right-4 z-50 rounded-lg bg-blue-500/90 text-white px-4 py-2 text-sm font-medium shadow-lg backdrop-blur-sm'>
          ⏱️ Delay: {delay}ms
        </div>
      )}
      <NewHome />
      <FeaturedProducts featuredProducts={featuredProducts} />

      <Brands columnCount={isMobile ? 4 : 5} />

      <FullCollection products={products} categories={categories} />

      <QuickScroll
        className='bg-transparent border-b-[0.33px] border-dashed border-foreground/40'
        href='#finder'
      />
      <StrainFinderMini categories={categories.slice(0, 4)} />

      <Footer />
    </div>
  )
}

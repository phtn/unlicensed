'use client'
import type {StoreCategory, StoreProduct} from '@/app/types'
import {NewHome} from '@/components/base44/home'
import {CtaSection} from '@/components/main/cta-section'
import {MiniCardV2, type MiniCardProps} from '@/components/main/mini-card'
import {MarkSection} from '@/components/store/marketing-card'
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

  const ctas: Array<MiniCardProps> = [
    {
      id: '01',
      title: 'Shop & Earn Cash back',
      description: 'Browse our products and earn cash back on every purchase.',
      icon: 'coins',
    },
    {
      id: '02',
      title: 'Browse Mix & Match Deals',
      description: 'Explore our deals bundle builder.',
      icon: 'tag',
    },
  ]

  return (
    <div className='overflow-x-hidden' data-scroll-y={scrollY}>
      <NewHome />
      <MarkSection
        title='The New Standard in Cannabis Retail.'
        description='Mix and match your order, earn cash back on every purchase, and shop
                  with guaranteed delivery and seamless card payments.'>
        <div className='portrait:px-4 max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-8'>
          {ctas.map((feature, i) => (
            <MiniCardV2 key={feature.title} {...feature} dark={i === 0} />
          ))}
        </div>
      </MarkSection>
      <FullCollection products={products} categories={categories} />
      <CtaSection />
      <DealsMini />
    </div>
  )
}

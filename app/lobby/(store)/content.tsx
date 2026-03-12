'use client'
import {FireManifesto} from '@/app/about/fire-manifesto'
import type {StoreCategory, StoreProduct} from '@/app/types'
import {NewHome} from '@/components/base44/home'
import {CtaSection} from '@/components/main/cta-section'
import {MiniCardV2, type MiniCardProps} from '@/components/main/mini-card'
import {MarkSection} from '@/components/store/marketing-card'
import {useScrollY} from '@/hooks/use-scroll-y'
import type {BuildType} from '@/lib/flags'
import {AllBrands} from './brands/all-brands'
import {FireCollectionContent} from './collection/content'
import {DealsMini} from './deals/components/deals-mini'
import {GridFour} from './grid-four'

interface StorefrontPageProps {
  initialCategories: StoreCategory[]
  initialProducts: StoreProduct[]
  delay?: number
  buildType?: BuildType
}

export const Content = ({
  // initialCategories,
  initialProducts,
}: StorefrontPageProps) => {
  const scrollY = useScrollY()
  // const categoriesQuery = useQuery(api.categories.q.listCategories, {})
  // const productsQuery = useQuery(api.products.q.listProducts, {})
  // const categories = useMemo(
  //   () => categoriesQuery?.map(adaptCategory) ?? initialCategories,
  //   [categoriesQuery, initialCategories],
  // )
  // const products = useMemo(
  //   () => productsQuery?.map(adaptProduct) ?? initialProducts,
  //   [productsQuery, initialProducts],
  // )

  const ctas: Array<MiniCardProps> = [
    {
      id: '01',
      title: 'Shop & Earn Cash back',
      description: 'Browse our products and earn cash back on every purchase.',
      icon: 'coins',
      href: '/lobby/category',
    },
    {
      id: '02',
      title: 'Browse Mix & Match Deals',
      description: 'Explore our deals bundle builder.',
      icon: 'tag',
      href: '/lobby/deals',
    },
  ]

  return (
    <div className='overflow-x-hidden' data-scroll-y={scrollY}>
      <NewHome />
      <MarkSection
        title='The New Standard in Cannabis Retail.'
        description='Mix and match your order, earn cash back on every purchase, and shop
                  with guaranteed delivery and seamless card payments.'>
        <div className='portrait:px-4 max-w-xl md:max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8'>
          {ctas.map((feature, i) => (
            <MiniCardV2 key={feature.title} {...feature} dark={i === 0} />
          ))}
        </div>
      </MarkSection>
      <AllBrands />
      <GridFour />
      <FireCollectionContent initialProducts={initialProducts} />
      <FireManifesto />
      <CtaSection />
      <DealsMini />
    </div>
  )
}

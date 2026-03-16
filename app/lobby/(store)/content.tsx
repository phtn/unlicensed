'use client'
import {FireManifesto} from '@/app/about/fire-manifesto'
import type {StoreCategory, StoreProduct} from '@/app/types'
import {NewHome} from '@/components/base44/home'
import {CtaSection} from '@/components/main/cta-section'
import {MiniCardV2, type MiniCardProps} from '@/components/main/mini-card'
import {MarkSection} from '@/components/store/marketing-card'
import type {BuildType} from '@/lib/flags'
import {AllBrands} from './brands/all-brands'
import {FireCollectionContent} from './collection/content'
import {DealsMini} from './deals/components/deals-mini'
import type {BundleConfig} from './deals/lib/deal-types'
import {GridFour} from './grid-four'

interface StoreCollectionSection {
  id: string
  title: string
  products: StoreProduct[]
}

interface StorefrontPageProps {
  initialCategories: StoreCategory[]
  initialCollections: StoreCollectionSection[]
  initialProducts: StoreProduct[]
  featuredDeals: BundleConfig[]
  delay?: number
  buildType?: BuildType
}

export const Content = ({
  initialCollections,
  featuredDeals,
}: StorefrontPageProps) => {
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
    <div className='overflow-x-hidden'>
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
      <FireCollectionContent initialCollections={initialCollections} />
      <FireManifesto />
      <CtaSection />
      <DealsMini featuredDeals={featuredDeals} />
    </div>
  )
}

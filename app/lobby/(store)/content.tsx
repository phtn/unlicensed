import {FireManifesto} from '@/app/about/fire-manifesto'
import type {StoreProduct} from '@/app/types'
import {NewHome} from '@/components/base44/home'
import {CtaSection} from '@/components/main/cta-section'
import {MiniCardV2, type MiniCardProps} from '@/components/main/mini-card'
import {MarkSection} from '@/components/store/marketing-card'
import {fetchFeaturedDeals, fetchFireCollections} from '@/lib/convexClient'
import {Suspense} from 'react'
import {AllBrands} from './brands/all-brands'
import {FireCollectionContent} from './collection/content'
import {DealsMini} from './deals/components/deals-mini'
import type {BundleConfig} from './deals/lib/deal-types'
import {GridFour} from './grid-four'

interface StoreCollectionSection {
  id: string
  title: string
  products: StoreProduct[]
  sourceCategorySlug?: string
  sourceCategoryProductCount?: number
}

const FireCollectionsSection = async ({
  promise,
}: {
  promise: Promise<StoreCollectionSection[]>
}) => {
  const initialCollections = await promise

  if (initialCollections.length === 0) {
    return null
  }

  return <FireCollectionContent initialCollections={initialCollections} />
}

const FeaturedDealsSection = async ({
  promise,
}: {
  promise: Promise<BundleConfig[]>
}) => {
  const featuredDeals = await promise

  if (featuredDeals.length === 0) {
    return null
  }

  return <DealsMini featuredDeals={featuredDeals} />
}

const FireCollectionsFallback = () => (
  <section
    aria-hidden='true'
    className='min-h-screen px-4 pb-16 pt-16 sm:px-6 sm:pb-20 sm:pt-20 lg:pb-24 lg:pt-28'
  >
    <div className='mx-auto flex max-w-7xl flex-col gap-6'>
      {Array.from({length: 2}).map((_, index) => (
        <div
          key={index}
          className='overflow-hidden rounded-3xl border border-foreground/10 bg-background/60 p-6'
        >
          <div className='h-10 w-52 animate-pulse rounded bg-foreground/10' />
          <div className='mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
            {Array.from({length: 4}).map((__, cardIndex) => (
              <div
                key={cardIndex}
                className='aspect-4/5 animate-pulse rounded-xs bg-foreground/8'
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  </section>
)

const FeaturedDealsFallback = () => (
  <section
    aria-hidden='true'
    className='mx-auto w-full px-2 py-12 sm:px-4 md:max-w-7xl'
  >
    <div className='rounded-[36px] border border-foreground/10 bg-foreground/4 px-6 py-10 sm:px-12 sm:py-16'>
      <div className='h-8 w-40 animate-pulse rounded bg-foreground/10' />
      <div className='mt-6 h-24 max-w-2xl animate-pulse rounded bg-foreground/8' />
    </div>
  </section>
)

export const Content = () => {
  const initialCollectionsPromise = fetchFireCollections()
  const featuredDealsPromise = fetchFeaturedDeals()

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
                  with guaranteed delivery and seamless card payments.'
      >
        <div className='portrait:px-4 max-w-xl md:max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8'>
          {ctas.map((feature, i) => (
            <MiniCardV2 key={feature.title} {...feature} dark={i === 0} />
          ))}
        </div>
      </MarkSection>
      <AllBrands />
      <GridFour />
      <Suspense fallback={<FireCollectionsFallback />}>
        <FireCollectionsSection promise={initialCollectionsPromise} />
      </Suspense>
      <FireManifesto />
      <CtaSection />
      <Suspense fallback={<FeaturedDealsFallback />}>
        <FeaturedDealsSection promise={featuredDealsPromise} />
      </Suspense>
    </div>
  )
}

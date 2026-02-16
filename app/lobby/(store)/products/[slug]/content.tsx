'use client'

import type {StoreProductDetail} from '@/app/types'
import {QuickScroll} from '@/components/base44/quick-scroll'
import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {useMobile} from '@/hooks/use-mobile'
import {adaptProductDetail, type RawProductDetail} from '@/lib/convexClient'
import {useQuery} from 'convex/react'
import {notFound} from 'next/navigation'
import {useMemo, useRef} from 'react'
import {Crumbs} from './crumbs'
import {Gallery} from './gallery'
import {ProductInteraction} from './product-interaction'
import {RelatedProducts} from './related-products'

interface ProductDetailContentProps {
  initialDetail: StoreProductDetail | null
  slug: string
}

export const ProductDetailContent = ({
  initialDetail,
  slug,
}: ProductDetailContentProps) => {
  const galleryImageRef = useRef<HTMLDivElement>(null)
  const isMobile = useMobile()

  const detailQuery = useQuery(api.products.q.getProductBySlug, {slug})

  const detail = useMemo<StoreProductDetail | null | undefined>(() => {
    if (detailQuery === undefined) {
      return initialDetail
    }
    if (!detailQuery) {
      return null
    }
    return adaptProductDetail(detailQuery as RawProductDetail)
  }, [detailQuery, initialDetail])

  if (detail === null) {
    notFound()
  }

  if (!detail) {
    return null
  }

  const product = detail.product
  const category = detail.category
  const related = detail.related
  const productId = (detailQuery?.product?._id ?? product._id) as
    | Id<'products'>
    | undefined

  return (
    <div className='space-y-12 sm:space-y-16 lg:space-y-20 py-12 sm:py-16 lg:py-20 overflow-x-hidden w-full'>
      <div className='md:mx-auto lg:max-w-7xl max-w-screen p-2 sm:pt-4 md:pt-6 2xl:pt-8 sm:px-6 lg:px-0'>
        <Crumbs product={product} />
        <div className='mt-2 sm:mt-8 lg:mt-6 grid gap-6 sm:gap-8 lg:gap-0 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-start'>
          <Gallery
            product={product}
            imageRef={galleryImageRef}
            productId={productId}
            isMobile={isMobile}
          />
          <ProductInteraction
            product={product}
            category={category}
            productId={productId}
            isMobile={isMobile}
          />
        </div>
      </div>

      <QuickScroll
        href='#related-selections'
        className='border-b-[0.33px] border-foreground/20 border-dotted bg-transparent'
      />

      {related.length > 0 ? <RelatedProducts products={related} /> : null}
    </div>
  )
}

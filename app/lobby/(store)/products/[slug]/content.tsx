'use client'

import type {StoreProductDetail} from '@/app/types'
import {QuickScroll} from '@/components/base44/quick-scroll'
import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {adaptProductDetail, type RawProductDetail} from '@/lib/convexClient'
import {resolveProductImage} from '@/lib/resolve-product-image'
import {useQuery} from 'convex/react'
import {useMemo} from 'react'
import {useStorageUrls} from '@/hooks/use-storage-urls'
import {Crumbs} from './crumbs'
import {Gallery} from './gallery'
import {ProductDetails} from './product-details'
import {ProductInteraction} from './product-interaction'
import {RelatedProducts} from './related-products'

interface ProductDetailContentProps {
  initialDetail: StoreProductDetail
  slug: string
}

export const ProductDetailContent = ({
  initialDetail,
  slug,
}: ProductDetailContentProps) => {
  const liveDetail = useQuery(api.products.q.getProductBySlug, {slug}) as
    | RawProductDetail
    | null
    | undefined

  const detail = useMemo(
    () =>
      liveDetail && liveDetail.product
        ? adaptProductDetail(liveDetail)
        : initialDetail,
    [initialDetail, liveDetail],
  )

  const resolvedProduct = detail.product
  const resolvedRelated = useMemo(
    () =>
      detail.related.filter(
        (product) => !product.archived && product.slug !== slug,
      ),
    [detail.related, slug],
  )
  const productId = resolvedProduct._id as Id<'products'> | undefined

  const imageIds = useMemo(
    () =>
      [
        resolvedProduct.image,
        ...resolvedProduct.gallery,
        ...resolvedRelated.map((product) => product.image),
      ].filter((value): value is string => Boolean(value)),
    [resolvedProduct.gallery, resolvedProduct.image, resolvedRelated],
  )
  const resolveStorageUrl = useStorageUrls(imageIds)

  const primaryImageUrl = useMemo(
    () => resolveProductImage(resolvedProduct.image, resolveStorageUrl),
    [resolveStorageUrl, resolvedProduct.image],
  )
  const galleryImages = useMemo(
    () =>
      resolvedProduct.gallery
        .map((image) => resolveProductImage(image, resolveStorageUrl))
        .filter((image): image is string => Boolean(image)),
    [resolveStorageUrl, resolvedProduct.gallery],
  )
  const relatedProducts = useMemo(
    () =>
      resolvedRelated.map((product) => ({
        product,
        imageUrl: resolveProductImage(product.image, resolveStorageUrl),
      })),
    [resolveStorageUrl, resolvedRelated],
  )

  return (
    <div className='space-y-12 sm:space-y-16 lg:space-y-20 py-12 sm:py-16 lg:py-20 overflow-x-hidden w-full'>
      <div className='md:mx-auto lg:max-w-7xl max-w-screen p-2 sm:pt-4 md:pt-6 2xl:pt-8 sm:px-6 lg:px-0'>
        <Crumbs product={resolvedProduct} />
        <div className='mt-2 sm:mt-8 lg:mt-6 grid gap-1 sm:gap-8 lg:gap-0 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-start'>
          <Gallery
            product={resolvedProduct}
            primaryImageUrl={primaryImageUrl}
            galleryImages={galleryImages}
          />
          <div className='w-full overflow-hidden rounded-xs border border-foreground/20 bg-alum/10 backdrop-blur-xl dark:bg-dark-table/50 lg:min-h-[78lvh] md:rounded-tl-none'>
            <ProductInteraction
              product={resolvedProduct}
              productId={productId}
            />
            <ProductDetails product={resolvedProduct} />
          </div>
        </div>
      </div>

      <QuickScroll
        href='#related-selections'
        className='border-b-[0.33px] border-foreground/20 border-dotted bg-transparent'
      />

      {relatedProducts.length > 0 ? (
        <RelatedProducts products={relatedProducts} />
      ) : null}
    </div>
  )
}

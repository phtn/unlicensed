import type {StoreProductDetail} from '@/app/types'
import {QuickScroll} from '@/components/base44/quick-scroll'
import {Id} from '@/convex/_generated/dataModel'
import {fetchStorageUrlMap} from '@/lib/convexClient'
import {resolveProductImage} from '@/lib/resolve-product-image'
import {notFound} from 'next/navigation'
import {Crumbs} from './crumbs'
import {Gallery} from './gallery'
import {ProductDetails} from './product-details'
import {ProductInteraction} from './product-interaction'
import {RelatedProducts} from './related-products'

interface ProductDetailContentProps {
  initialDetail: StoreProductDetail | null
  slug: string
}

export const ProductDetailContent = async ({
  initialDetail,
  slug,
}: ProductDetailContentProps) => {
  if (!initialDetail) {
    notFound()
  }

  const detail = initialDetail
  const resolvedProduct = detail.product
  const resolvedRelated = detail.related.filter(
    (product) => !product.archived && product.slug !== slug,
  )
  const productId = resolvedProduct._id as Id<'products'> | undefined
  const storageUrlMap = await fetchStorageUrlMap([
    resolvedProduct.image,
    ...resolvedProduct.gallery,
    ...resolvedRelated.map((product) => product.image),
  ])
  const resolveStorageUrl = (value: string) => storageUrlMap.get(value) ?? null
  const primaryImageUrl = resolveProductImage(
    resolvedProduct.image,
    resolveStorageUrl,
  )
  const galleryImages = resolvedProduct.gallery
    .map((image) => resolveProductImage(image, resolveStorageUrl))
    .filter((image): image is string => Boolean(image))
  const relatedProducts = resolvedRelated.map((product) => ({
    product,
    imageUrl: resolveProductImage(product.image, resolveStorageUrl),
  }))

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

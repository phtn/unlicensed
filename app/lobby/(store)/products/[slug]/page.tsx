import {fetchProductDetail} from '@/lib/convexClient'
import {Metadata} from 'next'
import {notFound} from 'next/navigation'
import {ProductDetailContent} from './content'
export async function generateMetadata({
  params,
}: {
  params: Promise<{slug: string}>
}): Promise<Metadata> {
  const slug = (await params).slug
  const detail = await fetchProductDetail(slug)

  if (!detail) {
    return {
      title: 'Product not found',
    }
  }

  const {product} = detail

  // For metadata, we can't resolve storage IDs server-side
  // Use empty array if images are storage IDs (they start with storage ID format)
  const imageUrl =
    product.image && product.image.startsWith('http')
      ? product.image
      : product.gallery &&
          product.gallery.length > 0 &&
          product.gallery[0]?.startsWith('http')
        ? product.gallery[0]
        : undefined

  return {
    title: `${product.name} ・ Rapid Fire`,
    description: product.shortDescription,
    openGraph: {
      title: `${product.name} ・ Rapid Fire`,
      description: product.description,
      images: imageUrl ? [imageUrl] : [],
    },
  }
}

type PageProps = {
  params: Promise<{slug: string}>
}
const Page = async ({params}: PageProps) => {
  const slug = (await params).slug
  const initialDetail = await fetchProductDetail(slug)
  if (!initialDetail) {
    notFound()
  }
  return <ProductDetailContent initialDetail={initialDetail} slug={slug} />
}
export default Page

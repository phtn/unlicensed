import {fetchProductDetail} from '@/lib/convexClient'
import {Metadata} from 'next'
import {cache} from 'react'
import {ProductDetailContent} from './content'

const getProductDetail = cache(fetchProductDetail)
export async function generateMetadata({
  params,
}: {
  params: {slug: string}
}): Promise<Metadata> {
  const detail = await getProductDetail(params.slug)

  if (!detail) {
    return {
      title: 'Product not found | Hyfe Goods',
    }
  }

  const {product} = detail

  return {
    title: `${product.name} | Hyfe Goods`,
    description: product.shortDescription,
    openGraph: {
      title: `${product.name} | Hyfe Goods`,
      description: product.description,
      images:
        product.gallery.length > 0 ? [product.gallery[0]] : [product.image],
    },
  }
}

type PageProps = {
  params: Promise<{slug: string}>
}
const Page = async ({params}: PageProps) => {
  const slug = (await params).slug
  const detail = await getProductDetail(slug)
  return <ProductDetailContent detail={detail} />
}
export default Page

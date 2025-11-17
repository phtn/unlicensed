import {fetchProductDetail} from '@/lib/convexClient'
import {Metadata} from 'next'
import {cache} from 'react'
import {ProductDetailContent} from './content'

const getProductDetail = cache(fetchProductDetail)
export async function generateMetadata({
  params,
}: {
  params: Promise<{slug: string}>
}): Promise<Metadata> {
  const slug = (await params).slug
  const detail = await getProductDetail(slug)

  if (!detail) {
    return {
      title: 'Product not found | Hyfe Goods',
    }
  }

  const {product} = detail

  return {
    title: `${product.name} | Unlicensed Goods`,
    description: product.shortDescription,
    openGraph: {
      title: `${product.name} | Unlicensed Goods`,
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
  const initialDetail = await getProductDetail(slug)
  return (
    <div>
      {/*<FlyingCart />*/}
      <ProductDetailContent initialDetail={initialDetail} slug={slug} />
    </div>
  )
}
export default Page

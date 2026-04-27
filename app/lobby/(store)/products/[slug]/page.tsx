import {fetchProductDetail, fetchStorageUrlMap} from '@/lib/convexClient'
import {Metadata} from 'next'
import {notFound} from 'next/navigation'
import {ProductDetailContent} from './content'

const DEFAULT_SITE_URL = 'https://rapidfirenow.com'

const getSiteUrl = () =>
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  process.env.SITE_URL?.trim() ||
  DEFAULT_SITE_URL

const normalizeMetadataDescription = (value: string) => {
  const normalized = value.replace(/\s+/g, ' ').trim()
  return normalized.length > 200
    ? `${normalized.slice(0, 197).trimEnd()}...`
    : normalized
}

const resolveProductMetadataImage = async (
  imageValues: Array<string | null | undefined>,
) => {
  const storageUrlMap = await fetchStorageUrlMap(imageValues)

  for (const value of imageValues) {
    if (!value) {
      continue
    }

    if (
      value.startsWith('http://') ||
      value.startsWith('https://') ||
      value.startsWith('/')
    ) {
      return value
    }

    const resolvedUrl = storageUrlMap.get(value)
    if (resolvedUrl?.startsWith('http')) {
      return resolvedUrl
    }
  }

  return undefined
}

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
  const productUrl = new URL(
    `/lobby/products/${encodeURIComponent(product.slug || slug)}`,
    getSiteUrl(),
  )
  const title = `${product.name}`
  const productHighlights = [
    product.strainType,
    product.productTierLabel,
    product.thcPercentage > 0 ? `${product.thcPercentage}% THC` : null,
    product.cbdPercentage ? `${product.cbdPercentage}% CBD` : null,
  ].filter((value): value is string => Boolean(value))
  const description = normalizeMetadataDescription(
    [
      product.shortDescription || product.description || 'Shop this product.',
      productHighlights.join(' · '),
    ]
      .filter(Boolean)
      .join(' · '),
  )
  const imageUrl = await resolveProductMetadataImage([
    product.image,
    ...product.gallery,
  ])
  const images = imageUrl
    ? [
        {
          url: imageUrl,
          alt: product.name,
        },
      ]
    : []

  return {
    title,
    description,
    alternates: {
      canonical: productUrl,
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url: productUrl,
      siteName: 'Rapid Fire',
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images,
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

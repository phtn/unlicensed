import {fetchCategoryProductsPage} from '@/lib/convexClient'
import {Metadata} from 'next'
import {CATEGORY_PRODUCTS_PAGE_SIZE} from './constants'
import {Content} from './content'

const formatCategoryTitle = (slug: string) =>
  slug
    .replace(/[-_]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ')

type PageProps = {
  params: Promise<{slug: string}>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const slug = (await params).slug

  return {
    title: formatCategoryTitle(slug),
    description: 'Browse products by category.',
  }
}

const Page = async ({params}: PageProps) => {
  const slug = (await params).slug
  const initialProducts = await fetchCategoryProductsPage({
    categorySlug: slug,
    numItems: CATEGORY_PRODUCTS_PAGE_SIZE,
  })
  return <Content initialProducts={initialProducts} slug={slug} />
}

export default Page

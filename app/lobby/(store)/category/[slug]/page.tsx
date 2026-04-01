import {fetchCategoryProductsPage} from '@/lib/convexClient'
import {Metadata} from 'next'
import {CATEGORY_PRODUCTS_PAGE_SIZE} from './constants'
import {Content} from './content'

export const metadata: Metadata = {
  title: 'Category',
  description: 'Browse products by category.',
}

type PageProps = {
  params: Promise<{slug: string}>
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

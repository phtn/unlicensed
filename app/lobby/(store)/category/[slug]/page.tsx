import {fetchCategoryProductsPage} from '@/lib/convexClient'
import {CATEGORY_PRODUCTS_PAGE_SIZE} from './constants'
import {Content} from './content'

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

import {fetchProducts} from '@/lib/convexClient'
import {Content} from './content'
type PageProps = {
  params: Promise<{slug: string}>
}
const Page = async ({params}: PageProps) => {
  const slug = (await params).slug
  const initialProducts = await fetchProducts({categorySlug: slug, limit: 20})
  return <Content initialProducts={initialProducts} slug={slug} />
}
export default Page

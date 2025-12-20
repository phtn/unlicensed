import {CategoryProductsContent} from './content'

interface Props {
  params: Promise<{
    slug: string
  }>
}

const Page = async ({params}: Props) => {
  const {slug} = await params

  return <CategoryProductsContent categorySlug={slug} />
}

export default Page


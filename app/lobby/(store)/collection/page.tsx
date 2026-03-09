import {fetchFireCollectionProducts} from '@/lib/convexClient'
import {Content} from './content'

const Page = async () => {
  const initialProducts = await fetchFireCollectionProducts()

  return <Content initialProducts={initialProducts} />
}

export default Page

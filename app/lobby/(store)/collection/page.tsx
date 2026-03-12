import {fetchFireCollections} from '@/lib/convexClient'
import {Content} from './content'

const Page = async () => {
  const initialCollections = await fetchFireCollections()

  return <Content initialCollections={initialCollections} />
}

export default Page

import {fetchCategories} from '@/lib/convexClient'
import {Content} from './content'

const Page = async () => {
  const initialCategories = await fetchCategories()
  return <Content initialCategories={initialCategories} />
}

export default Page

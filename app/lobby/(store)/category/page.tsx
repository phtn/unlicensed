import {fetchCategories} from '@/lib/convexClient'
import {Metadata} from 'next'
import {Content} from './content'

export const metadata: Metadata = {
  title: 'Category',
  description: 'Browse products by category.',
}

const Page = async () => {
  const initialCategories = await fetchCategories()
  return <Content initialCategories={initialCategories} />
}

export default Page

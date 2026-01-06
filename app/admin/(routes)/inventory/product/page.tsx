import {Metadata} from 'next'
import {ProductsContent} from './content'
export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Products',
  description: 'Create and Edit products.',
}
const Page = () => <ProductsContent />
export default Page

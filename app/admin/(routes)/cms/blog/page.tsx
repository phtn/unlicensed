import {Metadata} from 'next'
import {BlogContent} from './content'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Blogposts',
  description: 'Create and manage blogposts.',
}
const Page = () => <BlogContent />

export default Page

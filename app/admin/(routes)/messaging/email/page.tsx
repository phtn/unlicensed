import {Metadata} from 'next'
import {EmailContent} from './content'
export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Email',
  description: 'Email configuration and setup.',
}
const Page = () => <EmailContent />
export default Page

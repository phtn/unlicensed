import {Metadata} from 'next'
import {Content} from './content'
export const metadata: Metadata = {
  title: 'Payments | Admin ',
  description: 'Payments configuration and setup.',
}
const Page = async () => <Content />
export default Page

import type {Metadata} from 'next'
import {Content} from './content'

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Manage admin default settings.',
}
const Page = async () => <Content />
export default Page

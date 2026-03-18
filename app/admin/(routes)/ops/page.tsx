import type {Metadata} from 'next'
import {Content} from './content'

export const metadata: Metadata = {
  title: 'Overview',
  description: 'Active orders and sales overview.',
  icons: [
    {
      rel: 'icon',
      url: '/svg/rf-icon-latest.svg',
    },
  ],
}
const Page = async () => <Content />
export default Page

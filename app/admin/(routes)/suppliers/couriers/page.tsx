import type {Metadata} from 'next'
import {Content} from './content'

export const metadata: Metadata = {
  title: 'Couriers',
  description: 'Manage couriers and shipping accounts.',
  icons: [
    {
      rel: 'icon',
      url: '/svg/rf-icon-latest.svg',
    },
  ],
}
const Page = async () => <Content />
export default Page

import {Metadata} from 'next'
import {Content} from './content'

export const metadata: Metadata = {
  title: 'Payment Gateways',
  description: 'Gateway configuration and setup.',
  icons: [
    {
      rel: 'icon',
      url: '/svg/rf-icon-latest.svg',
    },
  ],
}
const Page = async () => <Content />
export default Page

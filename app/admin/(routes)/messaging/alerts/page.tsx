import type {Metadata} from 'next'
import {Content} from './alerts-content'
const Page = async () => <Content />
export const metadata: Metadata = {
  title: 'Alerts',
  description: 'Set alert thresholds and send notifications.',
  icons: [
    {
      rel: 'icon',
      url: '/svg/rf-icon-latest.svg',
    },
  ],
}
export default Page

import type {Metadata} from 'next'
import {Content} from './content'
const Page = async () => <Content />

export const metadata: Metadata = {
  title: 'Stats',
  description: 'Manage stats panels.',
  icons: [
    {
      rel: 'icon',
      url: '/svg/rf-icon-latest.svg',
    },
  ],
}

export default Page

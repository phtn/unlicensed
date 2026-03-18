import type {Metadata} from 'next'
import {Content} from './content'

export const metadata: Metadata = {
  title: 'Customers',
  description: 'View and manage customer profiles.',
  icons: [
    {
      rel: 'icon',
      url: '/svg/rf-icon-latest.svg',
    },
  ],
}

export default function CustomersPage() {
  return <Content />
}

import type {Metadata} from 'next'
import {Content} from './content'

export const metadata: Metadata = {
  title: 'Sales',
  description: 'View and manage sales data.',
  icons: [
    {
      rel: 'icon',
      url: '/svg/rf-icon-latest.svg',
    },
  ],
}

export default function SalesPage() {
  return <Content />
}

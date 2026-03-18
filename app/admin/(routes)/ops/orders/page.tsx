import type {Metadata} from 'next'
import {Content} from './content'

export const metadata: Metadata = {
  title: 'Orders',
  description: 'View and manage customer orders.',
  icons: [
    {
      rel: 'icon',
      url: '/svg/rf-icon-latest.svg',
    },
  ],
}

export default function OrdersPage() {
  return <Content />
}

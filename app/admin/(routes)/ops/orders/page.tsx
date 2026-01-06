import type {Metadata} from 'next'
import {Content} from './content'

export const metadata: Metadata = {
  title: 'Orders',
  description: 'View and manage customer orders.',
}

export default function OrdersPage() {
  return <Content />
}

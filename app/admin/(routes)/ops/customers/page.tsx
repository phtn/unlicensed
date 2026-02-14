import type {Metadata} from 'next'
import {Content} from './content'

export const metadata: Metadata = {
  title: 'Customers',
  description: 'View and manage customer profiles.',
}

export default function CustomersPage() {
  return <Content />
}

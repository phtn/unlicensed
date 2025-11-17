import type {Metadata} from 'next'
import {Content} from './content'

export const metadata: Metadata = {
  title: 'Admin | Hyfe',
  description: 'Manage categories, products, and media assets.',
}

export default function AdminPage() {
  return <Content />
}

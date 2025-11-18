import type {Metadata} from 'next'
import {Content} from './content'

export const metadata: Metadata = {
  title: 'Sales | Admin | Unlicensed',
  description: 'View and manage sales data.',
}

export default function SalesPage() {
  return <Content />
}


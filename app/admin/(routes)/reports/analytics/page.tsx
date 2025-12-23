import type {Metadata} from 'next'
import {Content} from './content'

export const metadata: Metadata = {
  title: 'Analytics | Admin | Unlicensed',
  description: 'View and analyze site visit logs and analytics.',
}

export default function AnalyticsPage() {
  return <Content />
}


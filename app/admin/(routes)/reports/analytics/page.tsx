import type {Metadata} from 'next'
import {Content} from './content'

export const metadata: Metadata = {
  title: 'Analytics',
  description: 'View and analyze site visit logs and analytics.',
  icons: [
    {
      rel: 'icon',
      url: '/svg/rf-icon-latest.svg',
    },
  ],
}

export default function AnalyticsPage() {
  return <Content />
}

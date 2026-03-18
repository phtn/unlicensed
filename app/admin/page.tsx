import type {Metadata} from 'next'
import {Content} from './content'

export const metadata: Metadata = {
  title: 'Admin Gate',
  description: 'Admin role required.',
  icons: [
    {
      rel: 'icon',
      url: '/svg/rf-icon-latest.svg',
    },
  ],
}

export default function AdminPage() {
  return <Content />
}

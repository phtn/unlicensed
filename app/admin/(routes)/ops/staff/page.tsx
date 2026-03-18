import type {Metadata} from 'next'
import {Content} from './content'

export const metadata: Metadata = {
  title: 'Staff',
  description: 'Manage staff and personnel.',
  icons: [
    {
      rel: 'icon',
      url: '/svg/rf-icon-latest.svg',
    },
  ],
}

export default function StaffPage() {
  return <Content />
}

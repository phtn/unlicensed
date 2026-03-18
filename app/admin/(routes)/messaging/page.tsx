import type {Metadata} from 'next'
import {Content} from './content'

export const metadata: Metadata = {
  title: 'Messaging',
  description: 'Manage email templates and chat settings.',
  icons: [
    {
      rel: 'icon',
      url: '/svg/rf-icon-latest.svg',
    },
  ],
}

export default function MessagingPage() {
  return <Content />
}

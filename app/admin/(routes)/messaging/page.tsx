import type {Metadata} from 'next'
import {Content} from './content'

export const metadata: Metadata = {
  title: 'Messaging | Rapid Fire',
  description: 'Manage email templates and chat settings.',
}

export default function MessagingPage() {
  return <Content />
}

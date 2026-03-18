import type {Metadata} from 'next'
import {Content} from './chat-content'
const Page = async () => <Content />
export const metadata: Metadata = {
  title: 'Chat',
  description: 'Manage email templates and chat settings.',
  icons: [
    {
      rel: 'icon',
      url: '/svg/rf-icon-latest.svg',
    },
  ],
}
export default Page

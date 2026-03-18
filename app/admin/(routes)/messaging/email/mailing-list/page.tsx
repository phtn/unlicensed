import {Metadata} from 'next'
import {MailingListContent} from '../_email/components/mailing-list'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Mailing Lists',
  description: 'Manage saved mailing lists.',
}

const Page = () => <MailingListContent />

export default Page

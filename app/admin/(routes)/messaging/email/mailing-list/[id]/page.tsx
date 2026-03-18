import {Metadata} from 'next'
import {MailingListViewer} from '../../_email/components/mailing-list-viewer'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Mailing List',
  description: 'View a mailing list and its recipients.',
}

interface Props {
  params: Promise<{
    id: string
  }>
}

const Page = async ({params}: Props) => {
  const {id} = await params

  return <MailingListViewer id={id} />
}

export default Page

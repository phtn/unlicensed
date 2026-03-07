import type {Metadata} from 'next'
import {ArchivesContent} from './content'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Archived Products',
  description: 'Browse archived inventory products.',
}

const Page = () => <ArchivesContent />

export default Page

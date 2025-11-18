import type {Metadata} from 'next'
import {Content} from './content'

export const metadata: Metadata = {
  title: 'Personnel | Admin | Unlicensed',
  description: 'Manage staff and personnel.',
}

export default function PersonnelPage() {
  return <Content />
}


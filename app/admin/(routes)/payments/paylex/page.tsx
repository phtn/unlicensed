import type {Metadata} from 'next'
import {Content} from './content'

export const metadata: Metadata = {
  title: 'Paylex | Admin | RF',
  description: 'Paylex payment gateway management.',
}

export default function PaylexPage() {
  return <Content />
}

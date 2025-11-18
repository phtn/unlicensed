import type {Metadata} from 'next'
import {Content} from './content'

export const metadata: Metadata = {
  title: 'Deliveries | Admin | Unlicensed',
  description: 'Track and manage delivery operations.',
}

export default function DeliveriesPage() {
  return <Content />
}


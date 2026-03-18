import type {Metadata} from 'next'
import {Content} from './content'

export const metadata: Metadata = {
  title: 'Paygate',
  description: 'Paygate payment gateway management.',
  icons: [
    {
      rel: 'icon',
      url: '/svg/rf-icon-latest.svg',
    },
  ],
}

export default function PaymentsPage() {
  return <Content />
}

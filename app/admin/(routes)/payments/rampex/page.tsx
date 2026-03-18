import type {Metadata} from 'next'
import {Content} from './content'

export const metadata: Metadata = {
  title: 'Rampex',
  description: 'Rampex payment gateway management.',
  icons: [
    {
      rel: 'icon',
      url: '/svg/rf-icon-latest.svg',
    },
  ],
}

export default function RampexPage() {
  return <Content />
}

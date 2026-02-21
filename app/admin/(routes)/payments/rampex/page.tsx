import type {Metadata} from 'next'
import {Content} from './content'

export const metadata: Metadata = {
  title: 'Rampex | Admin | RF',
  description: 'Rampex payment gateway management.',
}

export default function RampexPage() {
  return <Content />
}

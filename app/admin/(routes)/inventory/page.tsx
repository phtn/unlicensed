import type {Metadata} from 'next'
import {Content} from './content'

export const metadata: Metadata = {
  title: 'Inventory',
  description: 'Manage product inventory and stock levels.',
  icons: [
    {
      rel: 'icon',
      url: '/svg/rf-icon-latest.svg',
    },
  ],
}

export default function InventoryPage() {
  return <Content />
}

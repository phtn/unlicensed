import type {Metadata} from 'next'
import {Content} from './content'

export const metadata: Metadata = {
  title: 'Inventory | Admin | Unlicensed',
  description: 'Manage product inventory and stock levels.',
}

export default function InventoryPage() {
  return <Content />
}



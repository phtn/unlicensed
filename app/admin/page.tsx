import type {Metadata} from 'next'
import {AdminDashboard} from './dashboard'

export const metadata: Metadata = {
  title: 'Admin | Hyfe',
  description: 'Manage categories, products, and media assets.',
}

export default function AdminPage() {
  return (
    <main className='min-h-screen bg-neutral-950 px-4 pb-16 pt-20 text-neutral-100'>
      <AdminDashboard />
    </main>
  )
}



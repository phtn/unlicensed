'use client'

import {AdminSettings} from './_components/settings'
import {AdminDashboard} from './dashboard'

export const Content = () => {
  return (
    <main className='min-h-screen bg-neutral-950 px-4 pb-16 pt-20 text-neutral-100'>
      <AdminSettings />
      <AdminDashboard />
    </main>
  )
}

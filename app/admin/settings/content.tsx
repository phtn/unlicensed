'use client'

import {PurgeActions} from './purge'
import {StatSettings} from '../_components/stat-settings'

export const Content = () => {
  return (
    <main className='px-4 space-y-6 py-6'>
      <div>
        <h1 className='text-2xl font-semibold mb-2'>Settings</h1>
        <p className='text-sm text-gray-400'>
          Manage your admin dashboard preferences
        </p>
      </div>
      <StatSettings />
      <PurgeActions />
    </main>
  )
}

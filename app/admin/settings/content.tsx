'use client'

import {StatSettings} from '../_components/stat-settings'
import {PurgeActions} from './purge'
import {PayGateSettings} from './paygate'

export const Content = () => {
  return (
    <main className='px-4 space-y-6 py-2'>
      <StatSettings />
      <PayGateSettings />
      <PurgeActions />
    </main>
  )
}

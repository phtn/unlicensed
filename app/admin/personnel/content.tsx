'use client'

import {PersonnelTable} from '../_components/personnel-table'

export const Content = () => {
  return (
    <main className='min-h-screen px-4 pb-16'>
      <div className='space-y-6'>
        <header className='hidden space-y-3'>
          <h1 className='text-2xl font-semibold'>Personnel</h1>
          <p className='max-w-3xl text-sm text-muted-foreground'>
            Manage staff members, roles, permissions, and personnel information.
          </p>
        </header>
        <PersonnelTable />
      </div>
    </main>
  )
}

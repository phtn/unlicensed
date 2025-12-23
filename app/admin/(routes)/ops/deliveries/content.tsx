'use client'

import {DeliveriesTable} from './deliveries-table'

export const Content = () => {
  return (
    <main className='min-h-screen md:px-4 pb-16'>
      <div className='space-y-6'>
        <header className='hidden space-y-3'>
          <h1 className='text-2xl font-semibold'>Deliveries</h1>
          <p className='max-w-3xl text-sm text-muted-foreground'>
            Track delivery status, manage shipping, and monitor ongoing
            deliveries.
          </p>
        </header>
        <DeliveriesTable />
      </div>
    </main>
  )
}

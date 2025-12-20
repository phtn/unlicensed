'use client'

import {SalesTable} from './sales-table'

export const Content = () => {
  return (
    <main className='min-h-screen px-4 pb-16'>
      <div className='space-y-6'>
        <header className='hidden space-y-3'>
          <p className='max-w-3xl text-sm text-muted-foreground'>
            View and manage sales data, revenue reports, and analytics.
          </p>
        </header>
        <SalesTable />
      </div>
    </main>
  )
}

'use client'

import {CustomersTable} from './customers-table'

export const Content = () => {
  return (
    <main className='min-h-screen md:px-4 pb-16'>
      <div className='space-y-6'>
        <header className='hidden space-y-3'>
          <h1 className='text-2xl font-semibold'>Customers</h1>
          <p className='max-w-3xl text-sm text-muted-foreground'>
            View customer profiles.
          </p>
        </header>
        <CustomersTable />
      </div>
    </main>
  )
}

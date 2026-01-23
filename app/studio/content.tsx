'use client'

import {SalesDataTable} from '../admin/(routes)/reports/sales/x-sales-table'

export const Content = () => {
  return (
    <main className='flex items-center justify-center mx-auto min-h-screen w-7xl mt-24'>
      <SalesDataTable />
    </main>
  )
}

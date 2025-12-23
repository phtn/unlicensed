'use client'

import {MainWrapper} from '@/app/admin/_components/main-wrapper'
import {useAdminTabId} from '@/app/admin/_components/use-admin-tab'
import {Suspense} from 'react'
import {SalesTable} from './sales-table'

const ReportsContentInner = () => {
  // const sales = useQuery(api.orders.q.getOrdersByStatus, {status: 'delivered'})
  const [tabId] = useAdminTabId()

  switch (tabId) {
    default:
      return (
        <Suspense fallback={<div>Loading...</div>}>
          <SalesTable />
        </Suspense>
      )
  }
}

export const Content = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MainWrapper className='border-t-0'>
        <ReportsContentInner />
      </MainWrapper>
    </Suspense>
  )
}

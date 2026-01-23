'use client'

import {MainWrapper} from '@/app/admin/_components/main-wrapper'
import {useAdminTabId} from '@/app/admin/_components/use-admin-tab'
import {Suspense} from 'react'
import {SalesDataTable} from './x-sales-table'

const ReportsContentInner = () => {
  const [tabId] = useAdminTabId()

  switch (tabId) {
    default:
      return (
        <Suspense fallback={<div>Loading...</div>}>
          <div className='flex items-start justify-center mx-auto min-h-screen w-full dark:bg-dark-table/40'>
            <SalesDataTable />
          </div>
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

'use client'

import {MainTab} from '@/app/admin/@toolbar/components'
import {PageTitle} from '@/app/admin/_components/ui/page-title'
import {Suspense} from 'react'

const PaymentsTabInner = () => {
  return (
    <>
      {/* Payments Main Tab */}
      <MainTab href='/admin/payments'>
        <PageTitle>Payments</PageTitle>
      </MainTab>
    </>
  )
}

export const PaymentsTab = () => {
  return (
    <Suspense
      fallback={
        <div className='flex text-base items-center justify-between w-full px-2' />
      }>
      <PaymentsTabInner />
    </Suspense>
  )
}

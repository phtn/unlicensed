'use client'

import {MainWrapper} from '@/app/admin/_components/main-wrapper'
import {useAdminTabId} from '@/app/admin/_components/use-admin-tab'
import {Suspense} from 'react'
import {AffiliateContent} from '../affiliate/affiliate'
import {PayGateContent} from './paygate'

const ContentInner = () => {
  const [tabId] = useAdminTabId()

  // Handle affiliate tabs - if tabId is affiliate or starts with affiliate, show affiliate content
  if (tabId === 'affiliate' || tabId?.startsWith('affiliate')) {
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <AffiliateContent />
      </Suspense>
    )
  }

  // Default to PayGate content (includes paygate tab and default)
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PayGateContent />
    </Suspense>
  )
}

export const Content = () => {
  return (
    <MainWrapper className='border-t-0'>
      <Suspense fallback={<div>Loading...</div>}>
        <ContentInner />
      </Suspense>
    </MainWrapper>
  )
}

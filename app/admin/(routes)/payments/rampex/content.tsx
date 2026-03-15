'use client'

import {MainWrapper} from '@/app/admin/_components/main-wrapper'
import {useAdminTabId} from '@/app/admin/_components/use-admin-tab'
import {Suspense} from 'react'
import {GatewayContent} from '../_components/gateway-content'
import {UtilitiesContent} from '../_components/gateway-utilities'

const ContentInner = () => {
  const [tabId] = useAdminTabId()

  if (tabId === 'utilities' || tabId?.startsWith('utilities')) {
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <UtilitiesContent gateway='rampex' />
      </Suspense>
    )
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GatewayContent gateway='rampex' basePath='/admin/payments/rampex' />
    </Suspense>
  )
}

export const Content = () => (
  <MainWrapper className='border-t-0'>
    <Suspense fallback={<div>Loading...</div>}>
      <ContentInner />
    </Suspense>
  </MainWrapper>
)

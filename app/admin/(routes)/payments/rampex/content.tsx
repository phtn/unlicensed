'use client'

import {MainWrapper} from '@/app/admin/_components/main-wrapper'
import {Suspense} from 'react'
import {GatewayContent} from '../_components/gateway-content'

export const Content = () => (
  <MainWrapper className='border-t-0'>
    <Suspense fallback={<div>Loading...</div>}>
      <GatewayContent gateway='rampex' basePath='/admin/payments/rampex' />
    </Suspense>
  </MainWrapper>
)

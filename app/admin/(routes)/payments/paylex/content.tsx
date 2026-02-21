'use client'

import {GatewayContent} from '../paygate/gateway-content'
import {MainWrapper} from '@/app/admin/_components/main-wrapper'
import {Suspense} from 'react'

export const Content = () => (
  <MainWrapper className='border-t-0'>
    <Suspense fallback={<div>Loading...</div>}>
      <GatewayContent gateway='paylex' basePath='/admin/payments/paylex' />
    </Suspense>
  </MainWrapper>
)

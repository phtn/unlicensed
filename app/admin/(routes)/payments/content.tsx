'use client'

import {Suspense} from 'react'
import {MainWrapper} from '../../_components/main-wrapper'
import {PayGateContent} from './paygate/paygate'

export const Content = () => {
  return (
    <MainWrapper className='border-t-0'>
      <Suspense fallback={<div>Loading...</div>}>
        <PayGateContent />
      </Suspense>
    </MainWrapper>
  )
}

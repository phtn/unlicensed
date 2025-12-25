'use client'

import {MainWrapper} from '../../_components/main-wrapper'
import {PayGateContent} from './paygate/paygate'
import {Suspense} from 'react'

export const Content = () => {
  return (
    <MainWrapper>
      <Suspense fallback={<div>Loading...</div>}>
        <PayGateContent />
      </Suspense>
    </MainWrapper>
  )
}

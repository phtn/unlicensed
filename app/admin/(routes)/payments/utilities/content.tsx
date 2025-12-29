'use client'

import {MainWrapper} from '@/app/admin/_components/main-wrapper'
import {CurrencyConverter} from '../paygate/currency-converter'
import {PayGateProviders} from '../paygate/providers-list'

export const UtilitiesContent = () => {
  return (
    <MainWrapper>
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
        <CurrencyConverter />
        <CurrencyConverter />
        <PayGateProviders />
      </div>
    </MainWrapper>
  )
}

'use client'

import {MainWrapper} from '@/app/admin/_components/main-wrapper'
import {CurrencyConverter} from '../paygate/currency-converter'
import {PayGateProviders} from '../paygate/providers-list'

export const UtilitiesContent = () => {
  return (
    <MainWrapper>
      <div className='h-[calc(100lvh-64px)] md:h-full overflow-scroll grid grid-cols-1 md:grid-cols-2 gap-4 px-4 md:px-0'>
        <div className='w-full min-w-0'>
          <CurrencyConverter />
        </div>
        <div className='w-full min-w-0'>
          <PayGateProviders />
        </div>
      </div>
    </MainWrapper>
  )
}

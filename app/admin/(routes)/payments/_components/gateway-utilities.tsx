'use client'

import {MainWrapper} from '@/app/admin/_components/main-wrapper'
import type {GatewayId} from '@/lib/paygate/gateway-config'
import {CurrencyConverter} from './currency-converter'
import {ProvidersList} from './gateway-providers'

interface UtilitiesContentProps {
  gateway: GatewayId
}

export const UtilitiesContent = ({gateway}: UtilitiesContentProps) => {
  return (
    <MainWrapper>
      <div className='h-[calc(100lvh-64px)] md:h-full overflow-scroll grid grid-cols-1 md:grid-cols-3 gap-4 px-4 md:px-0'>
        <div className='w-full min-w-0 '>
          <CurrencyConverter gateway={gateway} />
        </div>
        <div className='w-full min-w-0 col-span-2'>
          <ProvidersList gateway={gateway} />
        </div>
      </div>
    </MainWrapper>
  )
}

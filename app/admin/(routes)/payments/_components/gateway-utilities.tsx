'use client'

import {MainWrapper} from '@/app/admin/_components/main-wrapper'
import type {GatewayId} from '@/lib/paygate/gateway-config'
import {Converters} from './currency-converter'
import {ProvidersList} from './gateway-providers'

interface GatewayUtilitiesContentProps {
  gateway: GatewayId
}

export const GatewayUtilitiesContent = ({
  gateway,
}: GatewayUtilitiesContentProps) => {
  return (
    <MainWrapper>
      <div className='h-[calc(100lvh-64px)] md:h-full overflow-scroll grid grid-cols-1 md:grid-cols-3 gap-8 px-2 md:px-0'>
        <div className='w-full min-w-0 '>
          <Converters />
        </div>
        <div className='w-full min-w-0 md:col-span-2'>
          <ProvidersList gateway={gateway} />
        </div>
      </div>
    </MainWrapper>
  )
}

export const UtilitiesContent = GatewayUtilitiesContent

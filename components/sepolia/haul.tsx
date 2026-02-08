'use client'

import {CryptoWidget} from '@/components/ncash/widget'
import {SearchParamsProvider} from './search-params-context'

export const Haul = () => {
  return (
    <SearchParamsProvider>
      <main className='min-h-screen space-x-12 flex items-start justify-center'>
        <div className='flex items-start md:mt-28 h-full w-full'>
          <CryptoWidget />
        </div>
      </main>
    </SearchParamsProvider>
  )
}

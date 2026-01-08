'use client'

import {SectionHeader} from '@/app/admin/_components/ui/section-header'
import {HyperList} from '@/components/expermtl/hyper-list'
import {useApiCall} from '@/hooks/use-api-call'
import {Icon} from '@/lib/icons'
import type {Provider, ProviderStatusResponse} from '@/lib/paygate/types'
import {cn} from '@/lib/utils'
import {Card, CardHeader} from '@heroui/react'
import {useEffect, useMemo} from 'react'

// Type guard for ProviderStatusResponse
function isProviderStatusResponse(
  data: unknown,
): data is ProviderStatusResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'providers' in data &&
    Array.isArray((data as ProviderStatusResponse).providers)
  )
}

export const FeesList = () => {
  const {handleApiCall, response} = useApiCall()

  useEffect(() => {
    if (!response) {
      handleApiCall('https://api.paygate.to/control/provider-status/')
    }
  }, [handleApiCall, response])

  const data = useMemo(() => {
    if (response?.data && isProviderStatusResponse(response.data)) {
      return response.data.providers
    }
    return []
  }, [response?.data])

  if (!response) {
    return (
      <div className='flex items-center gap-2'>
        <Icon name='spinners-ring' className='text-flavors' />
        <span className='text-small text-default-500'>
          Loading providers...
        </span>
      </div>
    )
  }

  if (response.error) {
    return (
      <div className='text-small text-danger'>
        Failed to load providers: {response.error}
      </div>
    )
  }

  if (
    !response.data ||
    !isProviderStatusResponse(response.data) ||
    response.data.providers.length === 0
  ) {
    return (
      <div className='text-small text-default-500'>No providers available</div>
    )
  }

  return (
    <div className='dark:text-white space-y-4 py-4'>
      <SectionHeader title='Providers'>{data.length}</SectionHeader>
      <HyperList
        data={data}
        component={ProviderItem}
        container='w-full flex flex-col border-t border-x border-sidebar'
        itemStyle='w-full md:w-auto'
      />
    </div>
  )
}

const ProviderItem = (item: Provider) => (
  <Card shadow='none' radius='none' className='border-b border-sidebar w-full'>
    <CardHeader className='flex items-center justify-between px-2 w-full'>
      <div className='flex items-center flex-1 space-x-2'>
        <span
          className={cn('text-sm', {
            'text-emerald-500': item.status === 'active',
            'text-flavors': item.status === 'redirected',
            'text-danger': item.status === 'unstable',
          })}>
          ⬤
        </span>
        <span className='font-medium'>{item.provider_name}</span>
      </div>
      <div className={cn('flex justify-end space-x-4')}>
        <div className='font-brk font-foreground!'>
          {item.minimum_amount} {item.minimum_currency}
        </div>
        <div
          className={cn(
            'font-brk tracking-tighter w-full flex items-center justify-end',
            {
              'text-emerald-500': item.status === 'active',
              'text-flavors': item.status === 'redirected',
              'text-danger': item.status === 'unstable',
            },
          )}>
          <span className='w-24'>{item.status}</span>
        </div>
      </div>
    </CardHeader>
  </Card>
)

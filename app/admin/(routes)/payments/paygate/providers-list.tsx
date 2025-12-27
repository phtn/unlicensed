'use client'

import {HyperList} from '@/components/expermtl/hyper-list'
import {useApiCall} from '@/hooks/use-api-call'
import {Icon} from '@/lib/icons'
import type {Provider, ProviderStatusResponse} from '@/lib/paygate/types'
import {cn} from '@/lib/utils'
import {Card, CardHeader} from '@heroui/react'
import {Key, PropsWithChildren, useEffect, useMemo, useState} from 'react'

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

const ProvidersList = () => {
  const [selectedKeys] = useState<Set<Key>>(new Set())
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

  const selectedValue = useMemo(
    () => Array.from(selectedKeys).join(', '),
    [selectedKeys],
  )

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
    <div className='flex flex-col gap-2'>
      <ListboxWrapper>
        <HyperList
          data={data}
          component={ProviderItem}
          container='w-full flex flex-col md:flex-row md:flex-wrap gap-2'
          itemStyle='w-full md:w-auto'
        />
      </ListboxWrapper>
      {selectedKeys.size > 0 && (
        <p className='text-small'>Selected: {selectedValue}</p>
      )}
    </div>
  )
}

const ProviderItem = (item: Provider) => (
  <Card shadow='none' className='border border-sidebar md:w-84 w-full'>
    <CardHeader className='flex items-center justify-between px-4 w-full'>
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
      <div className={cn('flex justify-end space-x-4 md:space-x-0')}>
        <div className='font-space font-foreground!'>
          {item.minimum_amount} {item.minimum_currency}
        </div>
        <div
          className={cn(
            'md:hidden font-space w-full flex items-center justify-end',
            {
              'text-emerald-500': item.status === 'active',
              'text-flavors': item.status === 'redirected',
              'text-danger': item.status === 'unstable',
            },
          )}>
          <span className='w-20'>{item.status}</span>
        </div>
      </div>
    </CardHeader>
  </Card>
)

const ListboxWrapper = ({children}: PropsWithChildren) => (
  <div className='w-full'>{children}</div>
)

export const PayGateProviders = () => (
  <div className='dark:text-white py-4'>
    <h2 className='text-2xl font-polysans font-semibold mt-2 mb-4'>
      Providers
    </h2>
    <ProvidersList />
  </div>
)

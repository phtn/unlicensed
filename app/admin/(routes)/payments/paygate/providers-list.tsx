'use client'

import {HyperList} from '@/components/expermtl/hyper-list'
import {Icon} from '@/lib/icons'
import type {Provider} from '@/lib/paygate/types'
import {cn} from '@/lib/utils'
import {Card, CardHeader} from '@heroui/react'
import {Key, PropsWithChildren, useMemo, useState} from 'react'

interface ProvidersListProps {
  data: Provider[]
  loading: boolean
  error: Error | null
}

export const ProvidersList = ({data, loading, error}: ProvidersListProps) => {
  const [selectedKeys] = useState<Set<Key>>(new Set())

  const selectedValue = useMemo(
    () => Array.from(selectedKeys).join(', '),
    [selectedKeys],
  )

  if (loading) {
    return (
      <div className='flex items-center gap-2'>
        <Icon name='spinners-ring' className='text-flavors' />
        <span className='text-small text-default-500'>
          Loading providers...
        </span>
      </div>
    )
  }

  if (error) {
    return (
      <div className='text-small text-danger'>
        Failed to load providers: {error.message}
      </div>
    )
  }

  if (!data || data.length === 0) {
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
  <Card shadow='none' className='border border-sidebar sm:w-84 w-full'>
    <CardHeader className='flex items-center justify-between px-4 w-full'>
      <div className='flex items-center flex-1'>
        <span className='font-medium'>{item.provider_name}</span>
      </div>
      <div className={cn('flex justify-end')}>
        <div className='font-space font-foreground! px-6'>
          {item.minimum_amount} {item.minimum_currency}
        </div>
        <div
          className={cn(
            'font-space w-28 md:w-full flex items-center justify-end space-x-2',
            {
              'text-emerald-500': item.status === 'active',
              'text-flavors': item.status === 'redirected',
              'text-danger': item.status === 'unstable',
            },
          )}>
          <span className='md:hidden'>{item.status}</span>
          <span>⬤</span>
        </div>
      </div>
    </CardHeader>
  </Card>
)

const ListboxWrapper = ({children}: PropsWithChildren) => (
  <div className='w-full'>{children}</div>
)

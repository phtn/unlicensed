'use client'

import type {Provider} from '@/lib/paygate/types'
import {Listbox, ListboxItem, Spinner} from '@heroui/react'
import {Key, PropsWithChildren, useMemo, useState} from 'react'

const ListboxWrapper = ({children}: PropsWithChildren) => (
  <div className='w-[260px] border-small px-1 py-2 rounded-small border-default-200 dark:border-default-100'>
    {children}
  </div>
)

interface ProvidersListProps {
  data: Provider[]
  loading: boolean
  error: Error | null
}

export const ProvidersList = ({data, loading, error}: ProvidersListProps) => {
  const [selectedKeys, setSelectedKeys] = useState<Set<Key>>(new Set())

  const selectedValue = useMemo(
    () => Array.from(selectedKeys).join(', '),
    [selectedKeys],
  )

  if (loading) {
    return (
      <div className='flex items-center gap-2'>
        <Spinner size='sm' />
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
        <Listbox
          aria-label='PayGate payment providers'
          selectedKeys={selectedKeys as Set<string>}
          selectionMode='multiple'
          variant='flat'
          onSelectionChange={(keys) => {
            if (keys instanceof Set) {
              setSelectedKeys(keys)
            } else if (keys === 'all') {
              setSelectedKeys(new Set(data.map((p) => p.id)))
            } else {
              setSelectedKeys(new Set())
            }
          }}>
          {data.map((provider: Provider) => (
            <ListboxItem
              key={provider.id}
              description={`Min: ${provider.minimum_amount} ${provider.minimum_currency} • Status: ${provider.status}`}>
              {provider.provider_name}
            </ListboxItem>
          ))}
        </Listbox>
      </ListboxWrapper>
      {selectedKeys.size > 0 && (
        <p className='text-small text-default-500'>Selected: {selectedValue}</p>
      )}
    </div>
  )
}

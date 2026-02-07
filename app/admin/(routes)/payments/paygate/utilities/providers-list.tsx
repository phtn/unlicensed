'use client'

import {SectionHeader} from '@/app/admin/_components/ui/section-header'
import {api} from '@/convex/_generated/api'
import {useApiCall} from '@/hooks/use-api-call'
import {Icon} from '@/lib/icons'
import type {Provider, ProviderStatusResponse} from '@/lib/paygate/types'
import {cn} from '@/lib/utils'
import {Card, CardHeader} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import {useCallback, useEffect, useMemo} from 'react'

const TOP_TEN_MAX = 10

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
  const {handleApiCall, response} = useApiCall()
  const defaultAccount = useQuery(api.paygateAccounts.q.getDefaultAccount)
  const updateTopTenProviders = useMutation(
    api.paygateAccounts.m.updateTopTenProviders,
  )

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

  const topTen = useMemo(
    () => defaultAccount?.topTenProviders ?? [],
    [defaultAccount?.topTenProviders],
  )

  const handleToggleProvider = useCallback(
    (providerName: string) => {
      if (defaultAccount == null) return
      const next = topTen.includes(providerName)
        ? topTen.filter((p) => p !== providerName)
        : topTen.length < TOP_TEN_MAX
          ? [...topTen, providerName]
          : topTen
      if (next !== topTen) {
        updateTopTenProviders({
          id: defaultAccount._id,
          topTenProviders: next,
        })
      }
    },
    [defaultAccount, topTen, updateTopTenProviders],
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

  const accountLoading = defaultAccount === undefined
  const canSelect = defaultAccount != null

  return (
    <div className='dark:text-white space-y-4 py-4'>
      <SectionHeader title='Providers'>{data.length}</SectionHeader>
      {accountLoading && (
        <p className='text-small text-default-500'>Loading account…</p>
      )}
      {!accountLoading && !canSelect && (
        <p className='text-small text-default-500'>
          Set a default PayGate account to select top {TOP_TEN_MAX} providers.
        </p>
      )}
      {canSelect && (
        <p className='text-small text-default-500'>
          Click a provider to add/remove from top {TOP_TEN_MAX} ({topTen.length}
          /{TOP_TEN_MAX} selected).
        </p>
      )}
      <div className='w-full flex flex-col border-t border-x border-sidebar'>
        {data.map((item) => (
          <ProviderItem
            key={item.id}
            item={item}
            isSelected={topTen.includes(item.provider_name)}
            onToggle={() => handleToggleProvider(item.provider_name)}
            disabled={!canSelect}
          />
        ))}
      </div>
    </div>
  )
}

type ProviderItemProps = {
  item: Provider
  isSelected: boolean
  onToggle: () => void
  disabled: boolean
}

const ProviderItem = ({
  item,
  isSelected,
  onToggle,
  disabled,
}: ProviderItemProps) => {
  const handleClick = () => {
    if (!disabled) onToggle()
  }
  return (
    <Card
      shadow='none'
      radius='none'
      className={cn(
        'border-b border-sidebar w-full transition-colors',
        isSelected && 'ring-2 ring-primary ring-inset bg-primary/5',
      )}>
      <button
        type='button'
        className={cn(
          'w-full text-left outline-none',
          !disabled &&
            'cursor-pointer hover:bg-default-100 active:bg-default-200 rounded-none',
        )}
        onClick={handleClick}
        disabled={disabled}
        aria-pressed={isSelected}
        aria-label={
          disabled
            ? undefined
            : `${item.provider_name}, ${item.status}. ${isSelected ? 'In top 10. Click to remove.' : 'Click to add to top 10.'}`
        }>
        <CardHeader className='flex items-center justify-between px-2 w-full pointer-events-none'>
          <div className='flex items-center flex-1 space-x-2'>
            {isSelected && (
              <span className='text-primary text-sm font-medium' title='Top 10'>
                ★
              </span>
            )}
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
      </button>
    </Card>
  )
}

export const PayGateProviders = () => <ProvidersList />

// credit/debit card
// 1. robinhood 3 off
// 2. unlimit - 5 charge
// 3. moonpay - 5 charge

// - ramp network (untested)
// - onrampmoney (untested)
//
// - Crypto
// - CashApp - Surcharge
//

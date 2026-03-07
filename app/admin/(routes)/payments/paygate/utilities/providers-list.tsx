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
  const defaultAccount = useQuery(api.paygateAccounts.q.getDefaultAccount, {})
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
    (item: Provider) => {
      if (defaultAccount == null) return
      const isInTopTen = topTen.some((p) => p.id === item.id)
      const next = isInTopTen
        ? topTen.filter((p) => p.id !== item.id)
        : topTen.length < TOP_TEN_MAX
          ? [
              ...topTen,
              {
                id: item.id,
                provider_name: item.provider_name,
                status: item.status,
                minimum_currency: item.minimum_currency,
                minimum_amount: item.minimum_amount,
              },
            ]
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
    <div className='dark:text-white py-4'>
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
      <div className='w-full grid grid-cols-2 md:grid-cols-3 gap-2 mt-4'>
        {data.map((item) => (
          <ProviderItem
            key={item.id}
            item={item}
            isSelected={topTen.some((p) => p.id === item.id)}
            onToggle={() => handleToggleProvider(item)}
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
        'border border-sidebar w-full transition-colors p-2',
        isSelected && 'ring-2 ring-primary ring-inset bg-primary/5',
      )}>
      <button
        type='button'
        className={cn(
          'w-full outline-none',
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
        <CardHeader className='flex w-full justify-between text-left px-2 pointer-events-none'>
          <div className=''>
            <span className='font-medium'>{item.provider_name}</span>
            <div className='flex items-center space-x-2'>
              <span
                className={cn('text-xs', {
                  'text-emerald-500': item.status === 'active',
                  'text-flavors': item.status === 'redirected',
                  'text-danger': item.status === 'unstable',
                })}>
                ⬤
              </span>
              <span className='w-24'>{item.status}</span>
            </div>
          </div>

          <div className='flex items-start justify-end'>
            <div className='text-sm font-ios'>
              <p>
                {item.minimum_amount}{' '}
                <span className='font-light'>{item.minimum_currency}</span>
              </p>
              <p className='text-xs text-center'>minimum</p>
            </div>
            <div
              className={cn(
                'font-brk tracking-tighter w-full flex items-center justify-end',
                {
                  'text-emerald-500': item.status === 'active',
                  'text-flavors': item.status === 'redirected',
                  'text-danger': item.status === 'unstable',
                },
              )}></div>
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

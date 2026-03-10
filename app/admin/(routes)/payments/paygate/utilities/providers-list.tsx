'use client'

import {SectionHeader} from '@/app/admin/_components/ui/section-header'
import {api} from '@/convex/_generated/api'
import {useApiCall} from '@/hooks/use-api-call'
import {Icon} from '@/lib/icons'
import type {Provider, ProviderStatusResponse} from '@/lib/paygate/types'
import {cn} from '@/lib/utils'
import {Card, CardHeader} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import {useEffect, useMemo, useState} from 'react'
import {toast} from 'react-hot-toast'

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
  const gatewayDoc = useQuery(api.gateways.q.getByGateway, {gateway: 'paygate'})
  const defaultAccount = useQuery(api.paygateAccounts.q.getDefaultAccount, {
    gateway: 'paygate',
  })
  const updateAccountTopTenProviders = useMutation(
    api.paygateAccounts.m.updateTopTenProviders,
  )
  const updateGatewayTopTenProviders = useMutation(
    api.gateways.m.updateTopTenProviders,
  )
  const [isSaving, setIsSaving] = useState(false)

  const providerStatusUrl = useMemo(() => {
    const apiUrl = gatewayDoc?.apiUrl?.trim() || 'https://api.paygate.to'
    return `${apiUrl.replace(/\/$/, '')}/control/provider-status/`
  }, [gatewayDoc?.apiUrl])

  useEffect(() => {
    if (!response && gatewayDoc !== undefined) {
      handleApiCall(providerStatusUrl)
    }
  }, [gatewayDoc, handleApiCall, providerStatusUrl, response])

  const data =
    response?.data && isProviderStatusResponse(response.data)
      ? response.data.providers
      : []

  const topTen = gatewayDoc?.topTenProviders ?? []
  const defaultProvider = gatewayDoc?.defaultProvider ?? topTen[0]?.id

  const handleToggleProvider = async (item: Provider) => {
    if (!gatewayDoc?._id && !defaultAccount?._id) return

    const isInTopTen = topTen.some((provider) => provider.id === item.id)
    const next = isInTopTen
      ? topTen.filter((provider) => provider.id !== item.id)
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

    if (next === topTen) return

    const nextDefaultProvider =
      defaultProvider &&
      next.some((provider) => provider.id === defaultProvider)
        ? defaultProvider
        : next[0]?.id

    try {
      setIsSaving(true)

      if (defaultAccount?._id) {
        await updateAccountTopTenProviders({
          id: defaultAccount._id,
          topTenProviders: next,
          defaultProvider: nextDefaultProvider,
        })
        return
      }

      if (gatewayDoc?._id) {
        await updateGatewayTopTenProviders({
          gatewayId: gatewayDoc._id,
          topTenProviders: next,
          defaultProvider: nextDefaultProvider,
        })
      }
    } catch (error) {
      console.error(error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to update providers',
      )
    } finally {
      setIsSaving(false)
    }
  }

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

  const accountLoading = gatewayDoc === undefined || defaultAccount === undefined
  const canSelect = gatewayDoc?._id != null || defaultAccount?._id != null

  return (
    <div className='dark:text-white py-4'>
      <SectionHeader title='Providers'>{data.length}</SectionHeader>
      {accountLoading && (
        <p className='text-small text-default-500'>Loading account…</p>
      )}
      {!accountLoading && !canSelect && (
        <p className='text-small text-default-500'>
          Configure the PayGate gateway to select top {TOP_TEN_MAX} providers.
        </p>
      )}
      {canSelect && (
        <p className='text-small text-default-500'>
          Click a provider to add/remove from top {TOP_TEN_MAX} ({topTen.length}
          /{TOP_TEN_MAX} selected). The first selected provider is used as the
          default.
          {isSaving ? ' Saving…' : ''}
        </p>
      )}
      <div className='w-full grid grid-cols-2 md:grid-cols-3 gap-2 mt-4'>
        {data.map((item) => (
          <ProviderItem
            key={item.id}
            item={item}
            isSelected={topTen.some((p) => p.id === item.id)}
            isDefault={item.id === defaultProvider}
            onToggle={() => handleToggleProvider(item)}
            disabled={!canSelect || isSaving || item.status !== 'active'}
          />
        ))}
      </div>
    </div>
  )
}

type ProviderItemProps = {
  item: Provider
  isSelected: boolean
  isDefault: boolean
  onToggle: () => void
  disabled: boolean
}

const ProviderItem = ({
  item,
  isSelected,
  isDefault,
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
          'w-full ',
          {
            'cursor-pointer hover:bg-default-100 active:bg-default-200 rounded-none':
              !disabled,
          },
          'outline-one disabled:opacity-40',
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
            <div className='flex items-center gap-2'>
              <span className='font-medium'>{item.provider_name}</span>
              {isDefault ? (
                <span className='text-[10px] uppercase tracking-[0.18em] px-2 py-0.5 rounded bg-primary/15 text-primary'>
                  Default
                </span>
              ) : null}
            </div>
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
                  'text-primary': isDefault,
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

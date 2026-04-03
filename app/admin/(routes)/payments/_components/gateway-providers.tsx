'use client'

import {SectionHeader} from '@/app/admin/_components/ui/section-header'
import {api} from '@/convex/_generated/api'
import {useApiCall} from '@/hooks/use-api-call'
import {Icon} from '@/lib/icons'
import {
  getGatewayPublicConfig,
  type GatewayId,
} from '@/lib/paygate/gateway-config'
import type {Provider, ProviderStatusResponse} from '@/lib/paygate/types'
import {cn} from '@/lib/utils'
import {Card, CardHeader} from '@/lib/heroui'
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

interface ProvidersListProps {
  gateway: GatewayId
}

const PROVIDER_STATUS_ORDER: Array<Provider['status']> = [
  'active',
  'redirected',
  'unstable',
  'inactive',
]

const PROVIDER_STATUS_META: Record<
  Provider['status'],
  {label: string; dotClassName: string}
> = {
  active: {label: 'Active', dotClassName: 'text-emerald-500'},
  redirected: {label: 'Redirected', dotClassName: 'text-flavors'},
  unstable: {label: 'Unstable', dotClassName: 'text-danger'},
  inactive: {label: 'Inactive', dotClassName: 'text-default-400'},
}

function formatGatewayLabel(gateway: GatewayId, label?: string) {
  if (label?.trim()) return label
  return gateway.charAt(0).toUpperCase() + gateway.slice(1)
}

export const ProvidersList = ({gateway}: ProvidersListProps) => {
  const {handleApiCall, response} = useApiCall()
  const gatewayDoc = useQuery(api.gateways.q.getByGateway, {gateway})
  const updateGatewayTopTenProviders = useMutation(
    api.gateways.m.updateTopTenProviders,
  )
  const [isSaving, setIsSaving] = useState(false)

  const providerStatusUrl = useMemo(() => {
    const apiUrl =
      gatewayDoc?.apiUrl?.trim() || getGatewayPublicConfig(gateway).apiUrl
    return `${apiUrl.replace(/\/$/, '')}/control/provider-status/`
  }, [gateway, gatewayDoc?.apiUrl])

  useEffect(() => {
    if (gatewayDoc === undefined || response?.url === providerStatusUrl) return
    void handleApiCall(providerStatusUrl)
  }, [gatewayDoc, handleApiCall, providerStatusUrl, response?.url])

  const data = useMemo(
    () =>
      response?.data && isProviderStatusResponse(response.data)
        ? response.data.providers
        : [],
    [response?.data],
  )
  const providerStatusCounts = useMemo(
    () =>
      data.reduce<Record<Provider['status'], number>>(
        (counts, provider) => {
          counts[provider.status] += 1
          return counts
        },
        {
          active: 0,
          redirected: 0,
          unstable: 0,
          inactive: 0,
        },
      ),
    [data],
  )

  const gatewayLabel = formatGatewayLabel(gateway, gatewayDoc?.label)
  const topTen = gatewayDoc?.topTenProviders ?? []
  const defaultProvider = gatewayDoc?.defaultProvider ?? topTen[0]?.id

  const handleToggleProvider = async (item: Provider) => {
    if (!gatewayDoc) return

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
      await updateGatewayTopTenProviders({
        gatewayId: gateway,
        topTenProviders: next,
        defaultProvider: nextDefaultProvider,
      })
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

  const gatewayLoading = gatewayDoc === undefined
  const canSelect = gatewayDoc != null

  return (
    <div className='dark:text-white py-4'>
      <SectionHeader title={`${gatewayLabel} Providers`}>
        <div className='flex items-center gap-2 text-xs'>
          {PROVIDER_STATUS_ORDER.map((status) => (
            <div
              key={status}
              className='flex items-center space-x-1 rounded-md border border-default-200 px-2 h-6 text-default-600 dark:border-default-100/10'>
              <span
                className={cn(
                  'text-[7px]',
                  PROVIDER_STATUS_META[status].dotClassName,
                )}>
                ⬤
              </span>
              {/*<span>{PROVIDER_STATUS_META[status].label}</span>*/}
              <span className='font-medium text-foreground text-sm'>
                {providerStatusCounts[status]}
              </span>
            </div>
          ))}
        </div>
      </SectionHeader>
      {gatewayLoading && (
        <p className='text-small text-default-500'>Loading gateway…</p>
      )}
      {!gatewayLoading && !canSelect && (
        <p className='text-small text-default-500'>
          Configure the {gatewayLabel} gateway to select top {TOP_TEN_MAX}{' '}
          providers.
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
                <span className='text-[8px] uppercase tracking-[0.18em] px-1.5 py-0.5 rounded-md bg-primary/15 text-primary font-ios'>
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

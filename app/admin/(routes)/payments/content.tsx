'use client'

import {MainWrapper} from '@/app/admin/_components/main-wrapper'
import {api} from '@/convex/_generated/api'
import {Icon} from '@/lib/icons'
import {Button, RadioGroup} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import {Activity, useCallback, useEffect} from 'react'
import {PayCard} from './card-item'

const SUPPORTED_GATEWAYS = ['paygate', 'paylex', 'rampex'] as const

export const Content = () => {
  const gateways = useQuery(api.gateways.q.list)
  const paymentGatewaySetting = useQuery(api.admin.q.getAdminByIdentifier, {
    identifier: 'payment-gateway',
  })
  const seedGateways = useMutation(api.gateways.seed.seedGateways)
  const updatePaymentGatewayDefault = useMutation(
    api.admin.m.updatePaymentGatewayDefault,
  )

  const defaultGateway =
    paymentGatewaySetting?.value &&
    typeof paymentGatewaySetting.value === 'object' &&
    'defaultGateway' in paymentGatewaySetting.value
      ? (paymentGatewaySetting.value.defaultGateway as string)
      : undefined

  const fallbackGateway =
    gateways?.find(
      (gateway): gateway is (typeof gateways)[number] & {
        gateway: (typeof SUPPORTED_GATEWAYS)[number]
      } =>
        !!gateway.gateway &&
        SUPPORTED_GATEWAYS.includes(
          gateway.gateway as (typeof SUPPORTED_GATEWAYS)[number],
        ),
    )?.gateway ?? ''

  const selectedGateway =
    defaultGateway && SUPPORTED_GATEWAYS.includes(defaultGateway as never)
      ? defaultGateway
      : fallbackGateway

  useEffect(() => {
    if (gateways === undefined || paymentGatewaySetting === undefined) return
    if (!fallbackGateway) return
    if (defaultGateway && SUPPORTED_GATEWAYS.includes(defaultGateway as never)) {
      return
    }

    void updatePaymentGatewayDefault({
      defaultGateway: fallbackGateway,
    })
  }, [
    defaultGateway,
    fallbackGateway,
    gateways,
    paymentGatewaySetting,
    updatePaymentGatewayDefault,
  ])

  const handleDefaultChange = useCallback(
    (gateway: string) => {
      if (gateway && SUPPORTED_GATEWAYS.includes(gateway as never)) {
        void updatePaymentGatewayDefault({
          defaultGateway: gateway as 'paygate' | 'paylex' | 'rampex',
        })
      }
    },
    [updatePaymentGatewayDefault],
  )

  const handleSeed = useCallback(async () => {
    await seedGateways()
  }, [seedGateways])

  return (
    <MainWrapper className='border-t-0'>
      <div className='space-y-6 w-full'>
        <RadioGroup
          aria-label='Default payment gateway'
          name='default-payment-gateway'
          variant='primary'
          value={selectedGateway}
          onChange={handleDefaultChange}
          className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-4 md:px-0'>
          {gateways?.map((gateway) => (
            <PayCard
              key={gateway._id}
              radioValue={gateway.gateway}
              title={gateway.label ?? gateway.gateway}
              description={gateway.description ?? 'Multi-provider'}
              isDefault={gateway.gateway === defaultGateway}
              accounts={gateway.accounts}
              href={
                gateway.gateway
                  ? `/admin/payments/${gateway.gateway}`
                  : undefined
              }
            />
          ))}
        </RadioGroup>
        <Activity mode={!gateways ? 'visible' : 'hidden'}>
          <Icon name='spinner-dots' />
        </Activity>
        <Activity
          mode={
            gateways !== undefined && gateways.length === 1
              ? 'visible'
              : 'hidden'
          }>
          <Button
            onPress={handleSeed}
            variant='primary'
            size='lg'
            className='w-full'>
            Seed
          </Button>
        </Activity>
      </div>
    </MainWrapper>
  )
}

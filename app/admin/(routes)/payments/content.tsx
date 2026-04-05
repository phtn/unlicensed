'use client'

import {MainWrapper} from '@/app/admin/_components/main-wrapper'
import {api} from '@/convex/_generated/api'
import {Icon} from '@/lib/icons'
import {Button, CheckboxGroup} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import {Activity, useCallback} from 'react'
import {PayCard} from './card-item'

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

  const selectedGateways =
    defaultGateway && ['paygate', 'paylex', 'rampex'].includes(defaultGateway)
      ? [defaultGateway]
      : []

  const handleDefaultChange = useCallback(
    (selected: string[]) => {
      const gateway = selected[selected.length - 1]
      if (gateway && ['paygate', 'paylex', 'rampex'].includes(gateway)) {
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
        <CheckboxGroup
          value={selectedGateways}
          onChange={handleDefaultChange}
          className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-4 md:px-0'>
          {gateways?.map((gateway) => (
            <PayCard
              key={gateway._id}
              checkboxValue={gateway.gateway}
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
        </CheckboxGroup>
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

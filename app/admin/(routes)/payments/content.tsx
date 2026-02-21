'use client'

import {MainWrapper} from '@/app/admin/_components/main-wrapper'
import {IconName} from '@/lib/icons'
import {PayCard} from './card-item'

interface PaymentGateway {
  id: string
  name: string
  description: string
  icon: IconName
  href: string
  color: string
}

const gateways: PaymentGateway[] = [
  {
    id: 'paygate',
    name: 'PayGate',
    description: 'Multi-provider',
    icon: 'wallet',
    href: '/admin/payments/paygate',
    color: 'indigo',
  },
  {
    id: 'paylex',
    name: 'Paylex',
    description: 'Multi-provider',
    icon: 'wallet',
    href: '/admin/payments/paylex',
    color: 'indigo',
  },
  {
    id: 'rampex',
    name: 'Rampex',
    description: 'Multi-provider',
    icon: 'wallet',
    href: '/admin/payments/rampex',
    color: 'indigo',
  },
  // Add more providers here as they are implemented
]

export const Content = () => {
  return (
    <MainWrapper className='border-t-0'>
      <div className='space-y-6'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-4 md:px-0'>
          {gateways.map((gateway) => (
            <PayCard
              key={gateway.id}
              title={gateway.name}
              description={gateway.description}
              href={gateway.href}
            />
          ))}
        </div>
      </div>
    </MainWrapper>
  )
}

'use client'

import {useAdminTab} from '@/app/admin/_components/use-admin-tab'
import {TextureCardDescription} from '@/components/ui/texture-card'
import {Icon, IconName} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Card} from '@heroui/react'
import {ViewTransition} from 'react'
import {ContentHeader} from './components'

interface SettingItem {
  id: string
  title: string
  description: string
  icon: IconName
}

const SETTINGS_FEATURES: Array<SettingItem> = [
  {
    id: 'access',
    title: 'Access Code',
    description: 'Halt Gate Access codes',
    icon: 'finger-press-line',
  },
  {
    id: 'alerts',
    title: 'Alerts',
    description: 'Configure alerts and notifications.',
    icon: 'bell',
  },
  {
    id: 'assistant',
    title: 'AI Assistant',
    description: 'Configure AI assistat instructions and context.',
    icon: 'sparkles',
  },
  {
    id: 'comms',
    title: 'Comms Channels',
    description: 'Configure Communications Channel Links.',
    icon: 'messenger',
  },
  {
    id: 'coupons',
    title: 'Coupons',
    description: 'Configure store coupons and promo codes.',
    icon: 'coupon',
  },
  {
    id: 'crypto',
    title: 'Crypto Wallets',
    description: 'Manage crypto wallets.',
    icon: 'wallet',
  },
  {
    id: 'deals',
    title: 'Deals',
    description: 'Configure store deals and mix-and-match bundles.',
    icon: 'sale',
  },
  {
    id: 'metapixel',
    title: 'Metapixel',
    description: 'Integration Still On-going',
    icon: 'meta',
  },
  {
    id: 'rep',
    title: 'Customer Service Representative',
    description: 'Assign Default Rep account and seed message.',
    icon: 'service',
  },
  {
    id: 'rewards',
    title: 'Rewards',
    description: 'Manage Reward Tiers.',
    icon: 'coins',
  },
  {
    id: 'payments',
    title: 'Payment Methods',
    description: 'Configure payment providers, gateways, and billing.',
    icon: 'credit-card',
  },
] as const

export const OverviewContent = () => {
  const [, setTab] = useAdminTab('overview')

  return (
    <div className='flex w-full flex-col gap-2 p-0 md:px-2'>
      <ContentHeader title={'Settings Overview'} />
      {/*<section className='space-y-0 h-[90lvh] overflow-y-scroll'>*/}
      <Card className='grid h-[calc(100svh-12rem)] w-full overflow-y-scroll rounded-md bg-linear-to-br from-slate-600/10 to-slate-800/5 p-1 dark:from-slate-400/10 dark:to-slate-600/5 md:h-full md:w-fit md:grid-cols-2 md:rounded-lg md:gap-12 md:p-4'>
        {SETTINGS_FEATURES.map((feature, index) => (
          <ViewTransition key={feature.id}>
            <button
              type='button'
              onClick={() => {
                void setTab(feature.id)
              }}
              className={cn(
                'relative min-h-16 w-full rounded-xl text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30',
                'hover:bg-foreground/5',
              )}>
              <div
                className={cn(
                  'pointer-events-none absolute inset-0 bg-linear-to-br',
                )}
                aria-hidden
              />
              <div className='relative flex min-w-0 flex-row items-start gap-2 md:gap-4'>
                <div
                  className={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-xl',
                  )}>
                  <span
                    className='font-brk font-light text-xl uppercase tracking-wide text-foreground'
                    aria-hidden>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>
                <div className='relative min-w-0 flex-1 p-2'>
                  <div className='flex min-w-0 items-center font-okxs font-medium text-foreground md:min-w-96'>
                    <Icon
                      name={feature.icon}
                      className='size-5 text-foreground/80'
                      aria-hidden
                    />
                    <span className='min-w-0 wrap-break-word px-2'>
                      {feature.title}
                    </span>
                  </div>
                  <TextureCardDescription className='mt-1 px-0 font-okxs text-xs leading-relaxed text-foreground/60 line-clamp-2'>
                    {feature.description}
                  </TextureCardDescription>
                </div>
              </div>
            </button>
          </ViewTransition>
        ))}
      </Card>
    </div>
  )
}

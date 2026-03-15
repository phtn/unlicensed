'use client'

import {SectionHeader} from '@/components/ui/section-header'
import {
  TextureCardContent,
  TextureCardDescription,
} from '@/components/ui/texture-card'
import {Icon, IconName} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Card} from '@heroui/react'
import {ViewTransition} from 'react'

interface SettingItem {
  id: string
  title: string
  description: string
  icon: IconName
}

const SETTINGS_FEATURES: Array<SettingItem> = [
  {
    id: 'access',
    title: 'Access',
    description: 'Halt Gate Access codes',
    icon: 'finger-press-line',
  },
  {
    id: 'payments',
    title: 'Payments',
    description:
      'Configure payment providers, gateways, and billing. Manage payouts, invoices, and payment methods.',
    icon: 'credit-card',
  },
  {
    id: 'crypto',
    title: 'Crypto',
    description: 'Manage crypto wallets.',
    icon: 'wallet',
  },
  {
    id: 'shipping',
    title: 'Shipping',
    description:
      'Configure shipping fees and minimum purchase amount to cover shipping.',
    icon: 'airplane-takeoff',
  },
  {
    id: 'tax',
    title: 'Tax',
    description: 'Manage Tax configuration.',
    icon: 'money-duotone',
  },
  {
    id: 'rewards',
    title: 'Rewards',
    description: 'Manage Reward Tiers.',
    icon: 'coins',
  },
  {
    id: 'deals',
    title: 'Deals',
    description: 'Configure store deals and mix-and-match bundles.',
    icon: 'tag',
  },
  {
    id: 'rep',
    title: 'Rep',
    description: 'Assign Default Rep account and seed message.',
    icon: 'user-fill',
  },
  {
    id: 'assistant',
    title: 'AI Assistant',
    description: 'Configure AI assistat instructions and context.',
    icon: 'phone',
  },
  {
    id: 'alerts',
    title: 'Alerts',
    description: 'Configure alerts and notifications.',
    icon: 'bell',
  },
] as const

export const OverviewContent = () => {
  return (
    <div className='flex w-full flex-col gap-2 md:gap-4 md:ml-0'>
      <SectionHeader
        title={
          <span className='font-clash'>
            <span>Settings Overview</span>
          </span>
        }
      />

      <section className='space-y-0 h-[90lvh] overflow-y-scroll'>
        <Card
          shadow='none'
          className='p-0 grid md:grid-cols-2 w-full bg-linear-to-br from-slate-600/10 to-slate-800/5 dark:from-slate-400/10 dark:to-slate-600/5 md:p-4 pb-4'>
          {SETTINGS_FEATURES.map((feature, index) => (
            <ViewTransition key={feature.id}>
              <div className={cn('relative min-h-16')}>
                <div
                  className={cn(
                    'pointer-events-none absolute inset-0 bg-linear-to-br',
                  )}
                  aria-hidden
                />
                <div className='relative flex flex-row items-start gap-2 md:gap-4'>
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
                    <div className='font-okxs font-medium text-foreground flex items-center'>
                      <Icon
                        name={feature.icon}
                        className='size-5 text-foreground/80'
                        aria-hidden
                      />
                      <span className='px-2'>{feature.title}</span>
                    </div>
                    <TextureCardDescription className='mt-1 px-0 font-okxs text-xs leading-relaxed text-foreground/60 line-clamp-2'>
                      {feature.description}
                    </TextureCardDescription>
                  </div>
                </div>
                <TextureCardContent className='relative pt-0'></TextureCardContent>
              </div>
            </ViewTransition>
          ))}
        </Card>
      </section>
    </div>
  )
}

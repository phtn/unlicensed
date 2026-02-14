'use client'

import {Callout} from '@/components/ui/callout'
import {SectionHeader} from '@/components/ui/section-header'
import {
  TextureCardContent,
  TextureCardDescription,
} from '@/components/ui/texture-card'
import {Icon, IconName} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Card} from '@heroui/react'
import {ViewTransition} from 'react'

const SETTINGS_FEATURES = [
  {
    id: 'payments',
    title: 'Payments',
    description:
      'Configure payment providers, gateways, and billing. Manage payouts, invoices, and payment methods.',
    icon: 'credit-card' as const,
    accent:
      'from-emerald-600/10 to-emerald-800/5 dark:from-emerald-400/10 dark:to-emerald-600/5',
    border: 'border-emerald-300/60 dark:border-emerald-600/40',
  },
  {
    id: 'shipping',
    title: 'Shipping',
    description:
      'Configure shipping fees and minimum purchase amount to cover shipping.',
    icon: 'airplane-takeoff' as IconName,
    accent:
      'from-slate-600/10 to-slate-800/5 dark:from-slate-400/10 dark:to-slate-600/5',
    border: 'border-slate-300/60 dark:border-slate-600/40',
  },
  {
    id: 'assistant',
    title: 'Assistant',
    description: 'Configure AI assistat instructions and context.',
    icon: 'phone' as IconName,
    accent:
      'from-slate-600/10 to-slate-800/5 dark:from-slate-400/10 dark:to-slate-600/5',
    border: 'border-slate-300/60 dark:border-slate-600/40',
  },
] as const

export const OverviewContent = () => {
  return (
    <div className='flex w-full flex-col gap-4'>
      <SectionHeader
        title={
          <span className='font-polysans space-x-1'>
            <span>Settings Overview</span>
          </span>
        }
      />

      <div className='grid w-full gap-6'>
        <ViewTransition>
          <Callout
            size='sm'
            type='info'
            title='Function'
            description='Settings is the control center for administrative and operational preferences. Use the tabs above to switch between sections.'
            customStyle='rounded-2xl border border-primary/20 bg-primary/5 dark:bg-primary/10'
          />
        </ViewTransition>
        <ViewTransition>
          <Callout
            size='sm'
            type='error'
            title='Warning'
            description='Changes here affect how the admin panel and connected services
                                behave. Review each section before saving.'
            customStyle='rounded-2xl border border-primary/20 bg-primary/5 dark:bg-primary/10'
          />
        </ViewTransition>
      </div>

      <section className='space-y-4'>
        <h2 className='font-polysans text-sm font-medium uppercase tracking-widest text-foreground/70'>
          Sections
        </h2>
        <Card
          shadow='none'
          className='grid w-full bg-linear-to-br from-slate-600/10 to-slate-800/5 dark:from-slate-400/10 dark:to-slate-600/5 p-4'>
          {SETTINGS_FEATURES.map((feature, index) => (
            <ViewTransition key={feature.id}>
              <div
                className={cn(
                  'relative overflow-hidden transition-all duration-300 ease-out',
                )}>
                <div
                  className={cn(
                    'pointer-events-none absolute inset-0 bg-linear-to-br',
                  )}
                  aria-hidden
                />
                <div className='relative flex flex-row items-start gap-4'>
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
                    <TextureCardDescription className='mt-1 font-okxs text-xs leading-relaxed text-foreground/60'>
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

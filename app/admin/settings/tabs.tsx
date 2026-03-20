'use client'

import {useAdminTab} from '@/app/admin/_components/use-admin-tab'
import {cn} from '@/lib/utils'
import {Tabs} from '@base-ui/react/tabs'
import {AccessContent} from './_components/access-content'
import {AlertsContent} from './_components/alerts-content'
import {AssistantContent} from './_components/assistant-content'
import {CouponsContent} from './_components/coupons-content'
import {CryptoContent} from './_components/crypto-content'
import {DealsContent} from './_components/deals-content'
import {OverviewContent} from './_components/overview-content'
import {PaymentsSettings} from './_components/payments-settings'
import {RepContent} from './_components/rep-content'
import {RewardsContent} from './_components/rewards-content'
import {ShippingContent} from './_components/shipping-content'
import {TaxContent} from './_components/tax-content'

const DEFAULT_TAB = 'overview'

export const SettingsTabs = () => {
  const tabs = [
    {id: 'overview', label: 'Overview', panel: <OverviewContent />},
    {id: 'access', label: 'Access', panel: <AccessContent />},
    {id: 'payments', label: 'Payments', panel: <PaymentsSettings />},
    {id: 'coupons', label: 'Coupons', panel: <CouponsContent />},
    {id: 'crypto', label: 'Crypto', panel: <CryptoContent />},
    {id: 'shipping', label: 'Shipping', panel: <ShippingContent />},
    {id: 'tax', label: 'Tax', panel: <TaxContent />},
    {id: 'rewards', label: 'Rewards', panel: <RewardsContent />},
    {id: 'deals', label: 'Deals', panel: <DealsContent />},
    {id: 'rep', label: 'Rep', panel: <RepContent />},
    {id: 'assistant', label: 'Assistant', panel: <AssistantContent />},
    {id: 'alerts', label: 'Alerts', panel: <AlertsContent />},
  ]

  const [tabParam, setTabParam] = useAdminTab(DEFAULT_TAB)
  const activeTab = tabs.some((tab) => tab.id === tabParam)
    ? tabParam
    : DEFAULT_TAB

  return (
    <Tabs.Root
      value={activeTab}
      onValueChange={(nextTab) => {
        void setTabParam(nextTab)
      }}
      className='flex min-w-0 w-full max-w-full flex-col gap-3 sm:gap-0'>
      <div className='w-full overflow-x-auto md:px-3 sm:mx-0 sm:px-0'>
        <Tabs.List className='relative z-0 flex w-max min-w-full flex-nowrap gap-1 overflow-visible px-2 md:gap-2 md:px-0'>
          {tabs.map((tab) => (
            <Tabs.Tab
              key={tab.id}
              className={cn(
                'flex h-9 shrink-0 items-center justify-center rounded-md border-0 px-2 md:px-3 break-keep whitespace-nowrap',
                'text-sm font-medium data-active:text-white font-okxs',
                'outline-none select-none before:inset-x-0 before:inset-y-1 before:rounded-md',
                'transition-colors duration-100 delay-100',
              )}
              value={tab.id}>
              {tab.label}
            </Tabs.Tab>
          ))}
          <Tabs.Indicator className='absolute top-1/2 left-0 z-[-1] h-6 w-(--active-tab-width) translate-x-(--active-tab-left) -translate-y-1/2 rounded-sm bg-linear-to-r from-slate-600/90 via-slate-900/90 to-origin dark:via-slate-600 dark:to-dark-table transition-all duration-300 ease-in-out' />
        </Tabs.List>
      </div>

      {tabs.map((tab) => (
        <Tabs.Panel
          key={tab.id}
          className='relative flex w-full min-w-0 max-w-full flex-1 flex-col overflow-y-auto px-0 sm:px-2 sm:py-4'
          value={tab.id}>
          {tab.panel}
        </Tabs.Panel>
      ))}
    </Tabs.Root>
  )
}

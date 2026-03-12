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

export const SettingsTabs = () => {
  const tabs = [
    {id: 'overview', label: 'Overview'},
    {id: 'access', label: 'Access'},
    {id: 'payments', label: 'Payments'},
    {id: 'coupons', label: 'Coupons'},
    {id: 'crypto', label: 'Crypto'},
    {id: 'shipping', label: 'Shipping'},
    {id: 'tax', label: 'Tax'},
    {id: 'rewards', label: 'Rewards'},
    {id: 'deals', label: 'Deals'},
    {id: 'rep', label: 'Rep'},
    {id: 'assistant', label: 'Assistant'},
    {id: 'alerts', label: 'Alerts'},
  ]
  return (
    <Tabs.Root
      defaultValue='overview'
      className='flex min-w-0 flex-col gap-3 sm:gap-4'>
      <div className='-mx-3 overflow-x-auto px-3 pb-1 sm:mx-0 sm:px-0'>
        <Tabs.List className='relative z-0 flex min-w-max flex-nowrap gap-1 md:gap-2'>
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
      <Tabs.Panel
        className='relative flex min-h-32 min-w-0 flex-1 flex-col px-0 py-2 sm:px-2 sm:py-4'
        value='overview'>
        <OverviewContent />
      </Tabs.Panel>
      <Tabs.Panel
        className='relative flex min-h-32 min-w-0 flex-1 flex-col px-0 py-2 sm:p-4'
        value='access'>
        <AccessContent />
      </Tabs.Panel>
      <Tabs.Panel
        className='relative flex min-h-32 min-w-0 flex-1 flex-col px-0 py-2 sm:p-4'
        value='payments'>
        <PaymentsSettings />
      </Tabs.Panel>
      <Tabs.Panel
        className='relative flex min-h-32 min-w-0 flex-1 flex-col px-0 py-2 sm:p-4'
        value='coupons'>
        <CouponsContent />
      </Tabs.Panel>
      <Tabs.Panel
        className='relative flex min-h-32 min-w-0 flex-1 flex-col px-0 py-2 sm:p-4'
        value='crypto'>
        <CryptoContent />
      </Tabs.Panel>
      <Tabs.Panel
        className='relative flex min-h-32 min-w-0 flex-1 flex-col px-0 py-2 sm:p-4'
        value='shipping'>
        <ShippingContent />
      </Tabs.Panel>
      <Tabs.Panel
        className='relative flex min-h-32 min-w-0 flex-1 flex-col px-0 py-2 sm:p-4'
        value='tax'>
        <TaxContent />
      </Tabs.Panel>
      <Tabs.Panel
        className='relative flex min-h-32 min-w-0 flex-1 flex-col px-0 py-2 sm:p-4'
        value='rewards'>
        <RewardsContent />
      </Tabs.Panel>
      <Tabs.Panel
        className='relative flex min-h-32 min-w-0 flex-1 flex-col px-0 py-2 sm:p-4'
        value='deals'>
        <DealsContent />
      </Tabs.Panel>
      <Tabs.Panel
        className='relative flex min-h-32 min-w-0 flex-1 flex-col px-0 py-2 sm:p-4'
        value='rep'>
        <RepContent />
      </Tabs.Panel>
      <Tabs.Panel
        className='relative flex min-h-32 min-w-0 flex-1 flex-col px-0 py-2 sm:p-4'
        value='assistant'>
        <AssistantContent />
      </Tabs.Panel>
      <Tabs.Panel
        className='relative flex min-h-32 min-w-0 flex-1 flex-col px-0 py-2 sm:p-4'
        value='alerts'>
        <AlertsContent />
      </Tabs.Panel>
    </Tabs.Root>
  )
}

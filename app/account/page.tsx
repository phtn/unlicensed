'use client'

import {useAccount} from '@/hooks/use-account'
import {cn} from '@/lib/utils'
import {Tabs} from '@base-ui/react'
import {parseAsString, useQueryState} from 'nuqs'
import {ReactNode, useMemo} from 'react'
import {AccountSettings} from './_components/account-settings'
import {Overview} from './_components/overview'

type AccountTab = {id: 'ovw' | 'set'; label: string}
const TABS: Array<AccountTab> = [
  {id: 'ovw', label: 'Overview'},
  {id: 'set', label: 'Settings'},
]

export default function AccountPage() {
  const {user, orders, pointsBalance, orderStats} = useAccount()

  const [selectedTab, setSelectedTab] = useQueryState(
    'tab',
    parseAsString.withDefault('ovw'),
  )

  const activeTab = TABS.some((t) => t.id === selectedTab) ? selectedTab : 'ovw'
  const pmap = useMemo(() => {
    return {
      ovw: (
        <Overview
          user={user}
          orders={orders}
          pointsBalance={pointsBalance}
          orderStats={orderStats}
        />
      ),
      set: <AccountSettings user={user} />,
    } as Record<AccountTab['id'], ReactNode>
  }, [user, orders, pointsBalance, orderStats])

  return (
    <div className='min-h-[calc(100lvh-140px)]'>
      <Tabs.Root
        value={activeTab}
        onValueChange={(v) => void setSelectedTab(v)}>
        <div className='flex flex-col gap-3'>
          <div className='-mx-2 overflow-x-auto px-2 pb-1 md:mx-0 md:px-0'>
            <Tabs.List className='relative z-0 flex w-max min-w-full gap-1 rounded-xl border border-default-200/70 bg-default-200/50 p-1 backdrop-blur-sm'>
              {TABS.map((tab) => (
                <Tabs.Tab
                  key={tab.id}
                  value={tab.id}
                  className={cn(
                    'relative z-10 flex h-10 shrink-0 items-center justify-center rounded-lg border-0 px-4 sm:px-5',
                    'whitespace-nowrap break-keep text-xs sm:text-sm font-medium font-okxs tracking-wide text-default-600',
                    'outline-none select-none data-active:text-white',
                    'transition-colors duration-150',
                  )}>
                  {tab.label}
                </Tabs.Tab>
              ))}
              <Tabs.Indicator className='absolute inset-y-1 left-0 z-0 h-auto w-(--active-tab-width) translate-x-(--active-tab-left) rounded-lg bg-linear-to-r from-slate-600/90 via-slate-900/90 to-origin transition-all duration-300 ease-in-out dark:via-dark-table dark:to-dark-table' />
            </Tabs.List>
          </div>

          <div className='min-h-0 min-w-0'>
            {TABS.map((tab) => (
              <Tabs.Panel
                key={tab.id}
                value={tab.id}
                className='relative flex min-h-32 min-w-0 flex-1 flex-col px-0 py-1'>
                {pmap[tab.id]}
              </Tabs.Panel>
            ))}
          </div>
        </div>
      </Tabs.Root>
    </div>
  )
}

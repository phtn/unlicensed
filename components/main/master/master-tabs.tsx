'use client'

import {cn} from '@/lib/utils'
import {Tabs} from '@base-ui/react'
import {MASTER_TABS} from './constants'

export const MasterTabs = () => {
  return (
    <div className='p-0'>
      <div className='overflow-x-auto shadow-inner'>
        <Tabs.List className='relative z-0 flex w-max min-w-full px-1 rounded-none bg-alum/40 dark:bg-background/40 backdrop-blur-sm'>
          {MASTER_TABS.map((tab) => (
            <Tabs.Tab
              key={tab.id}
              value={tab.id}
              className={cn(
                'relative z-10 flex h-8 shrink-0 items-center justify-center rounded-xs border-0 px-3 sm:px-4',
                'whitespace-nowrap text-xs font-medium tracking-wide text-default-600 outline-none select-none data-active:text-white',
                'transition-colors duration-150',
              )}>
              {tab.label}
            </Tabs.Tab>
          ))}
          <Tabs.Indicator className='absolute inset-y-1 left-0 z-0 h-auto w-(--active-tab-width) translate-x-(--active-tab-left) rounded-xs bg-linear-to-r from-slate-600/90 via-slate-900/90 to-origin transition-all duration-300 ease-in-out dark:via-dark-table dark:to-dark-table' />
        </Tabs.List>
      </div>
    </div>
  )
}

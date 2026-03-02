'use client'

import {MainWrapper} from '@/app/admin/_components/main-wrapper'
import {cn} from '@/lib/utils'
import {Tabs} from '@base-ui/react'
import {ImageOptimizer} from './image-optimizer'
import {ProductCsvUpload} from './product-csv-upload'

const tabs = [
  {id: 'image-opt', label: 'Image Optimizer'},
  {id: 'product-csv', label: 'Product CSV Import'},
]

export const Content = () => {
  return (
    <MainWrapper className='md:p-4'>
      <Tabs.Root defaultValue='image-opt'>
        <Tabs.List className='relative z-0 flex gap-1 px-2'>
          {tabs.map((tab) => (
            <Tabs.Tab
              key={tab.id}
              className={cn(
                'flex h-8 items-center justify-center border-0 px-2 break-keep whitespace-nowrap',
                'text-sm font-medium data-active:text-white font-okxs',
                'outline-none select-none before:inset-x-0 before:inset-y-1 before:rounded-sm',
                'transition-colors duration-100 delay-100',
              )}
              value={tab.id}>
              {tab.label}
            </Tabs.Tab>
          ))}
          <Tabs.Indicator className='absolute top-1/2 left-0 z-[-1] h-6 w-(--active-tab-width) translate-x-(--active-tab-left) -translate-y-1/2 rounded-sm bg-linear-to-r from-slate-600/90 via-slate-900/90 to-origin dark:via-dark-table dark:to-dark-table transition-all duration-300 ease-in-out' />
        </Tabs.List>
        <Tabs.Panel
          className='relative flex min-h-32 flex-1 flex-col px-2 py-4'
          value='image-opt'>
          <ImageOptimizer />
        </Tabs.Panel>
        <Tabs.Panel
          className='relative flex min-h-32 flex-1 flex-col px-2 py-4'
          value='product-csv'>
          <ProductCsvUpload />
        </Tabs.Panel>
      </Tabs.Root>
    </MainWrapper>
  )
}

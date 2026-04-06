'use client'

import {MainWrapper} from '@/app/admin/_components/main-wrapper'
import {cn} from '@/lib/utils'
import {Tabs} from '@base-ui/react'
import {parseAsString, useQueryState} from 'nuqs'
import {ReactNode, useCallback, useMemo} from 'react'
import {FireCollectionManager} from './fire-collection-manager'
import {ImageOptimizer} from './image-optimizer'
import {ProductCsvUpload} from './product-csv-upload'
import {ProductDocs} from './product-docs'
import {ProductGalleryManager} from './product-gallery-manager'

interface ToolTabs {
  id: string
  label: string
}

export const Content = () => {
  const tabs = useMemo(
    () =>
      [
        {id: 'img', label: 'Image Optimizer'},
        {id: 'gal', label: 'Product Gallery'},
        {id: 'csv', label: 'Product CSV Import'},
        {id: 'col', label: 'Fire Collection'},
        {id: 'doc', label: 'Docs'},
      ] as Array<ToolTabs>,
    [],
  )
  const [selectedTab, setSelectedTab] = useQueryState(
    'tabId',
    parseAsString.withDefault('img'),
  )
  const tabIds = useMemo(() => new Set(tabs.map((tab) => tab.id)), [tabs])
  const activeTab = tabIds.has(selectedTab) ? selectedTab : 'img'
  const handleTabChange = useCallback(
    (value: string) => {
      void setSelectedTab(value)
    },
    [setSelectedTab],
  )

  const pmap = useMemo(() => {
    return {
      img: <ImageOptimizer />,
      gal: <ProductGalleryManager />,
      csv: <ProductCsvUpload />,
      col: <FireCollectionManager />,
      doc: <ProductDocs />,
    } as Record<ToolTabs['id'], ReactNode>
  }, [])

  return (
    <MainWrapper className='min-w-0 overflow-x-hidden px-2 pt-2 pb-20 md:h-[92lvh] md:overflow-y-scroll md:p-4 md:border-t-0'>
      <Tabs.Root value={activeTab} onValueChange={handleTabChange}>
        <div className='flex min-h-0 flex-col gap-2'>
          <div className='-mx-2 overflow-x-auto px-2 pb-1 md:mx-0 md:px-0'>
            <Tabs.List className='relative z-0 flex w-max min-w-full gap-1 rounded-xl border border-default-200/70 bg-background/80 p-1 backdrop-blur-sm'>
              {tabs.map((tab) => (
                <Tabs.Tab
                  key={tab.id}
                  className={cn(
                    'relative z-10 flex h-10 shrink-0 items-center justify-center rounded-lg border-0 px-3 sm:px-4',
                    'whitespace-nowrap break-keep text-xs sm:text-sm font-medium font-okxs tracking-wide text-default-600',
                    'outline-none select-none data-active:text-white',
                    'transition-colors duration-150',
                  )}
                  value={tab.id}>
                  {tab.label}
                </Tabs.Tab>
              ))}
              <Tabs.Indicator className='absolute inset-y-1 left-0 z-0 h-auto w-(--active-tab-width) translate-x-(--active-tab-left) rounded-lg bg-linear-to-r from-slate-600/90 via-slate-900/90 to-origin transition-all duration-300 ease-in-out dark:via-dark-table dark:to-dark-table' />
            </Tabs.List>
          </div>

          <div className='min-h-0 min-w-0 flex-1'>
            {tabs.map((item) => (
              <Tabs.Panel
                key={item.id}
                className='relative flex min-h-32 min-w-0 flex-1 flex-col px-0 py-2 sm:px-1 md:px-0 md:py-1'
                value={item.id}>
                {pmap[item.id]}
              </Tabs.Panel>
            ))}
          </div>
        </div>
      </Tabs.Root>
    </MainWrapper>
  )
}

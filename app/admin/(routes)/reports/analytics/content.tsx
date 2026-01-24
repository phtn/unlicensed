'use client'

import {MainWrapper} from '@/app/admin/_components/main-wrapper'
import {useAdminTabId} from '@/app/admin/_components/use-admin-tab'
import {useMobile} from '@/hooks/use-mobile'
import {useToggle} from '@/hooks/use-toggle'
import {Suspense} from 'react'
import {VisitorLogData} from './data'
import {InsightsPage} from './insights'

const ReportsContentInner = () => {
  const [tabId] = useAdminTabId()
  const isMobile = useMobile()
  const {on: fullTable, toggle: toggleFullTable} = useToggle()

  switch (tabId) {
    case 'insights':
      return (
        <Suspense fallback={<div>Loading...</div>}>
          <InsightsPage />
        </Suspense>
      )
    case 'logs':
    default:
      return (
        <Suspense fallback={<div>Loading...</div>}>
          <VisitorLogData />
          {/*<LogsTable
            fullTable={fullTable}
            toggleFullTable={toggleFullTable}
            isMobile={isMobile}
          />*/}
        </Suspense>
      )
  }
}

export const Content = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MainWrapper className='border-t-0 px-0'>
        <ReportsContentInner />
      </MainWrapper>
    </Suspense>
  )
}

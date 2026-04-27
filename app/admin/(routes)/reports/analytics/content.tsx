'use client'

import {MainWrapper} from '@/app/admin/_components/main-wrapper'
import {useAdminTabId} from '@/app/admin/_components/use-admin-tab'
import {useMobile} from '@/hooks/use-mobile'
import {useToggle} from '@/hooks/use-toggle'
import {Suspense} from 'react'
import {GeoPage} from './geo'
import {InsightsPage} from './insights'
import {LogsTable} from './logs-table'
import {VisitorData} from './visitors'

const ReportsContentInner = () => {
  const [tabId] = useAdminTabId()
  const _isMobile = useMobile()
  const {on: _fullTable, toggle: _toggleFullTable} = useToggle()

  switch (tabId) {
    case 'geo':
      return (
        <Suspense fallback={<div>Loading...</div>}>
          <GeoPage />
        </Suspense>
      )
    case 'insights':
      return (
        <Suspense fallback={<div>Loading...</div>}>
          <InsightsPage />
        </Suspense>
      )
    case 'logs':
      return (
        <Suspense fallback={<div>Loading...</div>}>
          <LogsTable
            fullTable={_fullTable}
            toggleFullTable={_toggleFullTable}
            isMobile={_isMobile}
          />
        </Suspense>
      )
    case 'visitors':
    default:
      return (
        <Suspense fallback={<div>Loading...</div>}>
          <VisitorData />
        </Suspense>
      )
  }
}

export const Content = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MainWrapper className='md:px-0'>
        <ReportsContentInner />
      </MainWrapper>
    </Suspense>
  )
}

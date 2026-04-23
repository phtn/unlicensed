'use client'

import {ToolbarWrapper} from '../../../components'
import {AnalyticsTabContent} from '../content'
import {GeoTab} from './geo-tab'
import {LogsTab} from './logs-tab'
import {InsightsTab} from './insights-tab'
import {VisitorsTab} from './visitors-tab'

interface ContentProps {
  tabId: string
}

export const Content = ({tabId}: ContentProps) => {
  switch (tabId) {
    case 'geo':
      return (
        <ToolbarWrapper className='flex-wrap items-start gap-2 md:flex-nowrap md:items-center'>
          <GeoTab />
        </ToolbarWrapper>
      )
    case 'logs':
      return (
        <ToolbarWrapper className='flex-wrap items-start gap-2 md:flex-nowrap md:items-center'>
          <LogsTab />
        </ToolbarWrapper>
      )
    case 'visitors':
      return (
        <ToolbarWrapper className='flex-wrap items-start gap-2 md:flex-nowrap md:items-center'>
          <VisitorsTab />
        </ToolbarWrapper>
      )
    case 'insights':
      return (
        <ToolbarWrapper className='flex-wrap items-start gap-2 md:flex-nowrap md:items-center'>
          <InsightsTab />
        </ToolbarWrapper>
      )
    default:
      return <AnalyticsTabContent />
  }
}

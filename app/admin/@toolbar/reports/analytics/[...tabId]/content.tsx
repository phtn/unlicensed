'use client'

import {ToolbarWrapper} from '../../../components'
import {AnalyticsTabContent} from '../content'
import {GeoTab} from './geo-tab'
import {LogsTab} from './logs-tab'
import {InsightsTab} from './insights-tab'

interface ContentProps {
  tabId: string
}

export const Content = ({tabId}: ContentProps) => {
  switch (tabId) {
    case 'geo':
      return (
        <ToolbarWrapper>
          <GeoTab />
        </ToolbarWrapper>
      )
    case 'logs':
      return (
        <ToolbarWrapper>
          <LogsTab />
        </ToolbarWrapper>
      )
    case 'insights':
      return (
        <ToolbarWrapper>
          <InsightsTab />
        </ToolbarWrapper>
      )
    default:
      return <AnalyticsTabContent />
  }
}

'use client'

import {ToolbarWrapper} from '../../components'
import {AnalyticsTabContent} from '../content'
import {LogsTab} from './logs-tab'
import {InsightsTab} from './insights-tab'

interface ContentProps {
  tabId: string
}

export const Content = ({tabId}: ContentProps) => {
  switch (tabId) {
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


'use client'

import {PrimaryTab, ToolbarButtonWrapper} from '../../components'

export const AnalyticsToolbarTabs = () => (
  <ToolbarButtonWrapper className='w-full flex-wrap justify-start gap-0 overflow-visible md:w-auto md:justify-end'>
    <PrimaryTab
      id='visitors'
      href='/admin/reports/analytics?tabId=visitors'
      icon='user-fill'
      label='Visitors'
    />
    <PrimaryTab
      id='insights'
      href='/admin/reports/analytics?tabId=insights'
      icon='strength'
      label='Insights'
    />
    <PrimaryTab
      id='logs'
      href='/admin/reports/analytics?tabId=logs'
      icon='alert-triangle'
      label='Logs'
    />

    <PrimaryTab
      id='geo'
      href='/admin/reports/analytics?tabId=geo'
      icon='globe-light'
      label='Geo'
    />
  </ToolbarButtonWrapper>
)

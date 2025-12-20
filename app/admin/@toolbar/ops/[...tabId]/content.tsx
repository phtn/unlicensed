'use client'

import {ToolbarWrapper} from '../../components'
import {OpsContent} from '../content'
import {StaffTab} from './staff-tab'

interface ContentProps {
  tabId: string
}

export const Content = ({tabId}: ContentProps) => {
  switch (tabId[0]) {
    case 'staff':
      return (
        <ToolbarWrapper>
          <StaffTab />
        </ToolbarWrapper>
      )
    default:
      return <OpsContent />
  }
}

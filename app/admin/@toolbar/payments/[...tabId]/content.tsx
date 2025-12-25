'use client'

import {ToolbarWrapper} from '../../components'
import {PaymentsTab} from './payments-tab'

interface ContentProps {
  tabId: string
}

export const Content = ({tabId}: ContentProps) => {
  console.log(tabId, 'xmas')
  return (
    <ToolbarWrapper>
      <PaymentsTab />
    </ToolbarWrapper>
  )
}

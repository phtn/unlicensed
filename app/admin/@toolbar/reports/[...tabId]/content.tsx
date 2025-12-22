'use client'

import {ToolbarWrapper} from '../../components'
import {SalesTab} from './sales-tab'

interface ContentProps {
  tabId: string
}

export const Content = ({tabId}: ContentProps) => {
  switch (tabId) {
    default:
      return (
        <ToolbarWrapper>
          <SalesTab />
        </ToolbarWrapper>
      )
  }
}

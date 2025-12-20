'use client'

import {ToolbarWrapper} from '../../components'
import {SuppliersContent} from '../content'
import {CourierTab} from './courier-tab'

interface ContentProps {
  tabId: string
}

export const Content = ({tabId}: ContentProps) => {
  switch (tabId[0]) {
    case 'edit':
      return (
        <ToolbarWrapper>
          <CourierTab />
        </ToolbarWrapper>
      )
    default:
      return <SuppliersContent />
  }
}

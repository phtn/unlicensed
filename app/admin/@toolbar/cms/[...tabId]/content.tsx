'use client'

import {ToolbarWrapper} from '../../components'
import {BlogpostTab} from './blogpost-tab'

interface ContentProps {
  tabId: string
}

export const Content = ({tabId}: ContentProps) => {
  switch (tabId[0]) {
    case 'new':
      return (
        <ToolbarWrapper>
          <BlogpostTab />
        </ToolbarWrapper>
      )
    default:
      return (
        <ToolbarWrapper>
          <BlogpostTab />
        </ToolbarWrapper>
      )
  }
}

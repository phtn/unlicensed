'use client'

import {ToolbarWrapper} from '../../components'
import {MessagingContent} from '../content'
import {EmailTab} from './email-tab'

interface ContentProps {
  tabId: string
}

export const Content = ({tabId}: ContentProps) => {
  switch (tabId[0]) {
    case 'edit':
      return (
        <ToolbarWrapper>
          <EmailTab />
        </ToolbarWrapper>
      )
    default:
      return <MessagingContent />
  }
}

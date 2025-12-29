'use client'

import {Id} from '@/convex/_generated/dataModel'
import {EmailTemplateForm} from '../_email'
import {EmailTemplateViewer} from '../_email/components/email-settings-view-page'

interface ContentProps {
  config: string
  tabId: string
}

export const Content = ({config, tabId}: ContentProps) => {
  if (config === 'email') {
    if (tabId === 'new') {
      return <EmailTemplateForm />
    }
    // If tabId is not 'new', treat it as an ID for viewing/editing
    // The EmailSettingsViewPage component will handle invalid IDs gracefully
    return <EmailTemplateViewer id={tabId as Id<'emailSettings'>} />
  }

  return (
    <div>
      Page Loading ... {config} / {tabId}
    </div>
  )
}

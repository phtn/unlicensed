'use client'

import {Id} from '@/convex/_generated/dataModel'
import {EmailTemplateForm} from '../_email'
import {EmailTemplateViewer} from '../_email/components/email-settings-view-page'

interface ContentProps {
  tabId: string
}

export const Content = ({tabId}: ContentProps) => {
  if (tabId === 'new') {
    return <EmailTemplateForm />
  } else if (tabId === 'templates') {
    return <div>Templates</div>
  }

  // If tabId is not 'new', treat it as an ID for viewing/editing
  // The EmailSettingsViewPage component will handle invalid IDs gracefully
  return <EmailTemplateViewer id={tabId as Id<'emailSettings'>} />
}

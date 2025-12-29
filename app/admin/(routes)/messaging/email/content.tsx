'use client'

import {useAdminTabId} from '@/app/admin/_components/use-admin-tab'
import {api} from '@/convex/_generated/api'
import {useQuery} from 'convex/react'
import {Suspense} from 'react'
import {EmailTemplateList} from './_email'
import {EmailTemplateForm} from './_email/components/email-template-form'

const EmailContentInner = () => {
  const templates = useQuery(api.emailSettings.q.listEmailSettings)
  const [tabId, , id] = useAdminTabId()

  switch (tabId) {
    case 'new':
      return <EmailTemplateForm />
    case 'edit':
      if (!id) {
        return (
          <div className=''>
            <EmailTemplateList templates={templates} />
          </div>
        )
      }
      return <EmailTemplateForm />
    default:
      return (
        <div className=''>
          <EmailTemplateList templates={templates} />
        </div>
      )
  }
}

export const EmailContent = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EmailContentInner />
    </Suspense>
  )
}

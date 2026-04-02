'use client'

import {api} from '@/convex/_generated/api'
import {useMutation} from 'convex/react'
import {useRouter} from 'next/navigation'
import {startTransition, useCallback} from 'react'
import {toast} from 'react-hot-toast'
import type {EmailSettingsConvexArgs} from '../email-settings-form-schema'
import {defaultFormValues, withViewTransition} from '../utils'
import {EmailTemplateEditor} from './email-template-editor'

export const EmailTemplateForm = () => {
  const router = useRouter()
  const createEmailSetting = useMutation(api.emailSettings.m.create)

  const navigateBackToList = useCallback(() => {
    withViewTransition(() => {
      startTransition(() => {
        router.push('/admin/messaging/email')
      })
    })
  }, [router])

  const handleSubmitCreate = useCallback(
    async (values: EmailSettingsConvexArgs) => {
      await createEmailSetting(values)
      toast.success('Email setting created')
      navigateBackToList()
    },
    [createEmailSetting, navigateBackToList],
  )

  return (
    <div className='flex min-h-0 flex-1 flex-col'>
      <div className='hidden dark:fixed inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl' />
        <div className='absolute bottom-0 right-1/4 w-96 h-96 bg-brand/10 rounded-full blur-3xl' />
      </div>
      <main className='relative flex min-h-0 flex-1 flex-col'>
        <div className='flex min-h-0 flex-1 overflow-hidden'>
          <EmailTemplateEditor
            initialValues={defaultFormValues}
            submitLabel='Create Template'
            onCancel={navigateBackToList}
            onSubmit={handleSubmitCreate}
          />
        </div>
      </main>
    </div>
  )
}

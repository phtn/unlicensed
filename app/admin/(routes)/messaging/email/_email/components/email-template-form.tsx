'use client'

import {AccessDenied} from '@/app/admin/_components/ui/access-denied'
import {api} from '@/convex/_generated/api'
import {useAuthCtx} from '@/ctx/auth'
import {useMutation, useQuery} from 'convex/react'
import {useRouter} from 'next/navigation'
import {startTransition, useCallback} from 'react'
import {toast} from 'react-hot-toast'
import type {EmailSettingsConvexArgs} from '../email-settings-form-schema'
import {defaultFormValues, withViewTransition} from '../utils'
import {EmailTemplateEditor} from './email-template-editor'

export const EmailTemplateForm = () => {
  const router = useRouter()
  const {user} = useAuthCtx()
  const createEmailSetting = useMutation(api.emailSettings.m.create)

  const u = useQuery(
    api.users.q.getCurrentUser,
    user?.uid ? {fid: user.uid} : 'skip',
  )

  const isAdmin = u !== undefined

  const navigateBackToList = useCallback(() => {
    withViewTransition(() => {
      startTransition(() => {
        router.push('/admin/configs/email')
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

  if (!!isAdmin && !isAdmin) {
    return <AccessDenied />
  }

  return (
    <div className='min-h-screen'>
      <div className='hidden dark:fixed inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl' />
        <div className='absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl' />
      </div>
      <main className='relative'>
        <div className='overflow-hidden'>
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

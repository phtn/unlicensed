'use client'

import {AccessDenied} from '@/app/admin/_components/ui/access-denied'
import {SectionHeader} from '@/app/admin/_components/ui/section-header'
import {api} from '@/convex/_generated/api'
import type {Id} from '@/convex/_generated/dataModel'
import {useAuthCtx} from '@/ctx/auth'
import {onSuccess} from '@/ctx/toast'
import {Icon} from '@/lib/icons'
import {Button, Card, CardHeader} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import {motion} from 'motion/react'
import {useRouter} from 'next/navigation'
import {startTransition, useCallback, useState} from 'react'
import {toast} from 'react-hot-toast'
import type {EmailSettingsConvexArgs} from '../email-settings-form-schema'
import {toFormValues, withViewTransition} from '../utils'
import {EmailTemplateEditor} from './email-template-editor'

export const EmailTemplateViewer = ({id}: {id: Id<'emailSettings'>}) => {
  const router = useRouter()
  const {user} = useAuthCtx()
  const [isEditing, setIsEditing] = useState(false)

  const emailSetting = useQuery(api.emailSettings.q.getEmailSetting, {id})
  const updateEmailSetting = useMutation(api.emailSettings.m.update)
  const deleteEmailSetting = useMutation(api.emailSettings.m.remove)

  const u = useQuery(
    api.users.q.getCurrentUser,
    user?.uid ? {firebaseId: user.uid} : 'skip',
  )

  const isAdmin = u !== undefined

  const navigateBackToList = useCallback(() => {
    withViewTransition(() => {
      startTransition(() => {
        router.push('/admin/configs/email')
      })
    })
  }, [router])

  const handleSubmitEdit = useCallback(
    async (values: EmailSettingsConvexArgs) => {
      await updateEmailSetting({id, ...values})
      toast.success('Email setting updated')
      setIsEditing(false)
    },
    [id, updateEmailSetting],
  )

  const handleDelete = useCallback(async () => {
    if (!confirm('Are you sure you want to delete this email setting?')) return

    startTransition(() => {
      ;(async () => {
        try {
          await deleteEmailSetting({id})
          onSuccess('Email setting deleted')
          navigateBackToList()
        } catch (error) {
          console.error(error)
          toast.error('Failed to delete email setting')
        }
      })()
    })
  }, [id, deleteEmailSetting, navigateBackToList])

  if (!!isAdmin && !isAdmin) {
    return <AccessDenied />
  }

  if (emailSetting === undefined) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <motion.div
          initial={{opacity: 0}}
          animate={{opacity: 1}}
          className='flex items-center gap-3 opacity-50'>
          <Icon name='spinners-ring' className='size-5' />
          Loading email setting...
        </motion.div>
      </div>
    )
  }

  if (emailSetting === null) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <Card className='w-96'>
          <SectionHeader
            title='Email Setting Not Found'
            description='Please contact your administrator.'
          />
        </Card>
      </div>
    )
  }

  if (isEditing) {
    return (
      <div className='min-h-screen'>
        <div className='hidden dark:fixed inset-0 overflow-hidden pointer-events-none'>
          <div className='absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl' />
          <div className='absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl' />
        </div>
        <main className='relative'>
          <div className='overflow-hidden'>
            <EmailTemplateEditor
              initialValues={toFormValues(emailSetting)}
              submitLabel='Update Template'
              onCancel={() => setIsEditing(false)}
              onSubmit={handleSubmitEdit}
            />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className='min-h-screen'>
      <div className='fixed inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl' />
        <div className='absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl' />
      </div>

      <main className='relative px-4 sm:px-6 lg:px-8 py-4 border-t-[0.33px] bg-linear-to-b from-zinc-200/20 dark:from-zinc-300/10 to-5% to-zinc-200/10 dark:to-zinc-300/10 zinc-200'>
        <div className='mb-6 flex items-center justify-between'>
          <Button
            type='button'
            variant='light'
            onPress={navigateBackToList}
            className='gap-2 dark:bg-transparent'>
            <Icon name='chevron-left' />
            <span>Back to Templates</span>
          </Button>
          <div className='flex items-center gap-3 px-1'>
            <Button
              type='button'
              variant='light'
              onPress={() => setIsEditing(true)}
              className='gap-1'>
              Edit
            </Button>
            <Button
              type='button'
              variant='light'
              onPress={handleDelete}
              className='text-mac-red hover:text-mac-red dark:text-red-400 dark:hover:text-red-500'>
              Delete
            </Button>
          </div>
        </div>

        <motion.div
          initial={{opacity: 0, y: 20}}
          animate={{opacity: 1, y: 0}}
          className='space-y-0'>
          <Card className='dark:bg-background bg-greyed/10 backdrop-blur-xl border border-greyed/15 rounded-t-4xl rounded-b-none shadow-none font-figtree'>
            <CardHeader>
              <div className='flex items-center gap-3 mb-0'>
                <SectionHeader
                  title={emailSetting.title || 'Untitled Template'}
                />
                <span className='inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-cyan-100/50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-600/50 dark:border-cyan-500/30'>
                  {emailSetting.intent || 'general'}
                </span>
                <span className='inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-purple-100/50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30 dark:border-purple-500/30'>
                  {emailSetting.type || 'default'}
                </span>
                {emailSetting.visible ? (
                  <span className='inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-emerald-100/50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 dark:border-emerald-500/30'>
                    Active
                  </span>
                ) : (
                  <span className='inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20'>
                    Inactive
                  </span>
                )}
              </div>
              <div className='text-base pt-2 font-figtree'>
                <span className='text-xs uppercase mr-2'>subject:</span>
                <span className='font-semibold'>
                  {emailSetting.subject || 'No subject defined'}
                </span>
              </div>
            </CardHeader>
          </Card>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-0 font-figtree'>
            <Card className='dark:bg-background bg-greyed/10 backdrop-blur-xl border border-t-0 border-greyed/15 rounded-none md:rounded-bl-4xl shadow-none'>
              <SectionHeader title='Recipients' />
              <div className='px-6 pb-6 space-y-3'>
                <div>
                  <p className='text-xs uppercase opacity-50 mb-1'>from</p>
                  <p className='text-sm'>
                    {emailSetting.from?.join(', ') || 'Not set'}
                  </p>
                </div>
                <div>
                  <p className='text-xs uppercase opacity-50 mb-1'>to</p>
                  <p className='text-sm'>
                    {emailSetting.to?.join(', ') || 'Not set'}
                  </p>
                </div>
                {emailSetting.cc && emailSetting.cc.length > 0 && (
                  <div>
                    <p className='text-xs text-zinc-400 mb-1'>CC</p>
                    <p className='text-sm'>{emailSetting.cc.join(', ')}</p>
                  </div>
                )}
                {emailSetting.bcc && emailSetting.bcc.length > 0 && (
                  <div>
                    <p className='text-xs uppercase opacity-50 mb-1'>bcc</p>
                    <p className='text-sm'>{emailSetting.bcc.join(', ')}</p>
                  </div>
                )}
              </div>
            </Card>

            <Card className='dark:bg-background bg-greyed/10 backdrop-blur-xl border border-t-0 md:border-l-0 border-greyed/15 rounded-none rounded-b-4xl md:rounded-bl-none shadow-none'>
              <SectionHeader title='Metadata' />
              <div className='px-6 pb-6 space-y-3'>
                {emailSetting.group && (
                  <div>
                    <p className='text-xs uppercase opacity-50 mb-1'>Group</p>
                    <p className='text-sm'>{emailSetting.group}</p>
                  </div>
                )}
                {emailSetting.intent && (
                  <div>
                    <p className='text-xs uppercase opacity-50 mb-1'>Intent</p>
                    <p className='text-sm'>{emailSetting.intent}</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {emailSetting.text && (
            <Card className='dark:bg-background bg-greyed backdrop-blur-sm border border-zinc-800/50'>
              <SectionHeader title='Plain Text' />
              <div className='px-6 pb-6'>
                <pre className='text-sm whitespace-pre-wrap font-mono bg-zinc-900/50 p-4 rounded-lg'>
                  {emailSetting.text}
                </pre>
              </div>
            </Card>
          )}

          {emailSetting.body && (
            <Card className='dark:bg-background bg-greyed backdrop-blur-sm border border-zinc-800/50'>
              <SectionHeader title='Body Template' />
              <div className='px-6 pb-6'>
                <pre className='text-sm whitespace-pre-wrap font-mono bg-zinc-900/50 p-4 rounded-lg'>
                  {emailSetting.body}
                </pre>
              </div>
            </Card>
          )}

          {emailSetting.html && (
            <Card className='dark:bg-background bg-greyed backdrop-blur-sm border border-zinc-800/50'>
              <SectionHeader title='HTML Template' />
              <div className='px-6 pb-6'>
                <pre className='text-sm whitespace-pre-wrap font-mono bg-zinc-900/50 p-4 rounded-lg overflow-x-auto'>
                  {emailSetting.html}
                </pre>
              </div>
            </Card>
          )}
        </motion.div>
      </main>
    </div>
  )
}

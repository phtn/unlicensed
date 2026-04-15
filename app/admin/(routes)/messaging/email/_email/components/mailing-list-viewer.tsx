'use client'

import {StatCard} from '@/app/admin/_components/stat-card'
import {SectionHeader} from '@/app/admin/_components/ui/section-header'
import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {Icon} from '@/lib/icons'
import {formatTimestamp} from '@/utils/date'
import {Button, Card, CardContent, CardHeader} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import {motion} from 'motion/react'
import {useRouter} from 'next/navigation'
import {startTransition, useCallback, useState} from 'react'
import {toast} from 'react-hot-toast'
import {withViewTransition} from '../utils'
import {
  MailingListEditor,
  type MailingListRecipientRow,
} from './mailing-list-editor'
import {MailingListTable} from './mailing-list-table'

export const MailingListViewer = ({id}: {id: string}) => {
  const router = useRouter()
  const updateMailingList = useMutation(api.mailingLists.m.update)
  const mailingList = useQuery(api.mailingLists.q.get, {
    id: id as Id<'mailingLists'>,
  })
  const [isEditing, setIsEditing] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const navigateBack = useCallback(() => {
    withViewTransition(() => {
      startTransition(() => {
        router.push('/admin/messaging/email?tabId=mailing-list')
      })
    })
  }, [router])

  const handleUpdateMailingList = useCallback(
    async ({
      name,
      recipients,
    }: {
      name: string
      recipients: MailingListRecipientRow[]
    }) => {
      setIsUpdating(true)

      try {
        await updateMailingList({
          id: id as Id<'mailingLists'>,
          name: name || 'Untitled',
          recipients,
        })
        toast.success('Mailing list updated')
        setIsEditing(false)
      } catch (error) {
        console.error(error)
        toast.error(
          error instanceof Error
            ? error.message
            : 'Failed to update mailing list',
        )
      } finally {
        setIsUpdating(false)
      }
    },
    [id, updateMailingList],
  )

  if (mailingList === undefined) {
    return (
      <div className='flex min-h-[60vh] items-center justify-center'>
        <motion.div
          initial={{opacity: 0}}
          animate={{opacity: 1}}
          className='flex items-center gap-3 text-foreground/55'>
          <Icon name='spinners-ring' className='size-5' />
          Loading mailing list...
        </motion.div>
      </div>
    )
  }

  if (mailingList === null) {
    return (
      <div className='min-h-screen px-4 py-6 sm:px-6 lg:px-8'>
        <Card className='mx-auto max-w-xl border border-greyed/15 bg-sidebar/70 shadow-none backdrop-blur-xl'>
          <CardContent className='gap-4 p-8 text-center'>
            <div className='mx-auto flex size-14 items-center justify-center rounded-3xl border border-danger-soft bg-danger/10 text-danger'>
              <Icon name='mail-send-fill' className='size-6' />
            </div>
            <SectionHeader
              title='Mailing List Not Found'
              description='The selected list could not be loaded. It may have been removed or the link is no longer valid.'
              className='items-center text-center'
            />
            <Button
              type='button'
              variant='tertiary'
              onPress={navigateBack}
              className='rounded-xl border border-greyed/15 bg-background/45'>
              Back to Mailing Lists
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const namedRecipients = mailingList.recipients.filter((recipient) =>
    recipient.name.trim(),
  ).length

  return (
    <div className='min-h-screen overflow-y-auto'>
      <div className='fixed inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute top-0 left-1/4 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl' />
        <div className='absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-brand/10 blur-3xl' />
      </div>

      <main className='relative px-4 py-4 sm:px-6 lg:px-8'>
        <div className='flex items-center justify-between gap-4'>
          <Button
            type='button'
            variant='ghost'
            onPress={navigateBack}
            className='gap-2 dark:bg-transparent'>
            <Icon name='chevron-left' className='size-4' />
            <span>Back to Mailing Lists</span>
          </Button>
        </div>

        <Card className='bg-sidebar/80 mt-2 rounded-t-md rounded-b-none shadow-none backdrop-blur-lg border-x border-t border-light-gray dark:border-dark-table'>
          <CardHeader className='flex flex-col items-start gap-4 px-2 lg:flex-row lg:items-end lg:justify-between'>
            <div className='space-y-2'>
              <div className='flex flex-wrap items-center gap-4'>
                <h1 className='font-clash text-2xl font-semibold'>
                  {mailingList.name || 'Untitled mailing list'}
                </h1>
                <span className='rounded-full border border-cyan-500/20 bg-cyan-500/8 px-2 py-1 text-xs font-clash font-medium  text-cyan-600 dark:text-cyan-400 tracking-wider'>
                  {mailingList.recipients.length} recipients
                </span>
              </div>
              <p className='text-sm font-ios font-normal text-foreground/50'>
                Created {formatTimestamp(mailingList.createdAt)}
              </p>
            </div>
            <div className='grid w-full gap-3 sm:grid-cols-3 lg:w-auto lg:min-w-105'>
              <StatCard title='Total' value={mailingList.recipients.length} />
              <StatCard title='Named' value={namedRecipients} />
              <StatCard
                title='Email Only'
                value={mailingList.recipients.length - namedRecipients}
              />
            </div>
          </CardHeader>
        </Card>

        <Card className='bg-sidebar/70 rounded-b-md rounded-t-none shadow-none backdrop-blur-xl border border-light-gray dark:border-dark-table'>
          <CardContent className='gap-4 p-3'>
            <SectionHeader title='Recipients'>
              <div className='flex items-center space-x-2'>
                <Button
                  size='sm'
                  variant={isEditing ? 'secondary' : 'primary'}
                  onPress={() => setIsEditing((current) => !current)}
                  className='flex items-center gap-2 rounded-md bg-dark-table text-sm text-white dark:bg-white dark:text-dark-table'>
                  <span>{isEditing ? 'Close Editor' : 'Edit List'}</span>
                  <Icon name={isEditing ? 'x' : 'cf-pen'} className='size-4' />
                </Button>
                <Button size='sm' variant='tertiary' isIconOnly>
                  <Icon name='more-v' className='size-4' />
                </Button>
              </div>
            </SectionHeader>
            <div className='space-y-3 overflow-y-auto'>
              {isEditing ? (
                <MailingListEditor
                  key={mailingList._id}
                  title='Edit Mailing List'
                  description='Update the list name, paste additional recipients, import CSV rows, or clean up existing entries before saving.'
                  submitLabel='Save Changes'
                  initialName={mailingList.name}
                  initialRecipients={mailingList.recipients}
                  isSubmitting={isUpdating}
                  onCancel={() => setIsEditing(false)}
                  onSubmit={handleUpdateMailingList}
                />
              ) : (
                <MailingListTable recipients={mailingList.recipients} />
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

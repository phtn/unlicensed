'use client'

import {SectionHeader} from '@/app/admin/_components/ui/section-header'
import {api} from '@/convex/_generated/api'
import {type Doc} from '@/convex/_generated/dataModel'
import {Icon} from '@/lib/icons'
import {formatTimestamp} from '@/utils/date'
import {Button, Card, CardBody} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import {motion} from 'motion/react'
import Link from 'next/link'
import {useCallback, useState} from 'react'
import {toast} from 'react-hot-toast'
import {MailingListEditor, type MailingListRecipientRow} from './mailing-list-editor'
import {MailingListTable} from './mailing-list-table'

type MailingListDoc = Doc<'mailingLists'>

const PREVIEW_RECIPIENT_COUNT = 3

const MailingListCard = ({
  index,
  list,
}: {
  index: number
  list: MailingListDoc
}) => {
  const previewRecipients = list.recipients.slice(0, PREVIEW_RECIPIENT_COUNT)
  const namedRecipients = list.recipients.filter((recipient) =>
    recipient.name.trim(),
  ).length

  return (
    <Link href={`/admin/messaging/email/mailing-list/${list._id}`} prefetch>
      <motion.article
        initial={{opacity: 0, y: 20}}
        animate={{opacity: 1, y: 0}}
        transition={{delay: index * 0.04}}
        className='group relative h-full cursor-pointer overflow-hidden rounded-3xl border border-greyed/15 bg-sidebar/70 p-5 backdrop-blur-xl transition-all duration-300 hover:border-cyan-500/20 hover:bg-sidebar'>
        <div className='pointer-events-none absolute inset-0 bg-linear-to-br from-cyan-500/8 via-transparent to-brand/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100' />
        <div className='relative flex h-full flex-col gap-5'>
          <div className='flex items-start justify-between gap-4'>
            <div className='flex items-start gap-2'>
              <div className='flex size-8 shrink-0 items-center justify-center text-cyan-500'>
                <Icon name='mail-send-fill' className='size-4' />
              </div>
              <div className='min-w-0 space-y-2'>
                <div className='flex flex-wrap items-center gap-2'>
                  <h3 className='truncate font-clash text-lg font-semibold'>
                    {list.name || 'Untitled mailing list'}
                  </h3>
                  <span className='px-2 py-1 text-[10px]  text-cyan-600 dark:text-cyan-400 tracking-wider'>
                    <strong>{list.recipients.length}</strong> recipients
                  </span>
                </div>
                <p className='font-ios text-xs text-foreground/55'>
                  Created {formatTimestamp(list.createdAt)}
                </p>
              </div>
            </div>
            <Icon
              name='chevron-right'
              className='size-5 shrink-0 text-foreground/40 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-foreground'
            />
          </div>

          <div className='grid gap-3 sm:grid-cols-2'>
            <div className='rounded-2xl bg-background/40 px-4 py-3'>
              <p className='text-xs font-ios uppercase tracking-[0.22em] text-foreground/45'>
                Saved Contacts
              </p>
              <p className='mt-2 font-okxs text-xl font-semibold'>
                {list.recipients.length}
              </p>
            </div>
            <div className='rounded-2xl bg-background/40 px-4 py-3'>
              <p className='text-xs font-ios uppercase tracking-[0.22em] text-foreground/45'>
                Named Contacts
              </p>
              <p className='mt-2 font-okxs text-xl font-semibold'>
                {namedRecipients}
              </p>
            </div>
          </div>

          <div className='space-y-2 rounded-xl bg-background/30 p-3'>
            <div className='flex items-center justify-between'>
              <p className='text-xs font-ios uppercase tracking-[0.22em] text-foreground/45'>
                Preview
              </p>
            </div>
            <div className='space-y-2'>
              <MailingListTable
                recipients={previewRecipients}
                className='max-w-2xl'
              />
            </div>
          </div>

          <div className='mt-auto flex items-center justify-between text-sm text-foreground/55'>
            <span>Open list</span>
            <span className='font-medium text-cyan-600 dark:text-cyan-400'>
              View details
            </span>
          </div>
        </div>
      </motion.article>
    </Link>
  )
}

export const MailingListContent = () => {
  const createMailingList = useMutation(api.mailingLists.m.create)
  const mailingLists = useQuery(api.mailingLists.q.list)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateMailingList = useCallback(
    async ({
      name,
      recipients,
    }: {
      name: string
      recipients: MailingListRecipientRow[]
    }) => {
      setIsCreating(true)

      try {
        await createMailingList({
          name: name || 'Untitled',
          recipients,
        })
        toast.success(
          `Mailing list "${name || 'Untitled'}" saved with ${recipients.length} recipients`,
        )
        setShowCreateForm(false)
      } catch (error) {
        console.error(error)
        toast.error(
          error instanceof Error ? error.message : 'Failed to create mailing list',
        )
      } finally {
        setIsCreating(false)
      }
    },
    [createMailingList],
  )

  if (mailingLists === undefined) {
    return (
      <div className='flex min-h-[60vh] items-center justify-center'>
        <motion.div
          initial={{opacity: 0}}
          animate={{opacity: 1}}
          className='flex items-center gap-3 text-foreground/55'>
          <Icon name='spinners-ring' className='size-5' />
          Loading mailing lists...
        </motion.div>
      </div>
    )
  }

  const totalRecipients = mailingLists.reduce(
    (count, list) => count + list.recipients.length,
    0,
  )

  return (
    <div className='h-screen overflow-scroll pb-32'>
      <div className='fixed inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute top-0 left-1/4 h-96 w-96 rounded-full bg-cyan-300/10 blur-3xl' />
        <div className='absolute bottom-0 right-1/4 h-120 w-120 rounded-full bg-brand/5 blur-3xl' />
      </div>

      <main className='relative space-y-4 px-2 sm:px-3 lg:px-4'>
        <section className='grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]'>
          <Card className='border border-greyed/15 bg-sidebar/70 shadow-none backdrop-blur-xl'>
            <CardBody className='gap-3 p-6'>
              <div className='flex space-x-4'>
                <Button
                  as={Link}
                  size='lg'
                  isIconOnly
                  href='/admin/messaging/email'
                  variant='flat'
                  radius='none'
                  className='rounded-lg'>
                  <Icon name='chevron-left' className='size-4' />
                </Button>

                <div className='space-y-2'>
                  <SectionHeader
                    title='Mailing Lists'
                    description='Browse saved recipient groups, scan a few contacts, and open any list for the full roster.'
                  />
                  <div className='flex flex-wrap gap-3 font-ios font-normal text-sm text-foreground/50'>
                    <span className='rounded-full border border-greyed/15 bg-background/40 px-3 py-1.5'>
                      {mailingLists.length} lists
                      {mailingLists.length === 1 ? '' : 's'}
                    </span>
                    <span className='rounded-full border border-greyed/15 bg-background/40 px-3 py-1.5'>
                      {totalRecipients} total recipient
                      {totalRecipients === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className='border border-greyed/15 bg-sidebar/70 shadow-none backdrop-blur-xl'>
            <CardBody className='justify-between gap-4 p-6'>
              <div className='space-y-2'>
                <p className='text-xs font-ios uppercase tracking-[0.24em] text-foreground/45'>
                  Create
                </p>
                <p className='font-clash'>
                  Build a list here or start one from a template view.
                </p>
              </div>
              <Button
                size='lg'
                onPress={() => setShowCreateForm((current) => !current)}
                variant={showCreateForm ? 'flat' : 'solid'}
                className='bg-brand font-clash text-white data-[hover=true]:bg-brand/90'>
                <span>{showCreateForm ? 'Close Creator' : 'Create Mailing List'}</span>
              </Button>
            </CardBody>
          </Card>
        </section>

        {showCreateForm ? (
          <MailingListEditor
            title='Create Mailing List'
            description='Paste names and emails below. Use name=email, name:email, or name,email, or import a CSV with email and name columns.'
            submitLabel='Create Mailing List'
            isSubmitting={isCreating}
            onCancel={() => setShowCreateForm(false)}
            onSubmit={handleCreateMailingList}
          />
        ) : null}

        {mailingLists.length === 0 ? (
          <Card className='border border-greyed/15 bg-sidebar/70 shadow-none backdrop-blur-xl'>
            <CardBody className='flex min-h-72 items-center justify-center p-8'>
              <div className='max-w-xl space-y-4 text-center'>
                <div className='mx-auto flex size-16 items-center justify-center rounded-3xl border border-cyan-500/15 bg-cyan-500/10 text-cyan-500'>
                  <Icon name='mail-send-fill' className='size-7' />
                </div>
                <SectionHeader
                  title='No Mailing Lists Yet'
                  description='Create one here, or save a recipient group from an email template viewer and it will appear in this gallery.'
                  className='items-center text-center'
                />
                <div className='flex justify-center gap-3'>
                  <Button
                    onPress={() => setShowCreateForm(true)}
                    color='primary'
                    radius='none'
                    className='rounded-xl bg-dark-gray dark:bg-white dark:text-dark-table'>
                    Create Mailing List
                  </Button>
                  <Button
                    as={Link}
                    href='/admin/messaging/email'
                    variant='light'
                    radius='none'
                    className='rounded-xl border border-greyed/15 bg-background/45'>
                    Open Email Templates
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        ) : null}

        {mailingLists.length > 0 ? (
          <section
            className='grid gap-4 md:grid-cols-2 2xl:grid-cols-3'
            style={{contentVisibility: 'auto'}}>
            {mailingLists.map((list, index) => (
              <MailingListCard key={list._id} index={index} list={list} />
            ))}
          </section>
        ) : null}
      </main>
    </div>
  )
}

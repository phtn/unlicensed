'use client'

import {StatCard} from '@/app/admin/_components/stat-card'
import {SectionHeader} from '@/app/admin/_components/ui/section-header'
import {api} from '@/convex/_generated/api'
import {type Doc} from '@/convex/_generated/dataModel'
import {Icon} from '@/lib/icons'
import {formatTimestamp} from '@/utils/date'
import {
  Button,
  Card,
  CardContent,
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalContainer,
  ModalDialog,
  ModalFooter,
  ModalHeader,
} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import {motion} from 'motion/react'
import Link from 'next/link'
import {useRouter} from 'next/navigation'
import {type ReactNode, useCallback, useState} from 'react'
import {toast} from 'react-hot-toast'
import {
  MailingListEditor,
  type MailingListRecipientRow,
} from './mailing-list-editor'
import {MailingListTable} from './mailing-list-table'

type MailingListDoc = Doc<'mailingLists'>

const PREVIEW_RECIPIENT_COUNT = 3

const ModalContent = ({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) => (
  <ModalBackdrop className='bg-black/55 backdrop-opacity-70'>
    <ModalContainer size='md' placement='center'>
      <ModalDialog className={className}>{children}</ModalDialog>
    </ModalContainer>
  </ModalBackdrop>
)

const MailingListCard = ({
  index,
  list,
  isDeleteDisabled,
  onDeleteRequest,
}: {
  index: number
  list: MailingListDoc
  isDeleteDisabled: boolean
  onDeleteRequest: (list: MailingListDoc) => void
}) => {
  const previewRecipients = list.recipients.slice(0, PREVIEW_RECIPIENT_COUNT)
  const namedRecipients = list.recipients.filter((recipient) =>
    recipient.name.trim(),
  ).length

  return (
    <motion.article
      initial={{opacity: 0, y: 20}}
      animate={{opacity: 1, y: 0}}
      transition={{delay: index * 0.04}}
      className='group relative h-full overflow-hidden rounded-md border border-light-gray bg-sidebar/70 p-5 backdrop-blur-xl transition-all duration-300 hover:border-dark-table/20 hover:bg-sidebar dark:border-dark-table'
    >
      <div className='pointer-events-none absolute inset-0 bg-linear-to-br from-cyan-500/8 via-transparent to-brand/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100' />
      <div className='relative flex h-full flex-col gap-5'>
        <div className='flex items-start justify-between gap-4'>
          <div className='flex min-w-0 items-start gap-2'>
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
        </div>

        <div className='grid gap-2 sm:grid-cols-2'>
          <StatCard title='Saved Contacts' value={list.recipients.length} />
          <StatCard title='Named Contacts' value={namedRecipients} />
        </div>

        <div className='space-y-2 rounded-xl bg-background dark:bg-background/40 p-3'>
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

        <div className='mt-auto flex flex-col gap-3 text-sm text-foreground/55 sm:flex-row sm:items-center sm:justify-between'>
          <Button
            type='button'
            size='sm'
            variant='tertiary'
            isDisabled={isDeleteDisabled}
            aria-label={`Delete ${list.name || 'untitled mailing list'}`}
            onPress={() => onDeleteRequest(list)}
            className='min-w-0 rounded-md border border-rose-500/15 bg-background/65 px-3 text-rose-600 transition-colors data-[hover=true]:bg-rose-500/12 data-[hover=true]:text-rose-700 dark:text-rose-300 dark:data-[hover=true]:text-rose-200'
          >
            <Icon name='trash-fill' className='size-4' />
            <span>Delete</span>
          </Button>
          <Link
            href={`/admin/messaging/email/mailing-list/${list._id}`}
            prefetch
            className='flex items-center gap-2 font-medium text-cyan-600 transition-transform duration-300 group-hover:translate-x-1 dark:text-cyan-400'
          >
            <span>Open list</span>
            <Icon name='chevron-right' className='size-4' />
          </Link>
        </div>
      </div>
    </motion.article>
  )
}

export const MailingListContent = () => {
  const router = useRouter()
  const createMailingList = useMutation(api.mailingLists.m.create)
  const deleteMailingList = useMutation(api.mailingLists.m.remove)
  const mailingLists = useQuery(api.mailingLists.q.list)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [pendingDeleteList, setPendingDeleteList] =
    useState<MailingListDoc | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

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
          error instanceof Error
            ? error.message
            : 'Failed to create mailing list',
        )
      } finally {
        setIsCreating(false)
      }
    },
    [createMailingList],
  )

  const handleDeleteRequest = useCallback((list: MailingListDoc) => {
    setPendingDeleteList(list)
  }, [])

  const handleDeleteMailingList = useCallback(async () => {
    if (!pendingDeleteList) {
      return
    }

    setIsDeleting(true)

    try {
      await deleteMailingList({id: pendingDeleteList._id})
      toast.success(`Deleted "${pendingDeleteList.name || 'Untitled'}"`)
      setPendingDeleteList(null)
    } catch (error) {
      console.error(error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to delete mailing list',
      )
    } finally {
      setIsDeleting(false)
    }
  }, [deleteMailingList, pendingDeleteList])

  if (mailingLists === undefined) {
    return (
      <div className='flex min-h-[60vh] items-center justify-center'>
        <motion.div
          initial={{opacity: 0}}
          animate={{opacity: 1}}
          className='flex items-center gap-3 text-foreground/55'
        >
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

      <main className='relative space-y-4 px-2 lg:px-0'>
        <section className='grid gap-4 lg:grid-cols-[minmax(0,1fr)_480px]'>
          <Card className='border border-greyed/15 rounded-md bg-sidebar/70 shadow-none backdrop-blur-xl'>
            <CardContent className='gap-3 p-6'>
              <div className='flex flex-col gap-4 sm:flex-row'>
                <Button
                  size='lg'
                  isIconOnly
                  variant='tertiary'
                  onPress={() => {
                    router.push('/admin/messaging/email')
                  }}
                  className='rounded-lg'
                >
                  <Icon name='chevron-left' className='size-4' />
                </Button>

                <div className='min-w-0 space-y-2'>
                  <SectionHeader
                    title='Mailing Lists'
                    description='Browse saved recipient groups, scan a few contacts, and open any list for the full roster.'
                  />
                  <div className='flex flex-wrap gap-3 font-ios font-normal text-sm text-foreground/50'>
                    <span className='rounded-md border border-greyed/15 bg-background/40 px-3 py-1.5'>
                      {mailingLists.length} lists
                      {mailingLists.length === 1 ? '' : 's'}
                    </span>
                    <span className='rounded-md border border-greyed/15 bg-background/40 px-3 py-1.5'>
                      {totalRecipients} total recipient
                      {totalRecipients === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='border border-greyed/15 bg-sidebar/70 shadow-none backdrop-blur-xl rounded-md'>
            <CardContent className='justify-between gap-4 p-6'>
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
                variant={showCreateForm ? 'secondary' : 'primary'}
                className='bg-brand font-clash text-white data-[hover=true]:bg-brand/90 rounded-md'
              >
                <span>
                  {showCreateForm ? 'Close Creator' : 'Create Mailing List'}
                </span>
              </Button>
            </CardContent>
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
            <CardContent className='flex min-h-72 items-center justify-center p-8'>
              <div className='max-w-xl space-y-4 text-center'>
                <div className='mx-auto flex size-16 items-center justify-center rounded-md border border-cyan-500/15 bg-cyan-500/10 text-cyan-500'>
                  <Icon name='mail-send-fill' className='size-7' />
                </div>
                <SectionHeader
                  title='No Mailing Lists Yet'
                  description='Create one here, or save a recipient group from an email template viewer and it will appear in this gallery.'
                  className='items-center text-center'
                />
                <div className='flex flex-col justify-center gap-3 sm:flex-row'>
                  <Button
                    onPress={() => setShowCreateForm(true)}
                    variant='primary'
                    className='rounded-xl bg-dark-gray dark:bg-white dark:text-dark-table'
                  >
                    Create Mailing List
                  </Button>
                  <Button
                    variant='tertiary'
                    onPress={() => {
                      router.push('/admin/messaging/email')
                    }}
                    className='rounded-xl border border-greyed/15 bg-background/45'
                  >
                    Open Email Templates
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {mailingLists.length > 0 ? (
          <section
            className='grid gap-4 md:grid-cols-2 2xl:grid-cols-3'
            style={{contentVisibility: 'auto'}}
          >
            {mailingLists.map((list, index) => (
              <MailingListCard
                key={list._id}
                index={index}
                list={list}
                isDeleteDisabled={isDeleting}
                onDeleteRequest={handleDeleteRequest}
              />
            ))}
          </section>
        ) : null}

        <Modal
          isOpen={pendingDeleteList !== null}
          onOpenChange={(open) => {
            if (!open && !isDeleting) {
              setPendingDeleteList(null)
            }
          }}
        >
          <ModalContent className='border border-border/60 bg-background/95 shadow-2xl rounded-lg'>
            <ModalHeader className='flex flex-col gap-1 pb-2'>
              <span className='font-clash font-medium text-lg tracking-wider uppercase'>
                Delete mailing list
              </span>
              <p className='text-sm font-normal text-muted-foreground'>
                This removes the saved mailing list and its recipient roster.
              </p>
            </ModalHeader>
            <ModalBody className='gap-4 pb-2'>
              <div className='rounded-lg border border-rose-500/20 bg-rose-500/8 px-4 py-3'>
                <div className='flex items-start gap-3'>
                  <div className='mt-0.5 rounded-full bg-rose-100/15 p-2 text-foreground dark:text-rose-500'>
                    <Icon name='trash-fill' className='size-4' />
                  </div>
                  <div className='min-w-0'>
                    <div className='text-base font-semibold text-foreground'>
                      {pendingDeleteList?.name || 'Untitled mailing list'}
                    </div>
                    <p className='mt-1 text-xs leading-5 text-muted-foreground'>
                      {pendingDeleteList?.recipients.length ?? 0} recipient
                      {(pendingDeleteList?.recipients.length ?? 0) === 1
                        ? ''
                        : 's'}{' '}
                      will no longer be available from this saved list.
                    </p>
                  </div>
                </div>
              </div>

              <div className='flex items-center space-x-1 text-foreground/80'>
                <Icon name='alert-triangle' className='size-3.5 text-red-500' />
                <p className='text-sm leading-5 my-3'>
                  This action cannot be undone from the mailing list gallery.
                </p>
              </div>
            </ModalBody>
            <ModalFooter className='gap-2'>
              <button
                type='button'
                onClick={() => setPendingDeleteList(null)}
                disabled={isDeleting}
                className='rounded-md bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50'
              >
                Cancel
              </button>
              <button
                type='button'
                onClick={handleDeleteMailingList}
                disabled={isDeleting || pendingDeleteList === null}
                className='rounded-md border border-rose-500/10 bg-rose-500 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-rose-500/90 disabled:cursor-not-allowed disabled:opacity-50'
              >
                {isDeleting ? 'Deleting...' : 'Delete mailing list'}
              </button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </main>
    </div>
  )
}

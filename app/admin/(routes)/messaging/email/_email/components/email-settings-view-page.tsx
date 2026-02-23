'use client'

import {AccessDenied} from '@/app/admin/_components/ui/access-denied'
import {SectionHeader} from '@/app/admin/_components/ui/section-header'
import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {useAuthCtx} from '@/ctx/auth'
import {onSuccess} from '@/ctx/toast'
import {Icon} from '@/lib/icons'
import {EMAIL_TEMPLATE_OPTIONS} from '@/lib/resend/templates/registry'
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Textarea,
  useDisclosure,
} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import {motion} from 'motion/react'
import {useRouter} from 'next/navigation'
import {startTransition, useCallback, useState} from 'react'
import {toast} from 'react-hot-toast'
import type {EmailSettingsConvexArgs} from '../email-settings-form-schema'
import {toFormValues, withViewTransition} from '../utils'
import {EmailTemplateEditor} from './email-template-editor'

interface EmailTemplateViewerProps {
  id: string
}
function parseRecipients(value: string): string[] {
  return value
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

export type RecipientRow = { name: string; email: string }

/** Parse pasted text into name/email rows. Separators: =, :, or , (one per line). */
function parsePastedRecipients(text: string): RecipientRow[] {
  const lines = text.split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
  return lines.map((line) => {
    const sepMatch = line.match(/[=,:]/)
    const idx = sepMatch ? line.indexOf(sepMatch[0]!) : -1
    if (idx === -1) {
      if (line.includes('@')) return { name: '', email: line }
      return { name: line, email: '' }
    }
    const left = line.slice(0, idx).trim()
    const right = line.slice(idx + 1).trim()
    const hasAtLeft = left.includes('@')
    const hasAtRight = right.includes('@')
    if (hasAtRight && !hasAtLeft) return { name: left, email: right }
    if (hasAtLeft && !hasAtRight) return { name: right, email: left }
    return { name: left, email: right }
  })
}

export const EmailTemplateViewer = ({id}: EmailTemplateViewerProps) => {
  const router = useRouter()
  const {user} = useAuthCtx()
  const [isEditing, setIsEditing] = useState(false)
  const sendJobDisclosure = useDisclosure()
  const [recipients, setRecipients] = useState<RecipientRow[]>([
    { name: '', email: '' },
  ])
  const [sendCc, setSendCc] = useState('')
  const [sendBcc, setSendBcc] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  const emailSetting = useQuery(
    api.emailSettings.q.getEmailSetting,
    id ? {id: id as Id<'emailSettings'>} : 'skip',
  )
  const updateEmailSetting = useMutation(api.emailSettings.m.update)
  const deleteEmailSetting = useMutation(api.emailSettings.m.remove)

  const u = useQuery(
    api.users.q.getCurrentUser,
    user?.uid ? {fid: user.uid} : 'skip',
  )

  const isAdmin = u !== undefined

  const navigateBackToList = useCallback(() => {
    withViewTransition(() => {
      startTransition(() => {
        router.push('/admin/messaging/email')
      })
    })
  }, [router])

  const handleSubmitEdit = useCallback(
    async (values: EmailSettingsConvexArgs) => {
      await updateEmailSetting({id: id as Id<'emailSettings'>, ...values})
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
          await deleteEmailSetting({id: id as Id<'emailSettings'>})
          onSuccess('Email setting deleted')
          navigateBackToList()
        } catch (error) {
          console.error(error)
          toast.error('Failed to delete email setting')
        }
      })()
    })
  }, [id, deleteEmailSetting, navigateBackToList])

  const handleSendJobOpen = useCallback(() => {
    setRecipients([{ name: '', email: '' }])
    setSendCc('')
    setSendBcc('')
    setSendError(null)
    sendJobDisclosure.onOpen()
  }, [sendJobDisclosure])

  const setRecipient = useCallback((index: number, field: 'name' | 'email', value: string) => {
    setRecipients((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)),
    )
  }, [])

  const addRecipientRow = useCallback(() => {
    setRecipients((prev) => [...prev, { name: '', email: '' }])
  }, [])

  const removeRecipientRow = useCallback((index: number) => {
    setRecipients((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev))
  }, [])

  const handlePasteRecipients = useCallback((e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text')
    if (!text.trim()) return
    e.preventDefault()
    const parsed = parsePastedRecipients(text)
    if (parsed.length > 0) {
      setRecipients((prev) => [...prev, ...parsed])
    }
  }, [])

  const handleSendJobSubmit = useCallback(async () => {
    const toList = recipients.map((r) => r.email.trim()).filter(Boolean)
    if (toList.length === 0) {
      setSendError('Enter at least one recipient email.')
      return
    }
    if (!emailSetting) return
    setIsSending(true)
    setSendError(null)
    try {
      const res = await fetch('/api/resend/send-job', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          to: toList,
          cc:
            parseRecipients(sendCc).length > 0
              ? parseRecipients(sendCc)
              : undefined,
          bcc:
            parseRecipients(sendBcc).length > 0
              ? parseRecipients(sendBcc)
              : undefined,
          subject: emailSetting.subject ?? '',
          html: emailSetting.html ?? undefined,
          body: emailSetting.body ?? undefined,
          from: emailSetting.from?.[0],
        }),
      })
      const data = (await res.json()) as {ok: boolean; error?: string}
      if (!data.ok) {
        setSendError(data.error ?? 'Failed to send')
        return
      }
      toast.success('Send job completed')
      sendJobDisclosure.onClose()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send'
      setSendError(message)
    } finally {
      setIsSending(false)
    }
  }, [recipients, sendCc, sendBcc, emailSetting, sendJobDisclosure])

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
          Loading email template...
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
          <div className='absolute bottom-0 right-1/4 w-96 h-96 bg-brand/10 rounded-full blur-3xl' />
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
              onPress={handleSendJobOpen}
              className='gap-1'>
              Create Send
            </Button>
            <Button
              type='button'
              variant='light'
              onPress={() => setIsEditing(true)}
              className='gap-1'>
              Edit
            </Button>
            <Button
              type='button'
              color='danger'
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
          <Card
            radius='none'
            className='bg-sidebar dark:bg-background backdrop-blur-xl border border-greyed/15 rounded-t-2xl rounded-b-none shadow-none font-figtree h-28'>
            <CardHeader>
              <div className='flex items-center gap-3'>
                <SectionHeader
                  title={emailSetting.title || 'Untitled Template'}
                />
                <span className='inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-cyan-100/50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-600/50 dark:border-cyan-500/30'>
                  {emailSetting.intent || 'general'}
                </span>
                <span className='inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-brand/10 dark:bg-brand/10 text-brand dark:text-brand border border-brand/30 dark:border-brand/30'>
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
            </CardHeader>
            <CardBody>
              <div className='text-base pt-2 font-figtree'>
                <span className='text-xs uppercase opacity-70 mr-2'>
                  subject:
                </span>
                <span className='font-medium'>
                  {emailSetting.subject || 'No subject defined'}
                </span>
              </div>
            </CardBody>
          </Card>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-0 font-figtree'>
            <Card className='bg-sidebar dark:bg-background backdrop-blur-xl border border-t-0 border-greyed/15 rounded-none md:rounded-bl-4xl shadow-none'>
              <CardBody>
                <SectionHeader title='Recipients' />
                <div className='py-6 space-y-3'>
                  <div>
                    <p className='text-xs uppercase opacity-60 mb-1'>from</p>
                    <p className='text-sm'>
                      {emailSetting.from?.join(', ') || 'Not set'}
                    </p>
                  </div>
                  <div>
                    <p className='text-xs uppercase opacity-60 mb-1'>to</p>
                    <p className='text-sm'>
                      {emailSetting.to?.join(', ') || 'dynamic'}
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
                      <p className='text-xs uppercase opacity-60 mb-1'>bcc</p>
                      <p className='text-sm'>{emailSetting.bcc.join(', ')}</p>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
            <Card className='bg-sidebar dark:bg-background backdrop-blur-xl border border-t-0 border-greyed/15 rounded-none shadow-none'>
              <CardBody>
                <SectionHeader title='Template' />
                <div className='py-6 space-y-3'>
                  <div>
                    <p className='text-xs uppercase opacity-60 mb-1'>name</p>
                    <p className='text-sm'>
                      {emailSetting.template
                        ? (EMAIL_TEMPLATE_OPTIONS.find(
                            (o) => o.id === emailSetting.template,
                          )?.label ?? emailSetting.template)
                        : 'No template'}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
            <Card className='bg-sidebar dark:bg-background backdrop-blur-xl border border-t-0 md:border-l-0 border-background rounded-none rounded-b-4xl md:rounded-bl-none shadow-none'>
              <CardBody>
                <SectionHeader title='Metadata' />
                <div className='py-6 space-y-3'>
                  {emailSetting.group && (
                    <div>
                      <p className='text-xs uppercase opacity-60 mb-1'>Group</p>
                      <p className='text-sm'>{emailSetting.group}</p>
                    </div>
                  )}
                  {emailSetting.intent && (
                    <div>
                      <p className='text-xs uppercase opacity-60 mb-1'>
                        Intent
                      </p>
                      <p className='text-sm'>{emailSetting.intent}</p>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>

          {emailSetting.text && (
            <Card className='dark:bg-background bg-sidebar backdrop-blur-sm border border-zinc-800/50 p-4'>
              <SectionHeader title='Plain Text' />
              <div className='p-2'>
                <pre className='text-sm whitespace-pre-wrap font-mono bg-sidebar p-4 rounded-lg'>
                  {emailSetting.text}
                </pre>
              </div>
            </Card>
          )}

          {emailSetting.body && (
            <Card className='dark:bg-background bg-sidebar backdrop-blur-sm border border-zinc-800/50 p-4'>
              <SectionHeader title='Body Template' />
              <div className='p-2 max-h-20'>
                <pre className='text-sm whitespace-pre-wrap font-mono bg-sidebar p-4 rounded-lg'>
                  {emailSetting.body}
                </pre>
              </div>
            </Card>
          )}

          {emailSetting.html && (
            <Card className='dark:bg-background bg-sidebar backdrop-blur-sm border border-zinc-700/50 p-4'>
              <SectionHeader title='HTML Template' />
              <div className='p-2 max-h-20'>
                <pre className='text-sm whitespace-pre-wrap font-mono bg-sidebar p-4 rounded-lg overflow-x-auto'>
                  {emailSetting.html}
                </pre>
              </div>
            </Card>
          )}
        </motion.div>

        <Modal
          isOpen={sendJobDisclosure.isOpen}
          onOpenChange={sendJobDisclosure.onOpenChange}
          placement='center'
          size='lg'
          scrollBehavior='inside'>
          <ModalContent>
            <ModalHeader className='font-figtree'>
              Create a Send Job
            </ModalHeader>
            <ModalBody className='font-figtree'>
              <p className='text-sm text-default-500'>
                Paste recipients below or add rows. Use name=email, name:email,
                or name,email (one per line).
              </p>
              <Textarea
                placeholder={'Paste here: Alice=alice@example.com\nBob,bob@example.com'}
                minRows={2}
                classNames={{input: 'font-mono text-sm'}}
                onPaste={handlePasteRecipients}
                description='Paste to add rows automatically'
              />
              <div className='space-y-3'>
                {recipients.map((row, index) => (
                  <div
                    key={index}
                    className='flex flex-wrap items-end gap-2'>
                    <Input
                      label={index === 0 ? 'Name' : undefined}
                      placeholder='Name'
                      value={row.name}
                      onValueChange={(v) => setRecipient(index, 'name', v)}
                      classNames={{input: 'font-mono text-sm'}}
                      aria-label={`Recipient ${index + 1} name`}
                    />
                    <Input
                      label={index === 0 ? 'Email' : undefined}
                      placeholder='email@example.com'
                      value={row.email}
                      onValueChange={(v) => setRecipient(index, 'email', v)}
                      type='email'
                      isRequired={index === 0}
                      isInvalid={!!sendError && index === 0 && !row.email.trim()}
                      errorMessage={
                        sendError && index === 0 && !row.email.trim()
                          ? sendError
                          : undefined
                      }
                      classNames={{input: 'font-mono text-sm'}}
                      aria-label={`Recipient ${index + 1} email`}
                    />
                    <Button
                      type='button'
                      size='sm'
                      variant='light'
                      color='danger'
                      isIconOnly
                      onPress={() => removeRecipientRow(index)}
                      isDisabled={recipients.length === 1}
                      aria-label={`Remove recipient ${index + 1}`}>
                      <Icon name='trash' className='size-4' />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type='button'
                size='sm'
                variant='flat'
                onPress={addRecipientRow}
                className='gap-1'>
                <Icon name='plus' className='size-4' />
                Add another
              </Button>
              <Input
                label='CC (optional)'
                placeholder='cc@example.com'
                value={sendCc}
                onValueChange={setSendCc}
                classNames={{input: 'font-mono text-sm'}}
              />
              <Input
                label='BCC (optional)'
                placeholder='bcc@example.com'
                value={sendBcc}
                onValueChange={setSendBcc}
                classNames={{input: 'font-mono text-sm'}}
              />
              {sendError && recipients.some((r) => r.email.trim()) && (
                <p className='text-sm text-danger'>{sendError}</p>
              )}
            </ModalBody>
            <ModalFooter>
              <Button
                variant='light'
                onPress={sendJobDisclosure.onClose}
                isDisabled={isSending}>
                Cancel
              </Button>
              <Button
                color='primary'
                onPress={handleSendJobSubmit}
                isLoading={isSending}
                className='bg-dark-gray dark:bg-white dark:text-dark-table'>
                Send
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </main>
    </div>
  )
}

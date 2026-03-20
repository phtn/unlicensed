'use client'

import {AccessDenied} from '@/app/admin/_components/ui/access-denied'
import {
  commonInputClassNames,
  commonSelectClassNames,
  narrowInputClassNames,
} from '@/app/admin/_components/ui/fields'
import {SectionHeader} from '@/app/admin/_components/ui/section-header'
import {api} from '@/convex/_generated/api'
import {type Doc, Id} from '@/convex/_generated/dataModel'
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
  Progress,
  Select,
  SelectItem,
  Textarea,
} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import {motion} from 'motion/react'
import {useRouter} from 'next/navigation'
import {startTransition, useCallback, useRef, useState} from 'react'
import {toast} from 'react-hot-toast'
import type {EmailSettingsConvexArgs} from '../email-settings-form-schema'
import {toFormValues, withViewTransition} from '../utils'
import {EmailTemplateEditor} from './email-template-editor'

const MAILING_LIST_BLAST_FROM = 'hello@rapidfirenow.com'

interface EmailTemplateViewerProps {
  id: string
}
export type RecipientRow = {name: string; email: string}
type MailingListDoc = Doc<'mailingLists'>
type MailingListRecipient = MailingListDoc['recipients'][number]

/** Parse pasted text into name/email rows. Separators: =, :, or , (one per line). */
function parsePastedRecipients(text: string): RecipientRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
  return lines.map((line) => {
    const sepMatch = line.match(/[=,:]/)
    const idx = sepMatch ? line.indexOf(sepMatch[0]!) : -1
    if (idx === -1) {
      if (line.includes('@')) return {name: '', email: line}
      return {name: line, email: ''}
    }
    const left = line.slice(0, idx).trim()
    const right = line.slice(idx + 1).trim()
    const hasAtLeft = left.includes('@')
    const hasAtRight = right.includes('@')
    if (hasAtRight && !hasAtLeft) return {name: left, email: right}
    if (hasAtLeft && !hasAtRight) return {name: right, email: left}
    return {name: left, email: right}
  })
}

function normalizeCsvHeader(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

function parseCsvRow(line: string): string[] {
  const cells: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const next = line[i + 1]

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === ',' && !inQuotes) {
      cells.push(current.trim())
      current = ''
      continue
    }

    current += char
  }

  cells.push(current.trim())
  return cells
}

function parseCsvRecipients(text: string): RecipientRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length < 2) return []

  const headers = parseCsvRow(lines[0] ?? '').map(normalizeCsvHeader)
  const emailIndex = headers.findIndex((header) => header === 'email')
  const nameIndex = headers.findIndex((header) =>
    ['name', 'fullname'].includes(header),
  )
  const firstNameIndex = headers.findIndex((header) =>
    ['firstname', 'first'].includes(header),
  )
  const lastNameIndex = headers.findIndex((header) =>
    ['lastname', 'last'].includes(header),
  )

  if (emailIndex === -1) return []

  return lines.slice(1).reduce<RecipientRow[]>((rows, line) => {
    const cells = parseCsvRow(line)
    const email = cells[emailIndex]?.trim() ?? ''
    if (!email) return rows

    const explicitName = nameIndex >= 0 ? (cells[nameIndex]?.trim() ?? '') : ''
    const firstName =
      firstNameIndex >= 0 ? (cells[firstNameIndex]?.trim() ?? '') : ''
    const lastName =
      lastNameIndex >= 0 ? (cells[lastNameIndex]?.trim() ?? '') : ''
    const name = explicitName || [firstName, lastName].filter(Boolean).join(' ')

    rows.push({name, email})
    return rows
  }, [])
}

export const EmailTemplateViewer = ({id}: EmailTemplateViewerProps) => {
  const router = useRouter()
  const {user} = useAuthCtx()
  const [isEditing, setIsEditing] = useState(false)
  const [showMailingList, setShowMailingList] = useState(false)
  const [showEmailBlast, setShowEmailBlast] = useState(false)
  const [mailingListName, setMailingListName] = useState('')
  const [recipients, setRecipients] = useState<RecipientRow[]>([])
  const [selectedListId, setSelectedListId] = useState<string>('')
  const [blastProgress, setBlastProgress] = useState<{
    sent: number
    total: number
    sending: boolean
    error?: string
  } | null>(null)
  const csvInputRef = useRef<HTMLInputElement | null>(null)

  const emailSetting = useQuery(
    api.emailSettings.q.getEmailSetting,
    id ? {id: id as Id<'emailSettings'>} : 'skip',
  )
  const updateEmailSetting = useMutation(api.emailSettings.m.update)
  const deleteEmailSetting = useMutation(api.emailSettings.m.remove)
  const createMailingList = useMutation(api.mailingLists.m.create)
  const mailingLists = useQuery(api.mailingLists.q.list)

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

  const toggleMailingList = useCallback(() => {
    setShowMailingList((prev) => {
      if (!prev) {
        setRecipients([])
        setMailingListName('')
      }
      return !prev
    })
  }, [])

  const setRecipient = useCallback(
    (index: number, field: 'name' | 'email', value: string) => {
      setRecipients((prev) =>
        prev.map((r, i) => (i === index ? {...r, [field]: value} : r)),
      )
    },
    [],
  )

  const addRecipientRow = useCallback(() => {
    setRecipients((prev) => [...prev, {name: '', email: ''}])
  }, [])

  const removeRecipientRow = useCallback((index: number) => {
    setRecipients((prev) => prev.filter((_, i) => i !== index))
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

  const handleCreateMailingList = useCallback(async () => {
    const valid = recipients.filter((r) => r.email.trim())
    if (valid.length === 0) {
      toast.error('Add at least one recipient with an email.')
      return
    }
    try {
      await createMailingList({
        name: mailingListName || 'Untitled',
        recipients: valid,
      })
      toast.success(
        `Mailing list "${mailingListName || 'Untitled'}" saved with ${valid.length} recipients`,
      )
      setShowMailingList(false)
      setRecipients([])
      setMailingListName('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save list')
    }
  }, [recipients, mailingListName, createMailingList])

  const handleCsvImport = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      try {
        const text = await file.text()
        const parsed = parseCsvRecipients(text)
        if (parsed.length === 0) {
          toast.error(
            'No valid recipients found. CSV must include email and name, or email with first and last name columns.',
          )
          return
        }
        setRecipients((prev) => [...prev, ...parsed])
        toast.success(`Imported ${parsed.length} recipients from CSV`)
      } catch (error) {
        console.error(error)
        toast.error('Failed to import CSV')
      } finally {
        e.target.value = ''
      }
    },
    [],
  )

  const toggleEmailBlast = useCallback(() => {
    setShowEmailBlast((prev) => {
      if (!prev) setBlastProgress(null)
      return !prev
    })
  }, [])

  const handleEmailBlastSend = useCallback(async () => {
    const list = mailingLists?.find(
      (l: MailingListDoc) => l._id === selectedListId,
    )
    if (!list || list.recipients.length === 0) {
      toast.error('Select a mailing list with recipients.')
      return
    }
    if (!emailSetting) return
    const valid = list.recipients.filter((r: MailingListRecipient) =>
      r.email.trim(),
    )
    if (valid.length === 0) {
      toast.error('The selected list has no valid email addresses.')
      return
    }
    setBlastProgress({sent: 0, total: valid.length, sending: true})
    let sent = 0
    const delay = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms))
    for (let i = 0; i < valid.length; i++) {
      if (i > 0) await delay(600)
      const recipient = valid[i]!
      try {
        const useInvitation =
          emailSetting.template === 'invitation' && emailSetting.templateProps
        const body: Record<string, unknown> = {
          subject: emailSetting.subject ?? '',
          from: MAILING_LIST_BLAST_FROM,
          cc: emailSetting.cc ?? undefined,
          bcc: emailSetting.bcc ?? undefined,
        }
        if (useInvitation) {
          body.template = 'invitation'
          body.templateProps = emailSetting.templateProps
          body.recipients = [{email: recipient.email, name: recipient.name}]
        } else {
          body.to = [recipient.email]
          body.html = emailSetting.html ?? undefined
          body.body = emailSetting.body ?? undefined
        }
        const res = await fetch('/api/resend/send-job', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(body),
        })
        const data = (await res.json()) as {ok: boolean; error?: string}
        if (!data.ok) {
          setBlastProgress((p) =>
            p
              ? {
                  ...p,
                  sent,
                  sending: false,
                  error: `${recipient.email}: ${data.error ?? 'Failed'}`,
                }
              : null,
          )
          toast.error(`Blast stopped at ${recipient.email}: ${data.error}`)
          return
        }
        sent++
        setBlastProgress((p) => (p ? {...p, sent} : null))
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Network error'
        setBlastProgress((p) =>
          p
            ? {...p, sent, sending: false, error: `${recipient.email}: ${msg}`}
            : null,
        )
        toast.error(`Blast failed at ${recipient.email}`)
        return
      }
    }
    setBlastProgress((p) => (p ? {...p, sending: false} : null))
    toast.success(`Email blast complete: ${sent} of ${valid.length} sent`)
  }, [mailingLists, selectedListId, emailSetting])

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
      <div className='flex min-h-0 flex-1 flex-col overflow-hidden'>
        <div className='hidden dark:fixed inset-0 overflow-hidden pointer-events-none'>
          <div className='absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl' />
          <div className='absolute bottom-0 right-1/4 w-96 h-96 bg-brand/10 rounded-full blur-3xl' />
        </div>
        <main className='relative flex min-h-0 flex-1 flex-col overflow-hidden'>
          <div className='flex min-h-0 flex-1 overflow-hidden'>
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
    <div className='min-h-screen overflow-y-auto'>
      <div className='fixed inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl' />
        <div className='absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl' />
      </div>

      <main className='relative overflow-y-auto px-4 sm:px-6 lg:px-8 py-4 border-t-[0.33px] bg-linear-to-b from-zinc-200/20 dark:from-zinc-300/10 to-5% to-zinc-200/10 dark:to-zinc-300/10 zinc-200'>
        <div className='mb-4 flex items-center justify-between'>
          <Button
            type='button'
            variant='light'
            onPress={navigateBackToList}
            className='gap-2 dark:bg-transparent'>
            <Icon name='chevron-left' className='size-4' />
            <span className='hidden md:flex'>Back to Templates</span>
          </Button>
          <div className='flex items-center gap-3 px-1'>
            <Button
              type='button'
              variant='light'
              onPress={toggleMailingList}
              className='gap-1'>
              <span className='md:hidden'>+ List</span>
              <span className='hidden md:flex'>Create Mailing List</span>
            </Button>
            <Button
              type='button'
              variant='light'
              onPress={toggleEmailBlast}
              className='gap-1'>
              <span className='hidden md:flex'>Send Email </span>Blast
            </Button>
            <Button
              type='button'
              variant='light'
              onPress={() => setIsEditing(true)}
              className='gap-1'>
              <span className='hidden md:flex'>Edit</span>
              <Icon name='pen' className='size-4 md:hidden' />
            </Button>
            <Button
              type='button'
              color='danger'
              variant='light'
              onPress={handleDelete}
              className='text-mac-red hover:text-mac-red dark:text-red-400 dark:hover:text-red-500 w-4 md:w-fit'>
              <span className='hidden md:flex'>Delete</span>
              <Icon name='trash-fill' className='size-4 md:hidden' />
            </Button>
          </div>
        </div>

        <div className='h-[calc(84lvh)] overflow-scroll'>
          <motion.div
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
            className=''>
            <Card
              radius='none'
              className='bg-sidebar dark:bg-background backdrop-blur-xl border border-greyed/15 rounded-t-md rounded-b-none shadow-none font-figtree h-28'>
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
                <div className='text-base pt-2 font-clash'>
                  <span className='text-xs uppercase opacity-70 mr-2'>
                    subject:
                  </span>
                  <span className='font-medium'>
                    {emailSetting.subject || 'No subject defined'}
                  </span>
                </div>
              </CardBody>
            </Card>

            <div className='grid grid-cols-1 md:grid-cols-3 font-figtree'>
              <Card className='bg-sidebar/50 dark:bg-background backdrop-blur-xl border border-t-0 border-greyed/15 rounded-none md:rounded-bl-md shadow-none'>
                <CardBody>
                  <SectionHeader title='Recipients' />
                  <div className='pt-6 space-y-3'>
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
              <Card className='bg-sidebar/50 dark:bg-background backdrop-blur-xl border border-t-0 border-greyed/15 rounded-none shadow-none'>
                <CardBody>
                  <SectionHeader title='Template' />
                  <div className='pt-6 space-y-3'>
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
              <Card className='bg-sidebar/50 dark:bg-background backdrop-blur-xl border border-t-0 md:border-l-0 border-background rounded-none rounded-b-md md:rounded-bl-md shadow-none'>
                <CardBody>
                  <SectionHeader title='Metadata' />
                  <div className='pt-6 space-y-3'>
                    {emailSetting.group && (
                      <div>
                        <p className='text-xs uppercase opacity-60 mb-1'>
                          Group
                        </p>
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

            <div className='mt-2 flex items-center space-x-4'>
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
                <Card className='hidden dark:bg-background bg-sidebar backdrop-blur-sm border border-zinc-800/50 p-4'>
                  <SectionHeader title='Body Template' />
                  <div className='p-2 max-h-10'>
                    <pre className='text-sm whitespace-pre-wrap font-mono bg-sidebar p-4 rounded-lg'>
                      {emailSetting.body}
                    </pre>
                  </div>
                </Card>
              )}

              {emailSetting.html && (
                <Card className='hidden dark:bg-background bg-sidebar backdrop-blur-sm border border-zinc-700/50 p-4 mt-2'>
                  <SectionHeader title='HTML Template' />
                  <div className='p-2 max-h-12 hidden'>
                    <pre className='text-sm whitespace-pre-wrap font-mono bg-sidebar p-4 rounded-lg overflow-x-auto'>
                      {emailSetting.html}
                    </pre>
                  </div>
                </Card>
              )}
            </div>
          </motion.div>

          {showEmailBlast && (
            <motion.div
              initial={{opacity: 0, height: 0}}
              animate={{opacity: 1, height: 'auto'}}
              className='mt-4'>
              <Card
                shadow='none'
                className='bg-sidebar/50 dark:bg-background backdrop-blur-xl border border-greyed/15 rounded-2xl overflow-hidden font-figtree'>
                <CardHeader>
                  <SectionHeader
                    title='Send Email Blast'
                    description='Select a mailing list and send using this template. Emails are sent one recipient at a time.'
                  />
                </CardHeader>
                <CardBody className='space-y-4'>
                  <Select
                    label='Mailing list'
                    placeholder='Select a list'
                    selectedKeys={selectedListId ? [selectedListId] : []}
                    onSelectionChange={(keys) => {
                      const k = Array.from(keys)[0]
                      setSelectedListId(typeof k === 'string' ? k : '')
                    }}
                    isDisabled={!mailingLists?.length}
                    classNames={commonSelectClassNames}>
                    {(mailingLists ?? []).map((list: MailingListDoc) => (
                      <SelectItem
                        key={list._id}
                        textValue={`${list.name} (${list.recipients.length})`}>
                        {list.name} — {list.recipients.length} recipients
                      </SelectItem>
                    ))}
                  </Select>
                  {blastProgress && (
                    <div className='space-y-2'>
                      <Progress
                        value={
                          blastProgress.total > 0
                            ? (blastProgress.sent / blastProgress.total) * 100
                            : 0
                        }
                        color='success'
                        showValueLabel
                        valueLabel={`${blastProgress.sent} / ${blastProgress.total}`}
                        className='max-w-full'
                      />
                      {blastProgress.error && (
                        <p className='text-sm text-danger'>
                          {blastProgress.error}
                        </p>
                      )}
                    </div>
                  )}
                  <div className='flex justify-end gap-2'>
                    <Button variant='light' onPress={toggleEmailBlast}>
                      Cancel
                    </Button>
                    <Button
                      color='primary'
                      radius='none'
                      onPress={handleEmailBlastSend}
                      isDisabled={
                        !selectedListId ||
                        !!blastProgress?.sending ||
                        !mailingLists?.some(
                          (l: MailingListDoc) => l._id === selectedListId,
                        )
                      }
                      isLoading={!!blastProgress?.sending}
                      className='rounded-lg bg-dark-gray dark:bg-white dark:text-dark-table'>
                      Send Blast
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          )}

          {showMailingList && (
            <motion.div
              initial={{opacity: 0, height: 0}}
              animate={{opacity: 1, height: 'auto'}}
              exit={{opacity: 0, height: 0}}
              className='mt-6'>
              <Card
                shadow='none'
                className='bg-sidebar/50 dark:bg-background backdrop-blur-xl border border-greyed/15 rounded-2xl overflow-hidden font-figtree'>
                <CardHeader className='flex items-center justify-between'>
                  <SectionHeader
                    title='Create Mailing List'
                    description='Paste names and emails below (one per line). Use name=email, name:email, or name,email.'
                  />
                  <Input
                    label='List name (optional)'
                    placeholder='My mailing list'
                    value={mailingListName}
                    onValueChange={setMailingListName}
                    classNames={commonInputClassNames}
                  />
                </CardHeader>
                <CardBody className='space-y-4'>
                  <input
                    ref={csvInputRef}
                    type='file'
                    accept='.csv,text/csv'
                    className='hidden'
                    onChange={handleCsvImport}
                  />
                  <div className='flex items-start space-x-3'>
                    <Textarea
                      placeholder='PASTE Name and Email on any of these formats: Alice=alice@example.com | Bob: bob@example.com | Carol, carol@example.com'
                      minRows={1}
                      classNames={narrowInputClassNames}
                      onPaste={handlePasteRecipients}
                    />
                    <div className='flex items-center gap-3'>
                      {recipients.length > 0 && (
                        <span className='text-sm text-default-500'>
                          {recipients.length} recipient
                          {recipients.length !== 1 ? 's' : ''}
                        </span>
                      )}
                      <Button
                        type='button'
                        radius='none'
                        variant='flat'
                        onPress={addRecipientRow}
                        className='gap-1 rounded-lg'>
                        <Icon name='plus' className='size-4' />
                        Add row
                      </Button>
                      <Button
                        type='button'
                        radius='none'
                        variant='solid'
                        onPress={() => csvInputRef.current?.click()}
                        className='gap-1 rounded-lg bg-dark-table text-white dark:bg-white dark:text-dark-table'>
                        <Icon name='arrow-up' className='size-4' />
                        Import CSV
                      </Button>
                    </div>
                  </div>

                  <div
                    className='rounded-lg border border-greyed/15 bg-default-50 dark:bg-default-100/5 h-64 overflow-y-scroll'
                    style={{contentVisibility: 'auto'}}>
                    <div className='divide-y divide-greyed/10 min-w-0'>
                      {recipients.length === 0 ? (
                        <div className='px-4 py-2 text-center text-sm text-default-400'>
                          Paste or add recipients above
                        </div>
                      ) : (
                        recipients.map((row, index) => (
                          <div
                            key={index}
                            className='flex items-center gap-2 px-3 py-1.5 min-h-0 hover:bg-default-100/50 dark:hover:bg-default-50/30 transition-colors'>
                            <input
                              type='text'
                              placeholder='Name'
                              value={row.name}
                              onChange={(e) =>
                                setRecipient(index, 'name', e.target.value)
                              }
                              className='flex-1 min-w-0 text-sm font-mono bg-transparent border-none outline-none py-1 placeholder:text-default-400'
                              aria-label={`Recipient ${index + 1} name`}
                            />
                            <span className='text-default-400 shrink-0'>|</span>
                            <input
                              type='email'
                              placeholder='email@example.com'
                              value={row.email}
                              onChange={(e) =>
                                setRecipient(index, 'email', e.target.value)
                              }
                              className='flex-1 min-w-0 text-sm font-mono bg-transparent border-none outline-none py-1 placeholder:text-default-400'
                              aria-label={`Recipient ${index + 1} email`}
                            />
                            <Button
                              type='button'
                              size='sm'
                              variant='light'
                              color='danger'
                              isIconOnly
                              onPress={() => removeRecipientRow(index)}
                              aria-label={`Remove recipient ${index + 1}`}
                              className='shrink-0'>
                              <Icon name='trash' className='size-4' />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <div className='flex justify-end gap-2'>
                    <Button variant='light' onPress={toggleMailingList}>
                      Cancel
                    </Button>
                    <Button
                      color='primary'
                      radius='none'
                      onPress={handleCreateMailingList}
                      className='rounded-lg bg-dark-gray dark:bg-white dark:text-dark-table'>
                      Create Mailing List
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  )
}

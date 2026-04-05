'use client'

import {
  commonInputClassNames,
  narrowInputClassNames,
} from '@/app/admin/_components/ui/fields'
import {SectionHeader} from '@/app/admin/_components/ui/section-header'
import {Icon} from '@/lib/icons'
import {Input, Textarea as TextArea} from '@heroui/input'
import {Button, Card, CardContent, CardHeader} from '@heroui/react'
import {
  type ChangeEvent,
  type ClipboardEvent,
  useCallback,
  useRef,
  useState,
} from 'react'
import {toast} from 'react-hot-toast'

export type MailingListRecipientRow = {name: string; email: string}
type EditorRecipientRow = MailingListRecipientRow & {rowId: number}

interface MailingListEditorProps {
  title: string
  description: string
  submitLabel: string
  initialName?: string
  initialRecipients?: MailingListRecipientRow[]
  isSubmitting?: boolean
  onCancel: () => void
  onSubmit: (values: {
    name: string
    recipients: MailingListRecipientRow[]
  }) => Promise<void>
}

const parsePastedRecipients = (text: string): MailingListRecipientRow[] => {
  const lines = text
    .split(/\r?\n/)
    .map((value) => value.trim())
    .filter(Boolean)

  return lines.map((line) => {
    const separator = line.match(/[=,:]/)
    const separatorIndex = separator ? line.indexOf(separator[0]!) : -1

    if (separatorIndex === -1) {
      if (line.includes('@')) return {name: '', email: line}
      return {name: line, email: ''}
    }

    const left = line.slice(0, separatorIndex).trim()
    const right = line.slice(separatorIndex + 1).trim()
    const hasEmailLeft = left.includes('@')
    const hasEmailRight = right.includes('@')

    if (hasEmailRight && !hasEmailLeft) return {name: left, email: right}
    if (hasEmailLeft && !hasEmailRight) return {name: right, email: left}

    return {name: left, email: right}
  })
}

const normalizeCsvHeader = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')

const parseCsvRow = (line: string): string[] => {
  const cells: string[] = []
  let current = ''
  let inQuotes = false

  for (let index = 0; index < line.length; index++) {
    const character = line[index]
    const next = line[index + 1]

    if (character === '"') {
      if (inQuotes && next === '"') {
        current += '"'
        index++
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (character === ',' && !inQuotes) {
      cells.push(current.trim())
      current = ''
      continue
    }

    current += character
  }

  cells.push(current.trim())
  return cells
}

const parseCsvRecipients = (text: string): MailingListRecipientRow[] => {
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

  return lines.slice(1).reduce<MailingListRecipientRow[]>((rows, line) => {
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

const withRowId = (
  recipient: MailingListRecipientRow,
  rowId: number,
): EditorRecipientRow => ({
  ...recipient,
  rowId,
})

export const MailingListEditor = ({
  title,
  description,
  submitLabel,
  initialName = '',
  initialRecipients = [],
  isSubmitting = false,
  onCancel,
  onSubmit,
}: MailingListEditorProps) => {
  const csvInputRef = useRef<HTMLInputElement | null>(null)
  const nextRowIdRef = useRef(0)
  const allocateRowId = useCallback(() => {
    const rowId = nextRowIdRef.current
    nextRowIdRef.current += 1
    return rowId
  }, [])
  const [name, setName] = useState(initialName)
  const [recipients, setRecipients] = useState<EditorRecipientRow[]>(() =>
    initialRecipients.map((recipient) => withRowId(recipient, allocateRowId())),
  )

  const setRecipient = useCallback(
    (rowId: number, field: keyof MailingListRecipientRow, value: string) => {
      setRecipients((current) =>
        current.map((recipient) =>
          recipient.rowId === rowId
            ? {...recipient, [field]: value}
            : recipient,
        ),
      )
    },
    [],
  )

  const addRecipientRow = useCallback(() => {
    setRecipients((current) => [
      ...current,
      withRowId({name: '', email: ''}, allocateRowId()),
    ])
  }, [allocateRowId])

  const removeRecipientRow = useCallback((rowId: number) => {
    setRecipients((current) =>
      current.filter((recipient) => recipient.rowId !== rowId),
    )
  }, [])

  const handlePasteRecipients = useCallback(
    (event: ClipboardEvent) => {
      const text = event.clipboardData.getData('text')
      if (!text.trim()) return

      event.preventDefault()

      const parsedRecipients = parsePastedRecipients(text)
      if (parsedRecipients.length > 0) {
        setRecipients((current) => [
          ...current,
          ...parsedRecipients.map((recipient) =>
            withRowId(recipient, allocateRowId()),
          ),
        ])
      }
    },
    [allocateRowId],
  )

  const handleCsvImport = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      try {
        const text = await file.text()
        const parsedRecipients = parseCsvRecipients(text)

        if (parsedRecipients.length === 0) {
          toast.error(
            'No valid recipients found. CSV must include email and name, or email with first and last name columns.',
          )
          return
        }

        setRecipients((current) => [
          ...current,
          ...parsedRecipients.map((recipient) =>
            withRowId(recipient, allocateRowId()),
          ),
        ])
        toast.success(`Imported ${parsedRecipients.length} recipients from CSV`)
      } catch (error) {
        console.error(error)
        toast.error('Failed to import CSV')
      } finally {
        event.target.value = ''
      }
    },
    [allocateRowId],
  )

  const handleSubmit = useCallback(async () => {
    const validRecipients = recipients
      .map((recipient) => ({
        name: recipient.name.trim(),
        email: recipient.email.trim(),
      }))
      .filter((recipient) => recipient.email)

    if (validRecipients.length === 0) {
      toast.error('Add at least one recipient with an email.')
      return
    }

    await onSubmit({
      name: name.trim(),
      recipients: validRecipients,
    })
  }, [name, onSubmit, recipients])

  return (
    <Card className='bg-sidebar/60 shadow-none backdrop-blur-xl'>
      <CardHeader className='flex flex-col items-start gap-4 p-5 lg:flex-row lg:items-start lg:justify-between'>
        <SectionHeader
          title={title}
          description={
            recipients.length > 0 ? (
              <span className='text-sm text-default-500'>
                {recipients.length} recipient
                {recipients.length === 1 ? '' : 's'}
              </span>
            ) : (
              description
            )
          }
        />
        <Input
          label='List name (optional)'
          placeholder='My mailing list'
          value={name}
          onValueChange={setName}
          classNames={commonInputClassNames}
          className='w-full lg:max-w-sm'
        />
      </CardHeader>
      <CardContent className='space-y-4 p-5 pt-0'>
        <input
          ref={csvInputRef}
          type='file'
          accept='.csv,text/csv'
          className='hidden'
          onChange={handleCsvImport}
        />

        <div className='flex flex-col gap-3 md:gap-6 lg:flex-row lg:items-start'>
          <TextArea
            minRows={2}
            placeholder='Paste Name and Email in any of these formats: Alice=alice@example.com | Bob: bob@example.com | Carol, carol@example.com'
            classNames={narrowInputClassNames}
            onPaste={handlePasteRecipients}
          />
          <div className='flex portrait:flex-wrap items-center gap-4'>
            <Button
              size='sm'
              type='button'
                            variant='primary'
              onPress={addRecipientRow}
              className='gap-1 rounded-md'>
              <Icon name='plus' className='size-4' />
              Add row
            </Button>
            <Button
              size='sm'
              type='button'
                            variant='primary'
              onPress={() => csvInputRef.current?.click()}
              className='gap-1 rounded-md bg-dark-table text-white dark:bg-white dark:text-dark-table'>
              <Icon name='arrow-up' className='size-4' />
              Import CSV
            </Button>
          </div>
        </div>

        <div
          className='h-64 overflow-y-scroll rounded-lg border border-foreground/10 bg-default-50 dark:bg-sidebar'
          style={{contentVisibility: 'auto'}}>
          <div className='min-w-0 divide-y divide-greyed/10'>
            {recipients.length === 0 ? (
              <div className='px-4 py-8 text-center text-sm text-default-400'>
                Paste recipients, import a CSV, or add rows manually.
              </div>
            ) : (
              recipients.map((recipient, index) => (
                <div
                  key={recipient.rowId}
                  className='flex min-h-0 items-center gap-2 px-3 py-2 transition-colors hover:bg-default-100/50 dark:hover:bg-default-50/30'>
                  <input
                    type='text'
                    placeholder='Name'
                    value={recipient.name}
                    onChange={(event) =>
                      setRecipient(recipient.rowId, 'name', event.target.value)
                    }
                    className='flex-1 min-w-0 border-none bg-transparent py-1 text-sm font-mono outline-none placeholder:text-default-400'
                    aria-label={`Recipient ${index + 1} name`}
                  />
                  <span className='hidden shrink-0 text-default-400'>|</span>
                  <input
                    type='email'
                    placeholder='email@example.com'
                    value={recipient.email}
                    onChange={(event) =>
                      setRecipient(recipient.rowId, 'email', event.target.value)
                    }
                    className='flex-1 min-w-0 border-none bg-transparent py-1 text-sm font-mono outline-none placeholder:text-default-400'
                    aria-label={`Recipient ${index + 1} email`}
                  />
                  <Button
                    type='button'
                    size='sm'
                    variant='tertiary'
                    isIconOnly
                    onPress={() => removeRecipientRow(recipient.rowId)}
                    aria-label={`Remove recipient ${index + 1}`}
                    className='shrink-0 group'>
                    <Icon
                      name='trash-fill'
                      className='size-4 opacity-80 group-hover:text-rose-400 group-hover:opacity-100'
                    />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className='flex justify-end gap-2'>
          <Button variant='tertiary' onPress={onCancel}>
            Cancel
          </Button>
          <Button
            variant='primary'
                        onPress={handleSubmit}
            isDisabled={isSubmitting}
            className='rounded-lg bg-dark-table text-white dark:bg-white dark:text-dark-table'>
            {submitLabel}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

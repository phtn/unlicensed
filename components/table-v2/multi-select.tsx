import {Badge} from '@/components/reui/badge'
import {
  Frame,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from '@/components/reui/frame'
import {Table, TableBody, TableCell, TableRow} from '@/components/ui/table'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
} from '@heroui/react'
import {useMemo, useState} from 'react'
import {
  BulkEditorConfig,
  BulkEditorOption,
  ColumnConfig,
  ColumnMeta,
} from './create-column'

type EditableValue = string | number | boolean | null | undefined
type EditableInputKind = 'text' | 'number' | 'select'

interface EditableField<T> {
  id: string
  key: keyof T
  label: string
  preview: string
  placeholder: string
  typeLabel: string
  inputKind: EditableInputKind
  isMixed: boolean
  values: EditableValue[]
  options: BulkEditorOption[]
  initialValue: string
}

interface PendingFieldUpdate<T> {
  field: EditableField<T>
  value: T[keyof T]
  displayValue: string
}

interface MultiSelectProps<T> {
  columnConfigs: ColumnConfig<T>[]
  pending?: boolean
  selectedRows: T[]
  onApply: (updates: Partial<T>) => void | Promise<void>
  onDeleteSelected?: VoidFunction | (() => Promise<void>)
  deleteActionLabel?: string
  isCompact?: boolean
}

export const MultiSelect = <T,>({
  columnConfigs,
  pending = false,
  selectedRows,
  onApply,
  isCompact,
  onDeleteSelected,
  deleteActionLabel = 'Delete selected',
}: MultiSelectProps<T>) => {
  const editableFields = useMemo<EditableField<T>[]>(() => {
    return columnConfigs.flatMap((config) => {
      if (isIdentifierField(config)) {
        return []
      }

      const meta = (config.meta ?? {}) as ColumnMeta<T>
      const bulkEditor = normalizeBulkEditorConfig(meta.bulkEditor)

      if (
        meta.bulkEditor === false ||
        (bulkEditor && bulkEditor.enabled === false)
      ) {
        return []
      }

      const values = selectedRows.map(
        (row) => row[config.accessorKey] as EditableValue | object,
      )
      const definedValues = values.filter(
        (value): value is Exclude<typeof value, null | undefined> =>
          value !== null && value !== undefined,
      )

      if (
        definedValues.some(
          (value) =>
            typeof value !== 'string' &&
            typeof value !== 'number' &&
            typeof value !== 'boolean',
        )
      ) {
        return []
      }

      const primitiveValues = values as EditableValue[]
      const options = resolveFieldOptions(
        primitiveValues,
        selectedRows,
        meta,
        bulkEditor,
      )
      const inputKind = resolveInputKind(primitiveValues, options, bulkEditor)
      const initialValue = getInitialDraftValue(primitiveValues)
      const inferredTypeLabel = inferTypeLabel(primitiveValues)

      return [
        {
          id: config.id,
          key: config.accessorKey,
          label: getFieldLabel(config),
          preview: getPreviewValue(primitiveValues, options),
          placeholder: getPlaceholder(config, primitiveValues, inputKind),
          typeLabel:
            inferredTypeLabel === 'boolean'
              ? 'boolean'
              : inputKind === 'select'
                ? 'select'
                : inputKind === 'number'
                  ? 'number'
                  : inferredTypeLabel,
          inputKind,
          isMixed: hasMixedValues(primitiveValues),
          values: primitiveValues,
          options,
          initialValue,
        },
      ]
    })
  }, [columnConfigs, selectedRows])

  const initialDraftValues = useMemo(
    () =>
      Object.fromEntries(
        editableFields.map((field) => [field.id, field.initialValue]),
      ) as Record<string, string>,
    [editableFields],
  )

  const [draftValues, setDraftValues] = useState<Record<string, string>>(
    () => initialDraftValues,
  )
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)

  const hasDraftChanges = useMemo(
    () =>
      editableFields.some(
        (field) =>
          (draftValues[field.id] ?? '') !==
          (initialDraftValues[field.id] ?? ''),
      ),
    [draftValues, editableFields, initialDraftValues],
  )

  const pendingFieldUpdates = useMemo(
    () =>
      resolvePendingFieldUpdates(
        editableFields,
        draftValues,
        initialDraftValues,
      ),
    [draftValues, editableFields, initialDraftValues],
  )

  const pendingUpdates = useMemo(
    () => buildUpdatePayload(pendingFieldUpdates),
    [pendingFieldUpdates],
  )

  const hasPendingUpdates = pendingFieldUpdates.length > 0

  const handleApply = () => {
    if (!hasPendingUpdates || pending) return
    setIsConfirmOpen(true)
  }

  const handleConfirmApply = async () => {
    if (!hasPendingUpdates || pending) return

    await onApply(pendingUpdates)
    setIsConfirmOpen(false)
  }

  const handleDelete = () => {
    if (!onDeleteSelected || pending) return
    setIsDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!onDeleteSelected || pending) return

    await onDeleteSelected()
    setIsDeleteConfirmOpen(false)
  }

  const resetDraftValues = () => {
    setIsConfirmOpen(false)
    setIsDeleteConfirmOpen(false)
    setDraftValues(initialDraftValues)
  }

  return (
    <div className='flex h-full min-h-0 flex-col bg-background/70'>
      <Frame
        spacing='sm'
        variant='ghost'
        className='flex h-full min-h-0 w-full max-w-none flex-col rounded-none border-0 bg-transparent p-3'>
        <FrameHeader className='px-0! pt-0! select-none'>
          <div className='flex items-start justify-between gap-3'>
            <div className='min-w-0'>
              <FrameTitle className='opacity-80'>
                Selected Rows{' '}
                <span>
                  <span className='font-ios font-thin opacity-60'>(</span>
                  <span>{selectedRows.length}</span>
                  <span className='font-ios font-thin opacity-60'>)</span>
                </span>
              </FrameTitle>
            </div>
            <div className='flex shrink-0 items-center gap-1.5'>
              <Badge
                size='sm'
                variant='secondary'
                className='px-1.5 text-sm dark:text-white'>
                <span className='drop-shadow-xs'>
                  {editableFields.length} fields
                </span>
              </Badge>
            </div>
          </div>
        </FrameHeader>

        <FramePanel className='min-h-0 flex-1 overflow-hidden p-0!'>
          {editableFields.length > 0 ? (
            <div className='h-full overflow-y-auto'>
              <Table>
                <TableBody>
                  {editableFields.map((field) => (
                    <TableRow
                      key={field.id}
                      className='*:border-dark-table/20 hover:bg-transparent [&>:not(:last-child)]:border-r'>
                      <TableCell
                        className={cn(
                          'bg-sidebar/20 dark:bg-sidebar border-b-[0.5px] align-top text-sm font-medium w-50 max-w-50 select-none',
                          {'max-w-36': isCompact},
                        )}>
                        <div className='flex flex-col gap-1'>
                          <span>{field.label}</span>
                          <div className='flex items-center justify-between font-ios font-light uppercase text-[8px] md:text-[9px] tracking-wider'>
                            <span
                              className={cn(
                                'dark:text-emerald-400 text-emerald-600',
                                {
                                  'dark:text-indigo-400 text-indigo-600':
                                    field.typeLabel === 'select',
                                  'dark:text-sky-400 text-sky-600':
                                    field.typeLabel === 'number',
                                  'dark:text-pink-400 text-pink-500':
                                    field.typeLabel === 'boolean',
                                },
                              )}>
                              {field.typeLabel}
                            </span>
                            <span
                              className={cn(
                                'text-foreground text-[8px] md:text-[9px]',
                                {
                                  'text-amber-600 dark:text-orange-300':
                                    field.isMixed,
                                },
                              )}>
                              {field.isMixed && field.preview}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className={cn('py-0', {hidden: isCompact})}>
                        <div className='flex flex-col'>
                          {field.inputKind === 'select' ? (
                            <Select
                              size='sm'
                              selectedKeys={
                                draftValues[field.id]
                                  ? [draftValues[field.id]]
                                  : []
                              }
                              onSelectionChange={(keys) => {
                                const key = Array.from(keys)[0]
                                setDraftValues((current) => ({
                                  ...current,
                                  [field.id]: key != null ? String(key) : '',
                                }))
                              }}
                              placeholder={field.placeholder}
                              disallowEmptySelection={false}
                              disabled={pending}
                              classNames={bulkSelectClassNames}>
                              {field.options.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  textValue={option.label}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </Select>
                          ) : (
                            <input
                              type={field.inputKind}
                              value={draftValues[field.id] ?? ''}
                              onChange={(event) => {
                                const value = event.target.value
                                setDraftValues((current) => ({
                                  ...current,
                                  [field.id]: value,
                                }))
                              }}
                              placeholder={field.placeholder}
                              disabled={pending}
                              className='h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/80 focus:border-foreground/30 disabled:cursor-not-allowed disabled:opacity-60'
                            />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className='flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground'>
              No primitive table fields are available for bulk editing.
            </div>
          )}
        </FramePanel>

        <FrameFooter className='px-0! pb-0!'>
          <div className='flex flex-wrap items-center justify-between gap-2'>
            <button
              type='button'
              onClick={handleDelete}
              disabled={pending || !onDeleteSelected}
              className='rounded-lg bg-rose-500/95 hover:bg-rose-500 px-2 md:px-3 py-2 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50'>
              <span className={cn('flex', {hidden: isCompact})}>
                {deleteActionLabel}
              </span>
              <Icon
                name='trash-fill'
                className={cn('size-4 hidden', {flex: isCompact})}
              />
            </button>
            <div className='flex items-center gap-2'>
              <button
                type='button'
                onClick={resetDraftValues}
                disabled={pending || !hasDraftChanges}
                className={cn(
                  'rounded-lg border border-border bg-background px-2 md:px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50',
                  {hidden: isCompact},
                )}>
                Reset
              </button>
              <button
                type='button'
                onClick={handleApply}
                disabled={
                  pending || !hasPendingUpdates || editableFields.length === 0
                }
                className='rounded-lg border border-foreground/10 bg-foreground px-2 md:px-3 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-50'>
                {pending ? 'Saving...' : 'Apply changes'}
              </button>
            </div>
          </div>
        </FrameFooter>
      </Frame>

      <Modal
        isOpen={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        placement='center'
        backdrop='blur'
        size='lg'>
        <ModalContent className='border border-border/60 bg-background/95 shadow-2xl'>
          <ModalHeader className='flex flex-col gap-1 pb-2'>
            <span className='text-base font-semibold tracking-tight'>
              Review bulk changes
            </span>
            <p className='text-sm font-normal text-muted-foreground'>
              {pendingFieldUpdates.length} field
              {pendingFieldUpdates.length === 1 ? '' : 's'} will be applied to{' '}
              {selectedRows.length} selected row
              {selectedRows.length === 1 ? '' : 's'}.
            </p>
          </ModalHeader>
          <ModalBody className='gap-4 pb-2'>
            <div className='grid gap-2 sm:grid-cols-2'>
              <div className='rounded-xl border border-border/60 bg-muted/40 px-4 py-3'>
                <div className='text-[10px] font-medium uppercase tracking-[0.24em] text-muted-foreground'>
                  Selected
                </div>
                <div className='mt-1 text-lg font-semibold'>
                  {selectedRows.length} row
                  {selectedRows.length === 1 ? '' : 's'}
                </div>
              </div>
              <div className='rounded-xl border border-border/60 bg-muted/40 px-4 py-3'>
                <div className='text-[10px] font-medium uppercase tracking-[0.24em] text-muted-foreground'>
                  Pending fields
                </div>
                <div className='mt-1 text-lg font-semibold'>
                  {pendingFieldUpdates.length}
                </div>
              </div>
            </div>

            <div className='overflow-hidden rounded-xl border border-border/60 bg-background/70'>
              <div className='border-b border-border/60 px-4 py-2 text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground'>
                Change summary
              </div>
              <div className='max-h-[42vh] overflow-y-auto'>
                {pendingFieldUpdates.map(({field, displayValue}) => (
                  <div
                    key={field.id}
                    className='grid gap-3 border-b border-border/50 px-4 py-3 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center'>
                    <div className='min-w-0'>
                      <div className='text-sm font-medium'>{field.label}</div>
                      <div className='truncate text-xs text-muted-foreground'>
                        {field.preview}
                      </div>
                    </div>
                    <Icon
                      name='arrow-right'
                      className='size-4 shrink-0 text-muted-foreground'
                    />
                    <div className='min-w-0 text-sm font-medium sm:text-right'>
                      {displayValue}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p className='text-xs leading-5 text-muted-foreground'>
              Only the fields listed here will be patched onto each selected
              row.
            </p>
          </ModalBody>
          <ModalFooter className='gap-2'>
            <button
              type='button'
              onClick={() => setIsConfirmOpen(false)}
              disabled={pending}
              className='rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50'>
              Cancel
            </button>
            <button
              type='button'
              onClick={handleConfirmApply}
              disabled={pending || !hasPendingUpdates}
              className='rounded-lg border border-foreground/10 bg-foreground px-3 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-50'>
              {pending ? 'Saving...' : 'Confirm changes'}
            </button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        placement='center'
        backdrop='blur'
        size='md'>
        <ModalContent className='border border-border/60 bg-background/95 shadow-2xl'>
          <ModalHeader className='flex flex-col gap-1 pb-2'>
            <span className='text-base font-semibold tracking-tight'>
              Confirm bulk delete
            </span>
            <p className='text-sm font-normal text-muted-foreground'>
              {selectedRows.length} selected row
              {selectedRows.length === 1 ? '' : 's'} will be deleted.
            </p>
          </ModalHeader>
          <ModalBody className='gap-4 pb-2'>
            <div className='rounded-xl border border-rose-500/20 bg-rose-500/8 px-4 py-3'>
              <div className='flex items-start gap-3'>
                <div className='mt-0.5 rounded-full bg-rose-500/12 p-2 text-rose-600 dark:text-rose-300'>
                  <Icon name='trash-fill' className='size-4' />
                </div>
                <div className='min-w-0'>
                  <div className='text-sm font-semibold text-foreground'>
                    This action removes the selected rows.
                  </div>
                  <p className='mt-1 text-xs leading-5 text-muted-foreground'>
                    Review the selection before continuing. This applies to all{' '}
                    {selectedRows.length} selected row
                    {selectedRows.length === 1 ? '' : 's'}.
                  </p>
                </div>
              </div>
            </div>

            <div className='rounded-xl border border-border/60 bg-muted/40 px-4 py-3'>
              <div className='text-[10px] font-medium uppercase tracking-[0.24em] text-muted-foreground'>
                Selected
              </div>
              <div className='mt-1 text-lg font-semibold'>
                {selectedRows.length} row
                {selectedRows.length === 1 ? '' : 's'}
              </div>
            </div>
          </ModalBody>
          <ModalFooter className='gap-2'>
            <button
              type='button'
              onClick={() => setIsDeleteConfirmOpen(false)}
              disabled={pending}
              className='rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50'>
              Cancel
            </button>
            <button
              type='button'
              onClick={handleConfirmDelete}
              disabled={pending || !onDeleteSelected}
              className='rounded-lg border border-rose-500/10 bg-rose-500 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-500/90 disabled:cursor-not-allowed disabled:opacity-50'>
              {pending ? 'Deleting...' : deleteActionLabel}
            </button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  )
}

const bulkSelectClassNames = {
  trigger:
    'min-h-10 h-10 border border-border bg-background rounded-lg shadow-none px-3 data-[hover=true]:bg-background data-[focus=true]:bg-background data-[focus=true]:border-foreground/30',
  value: 'text-sm',
  selectorIcon: 'text-muted-foreground',
  listbox: 'p-1.5',
  popoverContent: 'rounded-xl',
}

const normalizeBulkEditorConfig = <T,>(
  bulkEditor: ColumnMeta<T>['bulkEditor'],
) => {
  if (!bulkEditor || typeof bulkEditor !== 'object') {
    return null
  }

  return bulkEditor as BulkEditorConfig<T>
}

const resolveFieldOptions = <T,>(
  values: EditableValue[],
  rows: T[],
  meta: ColumnMeta<T>,
  bulkEditor: BulkEditorConfig<T> | null,
) => {
  const explicitOptions = bulkEditor?.options
  if (explicitOptions) {
    const options =
      typeof explicitOptions === 'function'
        ? explicitOptions(rows)
        : explicitOptions
    return ensureCurrentOptions(values, dedupeOptions(options))
  }

  if (meta.filterOptions?.length) {
    return ensureCurrentOptions(
      values,
      dedupeOptions(
        meta.filterOptions.map((option) => ({
          value: String(option),
          label: String(option),
        })),
      ),
    )
  }

  const nonNullValues = values.filter(
    (value): value is boolean => typeof value === 'boolean',
  )
  if (
    nonNullValues.length > 0 &&
    nonNullValues.length === values.filter((value) => value != null).length
  ) {
    return ensureCurrentOptions(values, [
      {value: 'true', label: 'True'},
      {value: 'false', label: 'False'},
    ])
  }

  return []
}

const resolveInputKind = <T,>(
  values: EditableValue[],
  options: BulkEditorOption[],
  bulkEditor: BulkEditorConfig<T> | null,
): EditableInputKind => {
  if (bulkEditor?.type === 'select' && options.length > 0) {
    return 'select'
  }

  if (bulkEditor?.type === 'number') {
    return 'number'
  }

  if (options.length > 0) {
    return 'select'
  }

  const sample = values.find((value) => value !== null && value !== undefined)
  if (typeof sample === 'number') return 'number'

  return 'text'
}

const ensureCurrentOptions = (
  values: EditableValue[],
  options: BulkEditorOption[],
) => {
  const optionsByValue = new Map(
    options.map((option) => [option.value, option]),
  )

  for (const value of values) {
    if (value == null || value === '') continue
    const serializedValue = serializeDraftValue(value)
    if (!optionsByValue.has(serializedValue)) {
      optionsByValue.set(serializedValue, {
        value: serializedValue,
        label: formatRawValue(value),
      })
    }
  }

  return Array.from(optionsByValue.values())
}

const dedupeOptions = (options: BulkEditorOption[]) => {
  return Array.from(
    new Map(options.map((option) => [option.value, option])).values(),
  )
}

const getFieldLabel = <T,>(config: ColumnConfig<T>) => {
  if (typeof config.header === 'string' && config.header.trim().length > 0) {
    return config.header
  }

  return humanizeLabel(String(config.id || config.accessorKey))
}

const isIdentifierField = <T,>(config: ColumnConfig<T>) => {
  const identifiers = new Set(['id', '_id'])
  const configId = String(config.id).toLowerCase()
  const accessorKey = String(config.accessorKey).toLowerCase()

  return identifiers.has(configId) || identifiers.has(accessorKey)
}

const getPlaceholder = <T,>(
  config: ColumnConfig<T>,
  values: EditableValue[],
  inputKind: EditableInputKind,
) => {
  const label = humanizeLabel(
    String(config.id || config.accessorKey),
  ).toLowerCase()
  if (inputKind === 'select') {
    return `Select ${label}`
  }

  if (hasMixedValues(values)) {
    return `Set ${label} for all selected`
  }

  return `Enter a new ${label}`
}

const getInitialDraftValue = (values: EditableValue[]) => {
  if (values.length === 0 || hasMixedValues(values)) {
    return ''
  }

  return serializeDraftValue(values[0])
}

const getPreviewValue = (
  values: EditableValue[],
  options: BulkEditorOption[],
) => {
  if (values.length === 0) return 'No rows selected'

  if (hasMixedValues(values)) {
    return 'Mixed values'
  }

  return formatValue(values[0], options)
}

const inferTypeLabel = (values: EditableValue[]) => {
  const sample = values.find((value) => value !== null && value !== undefined)

  if (typeof sample === 'number') return 'number'
  if (typeof sample === 'boolean') return 'boolean'
  return 'text'
}

const hasMixedValues = (values: EditableValue[]) => {
  return new Set(values.map(serializeValue)).size > 1
}

const serializeValue = (value: EditableValue) => {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  return `${typeof value}:${String(value)}`
}

const serializeDraftValue = (value: EditableValue) => {
  if (value === null || value === undefined || value === '') {
    return ''
  }

  return String(value)
}

const formatValue = (value: EditableValue, options: BulkEditorOption[]) => {
  if (value === null || value === undefined || value === '') {
    return 'No value'
  }

  const option = options.find((item) => item.value === String(value))
  if (option) {
    return option.label
  }

  return formatRawValue(value)
}

const formatRawValue = (value: EditableValue) => {
  if (value === null || value === undefined || value === '') {
    return 'No value'
  }

  if (typeof value === 'boolean') {
    return value ? 'True' : 'False'
  }

  return String(value)
}

const humanizeLabel = (value: string) => {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\w/, (char) => char.toUpperCase())
}

const coerceValue = <T,>(rawValue: string, field: EditableField<T>) => {
  const sample = field.values.find(
    (value) => value !== null && value !== undefined,
  )

  if (typeof sample === 'number') {
    const numericValue = Number(rawValue)
    return Number.isNaN(numericValue) ? rawValue : numericValue
  }

  if (typeof sample === 'boolean') {
    const normalized = rawValue.toLowerCase()
    if (normalized === 'true') return true
    if (normalized === 'false') return false
  }

  return rawValue
}

const resolvePendingFieldUpdates = <T,>(
  editableFields: EditableField<T>[],
  draftValues: Record<string, string>,
  initialDraftValues: Record<string, string>,
): PendingFieldUpdate<T>[] => {
  return editableFields.flatMap((field) => {
    const draftValue = draftValues[field.id] ?? ''
    const initialValue = initialDraftValues[field.id] ?? ''

    if (draftValue === initialValue) {
      return []
    }

    const normalizedValue =
      field.inputKind === 'text' ? draftValue : draftValue.trim()

    if (!normalizedValue) {
      return []
    }

    const value = coerceValue(normalizedValue, field) as T[keyof T]

    return [
      {
        field,
        value,
        displayValue: formatValue(value as EditableValue, field.options),
      },
    ]
  })
}

const buildUpdatePayload = <T,>(
  pendingFieldUpdates: PendingFieldUpdate<T>[],
) => {
  return pendingFieldUpdates.reduce((updates, {field, value}) => {
    updates[field.key] = value
    return updates
  }, {} as Partial<T>)
}

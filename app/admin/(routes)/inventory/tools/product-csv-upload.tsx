'use client'

import {commonInputClassNames} from '@/app/admin/_components/ui/fields'
import {useSidebar} from '@/app/admin/_components/ui/sidebar'
import {TabContentContainer} from '@/app/admin/_components/ui/tab-content'
import {api} from '@/convex/_generated/api'
import {useAuthCtx} from '@/ctx/auth'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Button, Card, Chip, Input} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import {useCallback, useMemo, useRef, useState} from 'react'
import {
  defaultImportTitle,
  parseProductsCsv,
  type ParseResult,
} from '../product/csv-import/lib'
import type {ParsedRow} from '../product/csv-import/lib'
import {
  buildRowsWithConflicts,
  getPreviewCellIssue,
  getPreviewColumns,
  getRowPreviewIssues,
  mapImportRowErrors,
  seedDefaultDenominationStock,
  seedDefaultImage,
  seedDenominationColumnsFromMaps,
  type ImportRowError,
} from './product-csv-upload-helpers'

export function ProductCsvUpload() {
  const {user} = useAuthCtx()
  const importTargetsData = useQuery(api.products.q.listProductImportTargets)
  const categoriesData = useQuery(api.categories.q.listCategories)
  const importTargets = useMemo(
    () => importTargetsData ?? [],
    [importTargetsData],
  )
  const categories = useMemo(() => categoriesData ?? [], [categoriesData])
  const existingProductsBySlug = useMemo(
    () =>
      new Map(
        importTargets
          .filter((target) => target.slug.trim())
          .map((target) => [target.slug.trim(), String(target._id)]),
      ),
    [importTargets],
  )
  const validCategorySlugs = useMemo(
    () =>
      new Set(
        categories
          .map((c) => c.slug)
          .filter((slug): slug is string => typeof slug === 'string' && slug.length > 0),
      ),
    [categories],
  )
  const seedProducts = useMutation(api.products.m.seedProductsFromCsv)

  const [fileParseResult, setFileParseResult] = useState<ParseResult | null>(
    null,
  )
  const [fileName, setFileName] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState<string | null>(null)
  const [importRowErrors, setImportRowErrors] = useState<ImportRowError[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const rowsWithConflicts = useMemo(
    () =>
      buildRowsWithConflicts(
        fileParseResult,
        existingProductsBySlug,
        validCategorySlugs,
      ),
    [fileParseResult, existingProductsBySlug, validCategorySlugs],
  )

  const validRows = useMemo(() => {
    if (!rowsWithConflicts) return []
    return rowsWithConflicts.filter(
      (r) => r.errors.length === 0 && r.conflict === null,
    )
  }, [rowsWithConflicts])

  const canImport = validRows.length > 0 && title.trim().length > 0
  const uploaderEmail = user?.email ?? ''

  const processFile = useCallback((text: string, name: string) => {
    const result = seedDefaultImage(
      seedDefaultDenominationStock(
        seedDenominationColumnsFromMaps(parseProductsCsv(text)),
      ),
    )
    setFileParseResult(result)
    setFileName(name)
    if (result.ok) {
      setTitle(defaultImportTitle())
    }
  }, [])

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setImportError(null)
      setImportSuccess(null)
      setImportRowErrors([])
      const file = e.target.files?.[0]
      if (!file) {
        setFileParseResult(null)
        setFileName(null)
        return
      }
      const reader = new FileReader()
      reader.onload = () => {
        processFile(String(reader.result ?? ''), file.name)
      }
      reader.readAsText(file, 'utf-8')
    },
    [processFile],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      setImportError(null)
      setImportSuccess(null)
      setImportRowErrors([])
      const file = e.dataTransfer.files?.[0]
      if (!file || !file.name.toLowerCase().endsWith('.csv')) return
      const reader = new FileReader()
      reader.onload = () => {
        processFile(String(reader.result ?? ''), file.name)
      }
      reader.readAsText(file, 'utf-8')
    },
    [processFile],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleImport = useCallback(async () => {
    if (!canImport || !rowsWithConflicts) return
    const products = validRows.map((r) => r.product)
    setIsImporting(true)
    setImportError(null)
    setImportSuccess(null)
    setImportRowErrors([])
    try {
      const result = await seedProducts({
        title: title.trim(),
        uploadedBy: uploaderEmail,
        products: products as Parameters<typeof seedProducts>[0]['products'],
      })
      if (result.errorCount > 0) {
        setImportRowErrors(mapImportRowErrors(result.errors ?? [], validRows))
        setImportError(
          `Imported ${result.successCount} products. ${result.errorCount} row(s) failed.`,
        )
      } else {
        setImportSuccess(`Imported ${result.successCount} product(s).`)
        setImportRowErrors([])
        setFileParseResult(null)
        setFileName(null)
        setTitle('')
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    } catch (e) {
      setImportRowErrors([])
      setImportError(e instanceof Error ? e.message : 'Import failed')
    } finally {
      setIsImporting(false)
    }
  }, [
    canImport,
    rowsWithConflicts,
    validRows,
    title,
    uploaderEmail,
    seedProducts,
  ])

  const handleClear = useCallback(() => {
    setFileParseResult(null)
    setFileName(null)
    setTitle('')
    setImportError(null)
    setImportSuccess(null)
    setImportRowErrors([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const displayRows = useMemo(
    () => rowsWithConflicts ?? fileParseResult?.rows ?? [],
    [rowsWithConflicts, fileParseResult],
  )
  const previewColumns = useMemo(
    () => getPreviewColumns(fileParseResult, displayRows),
    [fileParseResult, displayRows],
  )
  const errorCount = displayRows.reduce((s, r) => s + r.errors.length, 0)
  const conflictCount = displayRows.filter((r) => r.conflict !== null).length
  const previewIssues = useMemo(
    () =>
      displayRows.flatMap((row) => {
        const slug =
          typeof row.product.slug === 'string' && row.product.slug.trim()
            ? row.product.slug.trim()
            : undefined
        return getRowPreviewIssues(row, previewColumns).map((issue) => ({
          rowIndex: row.rowIndex,
          column: issue.column,
          label: issue.label,
          slug,
          message: issue.message,
        }))
      }),
    [displayRows, previewColumns],
  )
  const {open: sidebarOpen} = useSidebar()

  return (
    <TabContentContainer
      title='Product CSV Import'
      description='Upload a CSV in the same format as export. Preview rows, fix validation errors and slug conflicts, then import. Rows with an _id replace the existing product, and blank slugs are derived from the product name.'
      className={cn(
        'flex h-full min-w-0 md:max-w-[calc(95lvw)] flex-col gap-6 overflow-hidden bg-sidebar p-4 rounded-lg',
        {'md:max-w-[calc(82lvw)]': sidebarOpen},
      )}
      extraHeader={
        fileName ? (
          <div className='flex items-center space-x-2'>
            <Icon
              name='x'
              className='size-4 text-rose-400'
              onClick={handleClear}
            />
            <div className='flex items-center space-x-2 font-ios text-sm text-blue-500 dark:text-blue-400 px-2 py-1 rounded-sm bg-blue-500/10'>
              <Icon name='document' className='size-4' />
              <span>{fileName}</span>
            </div>
          </div>
        ) : null
      }>
      <div className='flex min-w-0 max-w-full flex-col gap-6'>
        {/* Drop zone / file picker */}
        {fileName ? null : (
          <Card
            radius='lg'
            shadow='none'
            className={cn(
              'border-2 border-dashed transition-colors duration-200',
              isDragging
                ? 'border-primary bg-primary/0 dark:bg-white dark:text-dark-table'
                : 'border-default-200 hover:border-default-300 dark:border-default-100 dark:hover:border-default-200',
            )}>
            <label
              className='flex min-h-[141.1px] cursor-pointer flex-col items-center justify-center gap-3 p-6'
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}>
              <input
                ref={fileInputRef}
                type='file'
                accept='.csv,text/csv'
                className='hidden'
                onChange={handleFileChange}
              />
              {!fileName ? (
                <>
                  <span className='text-center text-sm font-medium text-default-600 dark:text-default-400'>
                    Drop CSV here or click to choose
                  </span>
                  <span className='inline-flex h-10 items-center justify-center rounded-sm dark:bg-white bg-dark-table text-white dark:text-dark-table/70 px-8 text-sm font-clash font-medium tracking-wide'>
                    Choose CSV file
                  </span>
                </>
              ) : (
                <>
                  <div className='flex size-12 items-center justify-center rounded-xl bg-success/20'>
                    <Icon name='check' className='size-6 text-success' />
                  </div>
                  <span className='font-mono text-sm text-foreground'>
                    {fileName}
                  </span>
                  <span className='text-xs text-default-500'>
                    Click or drop another file to replace
                  </span>
                </>
              )}
            </label>
            {fileParseResult?.fileError && (
              <p className='border-t border-default-200 px-6 py-3 text-sm text-danger'>
                {fileParseResult.fileError}
              </p>
            )}
          </Card>
        )}

        {/* Metadata */}
        {displayRows.length > 0 && (
          <Card
            radius='sm'
            shadow='none'
            className='min-w-0 p-0 bg-transparent'>
            <div className='grid min-w-0 grid-cols-1 gap-0 md:grid-cols-4'>
              <div className='col-span-3'>
                <Input
                  label='Upload title'
                  placeholder='e.g. 2026-03-03T12-34-56'
                  value={title}
                  onValueChange={setTitle}
                  size='sm'
                  radius='lg'
                  className='w-5xl'
                  classNames={{
                    ...commonInputClassNames,
                  }}
                />
              </div>
            </div>
          </Card>
        )}

        {/* Stats + table */}
        {displayRows.length > 0 && (
          <div
            className={cn(
              'flex min-w-0 shrink-0 max-w-[calc(92lvw)] flex-col gap-4 overflow-hidden font-clash',
              {' max-w-[calc(80lvw)]': sidebarOpen},
            )}>
            <div className='flex flex-wrap items-center justify-between gap-3'>
              <div className='flex flex-wrap items-center gap-2'>
                <Chip
                  size='sm'
                  variant='flat'
                  classNames={{
                    base: 'bg-default-100 dark:bg-default-100/20',
                    content: 'font-medium',
                  }}>
                  <span className='pe-1.5'>{displayRows.length}</span>
                  <span>Row{displayRows.length !== 1 ? 's' : ''}</span>
                </Chip>
                {errorCount > 0 && (
                  <Chip
                    size='sm'
                    radius='none'
                    variant='solid'
                    color='danger'
                    className='rounded-sm text-white'>
                    <span className='pe-1.5'>{errorCount}</span>
                    <span>Error{errorCount !== 1 ? 's' : ''}</span>
                  </Chip>
                )}
                {conflictCount > 0 && (
                  <Chip
                    size='sm'
                    radius='none'
                    color='danger'
                    variant='solid'
                    className='rounded-sm bg-orange-400'>
                    <span className='pe-1.5'>{conflictCount}</span>
                    <span>Conflict{conflictCount !== 1 ? 's' : ''}</span>
                  </Chip>
                )}
                {validRows.length > 0 && (
                  <Chip
                    size='sm'
                    variant='solid'
                    color='success'
                    className='rounded-sm text-white dark:bg-emerald-500/80 tracking-wide'>
                    <span className='pe-1.5'>{validRows.length}</span>
                    <span className=''>
                      {validRows.length !== 1 ? 'Products' : 'Product'} ready to
                      import
                    </span>
                  </Chip>
                )}
              </div>
              <Button
                size='sm'
                variant='solid'
                isDisabled={!canImport}
                isLoading={isImporting}
                onPress={handleImport}
                radius='none'
                className='bg-foreground text-background/80 rounded-md min-w-[181.1px] text-sm font-medium'
                startContent={
                  !isImporting ? (
                    <Icon name='arrow-up-fat' className='size-4' />
                  ) : undefined
                }>
                {isImporting ? (
                  'Importing…'
                ) : (
                  <span>
                    Import <span className='px-1.5'>{validRows.length}</span>{' '}
                    product{validRows.length !== 1 ? 's' : ''}
                  </span>
                )}
              </Button>
            </div>

            {previewIssues.length > 0 && (
              <Card
                radius='none'
                shadow='none'
                className='rounded-md border border-warning-200 bg-white px-4 py-3 dark:border-warning-900/50 dark:bg-warning-950/20'>
                <p className='flex items-center space-x-1 text-sm font-medium text-warning-800 dark:text-dark-table'>
                  <Icon name='alert-circle' className='size-4' />
                  <span>Validation issues</span>
                </p>
                <ul className='mt-2 space-y-1 text-sm text-warning-700 dark:text-warning-300'>
                  {previewIssues.map((issue) => (
                    <li
                      key={`${issue.rowIndex}-${issue.column}-${issue.slug ?? issue.message}`}>
                      <Chip
                        size='sm'
                        className='rounded-sm bg-orange-400 dark:bg-orange-500/75 text-white'>
                        Row {issue.rowIndex}
                      </Chip>
                      <Chip
                        size='sm'
                        className='ms-2 rounded-sm bg-cyan-500/85 text-white dark:bg-cyan-500'>
                        {issue.column}
                      </Chip>
                      <span className='ms-2'>{issue.label}</span>
                      <span className='px-2 opacity-80'>-</span>
                      <span>{issue.slug ?? 'No slug'}</span>
                      <span className='px-2 opacity-80'>-</span>
                      <span>{issue.message}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            <Card
              radius='lg'
              shadow='none'
              className='flex h-[min(55vh,480px)] min-h-50 min-w-0 w-full flex-col overflow-hidden border-0'>
              <div className='min-h-0 w-full flex-1 overflow-x-auto overflow-y-auto'>
                <table className='min-w-full table-fixed text-sm'>
                  <thead className='sticky top-0 z-10'>
                    <tr>
                      {previewColumns.map((col) => (
                        <th
                          key={col}
                          className='max-w-36 truncate whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-widest text-cyan-600 dark:text-cyan-300 bg-background'>
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-default-100 dark:divide-default-50/20'>
                    {displayRows.map((row) => (
                      <PreviewRow
                        key={row.rowIndex}
                        row={row}
                        columns={previewColumns}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* Result message */}
        {(importError || importSuccess) && (
          <Card
            radius='lg'
            shadow='none'
            className={cn(
              'border px-4 py-3',
              importError
                ? 'border-danger-200 bg-danger-50/50 dark:border-danger-900/50 dark:bg-danger-950/20'
                : 'border-success-200 bg-success-50/50 dark:bg-success-500/10',
            )}>
            <p
              className={cn(
                'text-sm font-medium',
                importError
                  ? 'text-danger-700 dark:text-danger-300'
                  : 'text-success-700 dark:text-success-300',
              )}>
              {importError ?? importSuccess}
            </p>
            {importRowErrors.length > 0 && (
              <ul className='mt-3 space-y-1 text-sm text-danger-700 dark:text-danger-300'>
                {importRowErrors.map((error) => (
                  <li key={`${error.rowIndex}-${error.slug ?? error.message}`}>
                    Row {error.rowIndex}
                    {error.slug ? ` (${error.slug})` : ''}: {error.message}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}

        {/* Import CTA */}
        {displayRows.length > 0 && <div className='h-px shrink-0' />}
      </div>
    </TabContentContainer>
  )
}

function PreviewRow({row, columns}: {row: ParsedRow; columns: string[]}) {
  const hasError = row.errors.length > 0 || row.conflict !== null
  const rowIssues = getRowPreviewIssues(row, columns)
  const statusIssue = rowIssues[0] ?? null
  const rowMode =
    typeof row.product._id === 'string' && row.product._id.trim()
      ? 'Replace'
      : 'Create'
  return (
    <tr
      className={cn(
        'transition-colors',
        hasError
          ? 'bg-danger-50/40 dark:bg-danger-950/30 hover:bg-danger-50/60 dark:hover:bg-danger-950/40'
          : 'hover:bg-default-50/80 dark:hover:bg-default-100/10',
      )}>
      {columns.map((col) => {
        if (col === '#') {
          return (
            <td
              key={col}
              className='sticky left-0 z-1 whitespace-nowrap bg-inherit px-4 py-2.5 font-ios text-sm text-orange-500 dark:text-orange-300'>
              {row.rowIndex}
            </td>
          )
        }
        if (col === 'Status') {
          return (
            <td
              key={col}
              className='sticky right-0 z-1 min-w-[140.1px] bg-inherit px-4 py-2.5'>
              <div className='flex flex-wrap items-center gap-1.5'>
                {statusIssue && (
                  <Chip
                    size='sm'
                    color='danger'
                    variant='solid'
                    className='font-medium text-white'>
                    {statusIssue.label}
                  </Chip>
                )}
                {!hasError && (
                  <Chip
                    size='sm'
                    variant='solid'
                    color='success'
                    className={cn(
                      'bg-white text-green-700 font-clash tracking-wide',
                      {
                        'bg-indigo-400 text-white': rowMode === 'Replace',
                      },
                    )}>
                    {rowMode}
                  </Chip>
                )}
                {hasError && row.errors.length === 0 && (
                  <Chip
                    size='sm'
                    variant='solid'
                    color='danger'
                    className='text-white'>
                    {rowMode}
                  </Chip>
                )}
              </div>
            </td>
          )
        }
        const value = row.raw[col] ?? '—'
        const display = String(value).trim() || '—'
        const issue = getPreviewCellIssue(row, col)
        return (
          <td
            key={col}
            className={cn('max-w-35 px-4 py-2.5 align-top text-default-600', {
              'truncate whitespace-nowrap': !issue,
              'bg-danger-50/80 dark:bg-danger-950/20': issue,
            })}
            title={issue?.message ?? display}>
            {issue ? (
              <div className='flex min-w-0 flex-col gap-1'>
                <span className='wrap-break-word whitespace-normal'>
                  {display}
                </span>
                <span
                  className={cn(
                    'inline-flex w-fit items-center rounded-sm px-1.5 py-0.5 text-xs font-semibold uppercase tracking-[0.12em] text-white',
                    {
                      'bg-danger-600': issue.label === 'REQUIRED',
                      'bg-orange-400':
                        issue.label === 'NUMBER TYPE' ||
                        issue.label === 'ARRAY TYPE' ||
                        issue.label === 'VALUE TYPE',
                      'bg-orange-500': issue.label === 'CONFLICT',
                    },
                  )}>
                  {issue.label}
                </span>
              </div>
            ) : (
              display
            )}
          </td>
        )
      })}
    </tr>
  )
}

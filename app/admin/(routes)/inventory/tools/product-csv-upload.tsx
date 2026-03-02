'use client'

import {api} from '@/convex/_generated/api'
import {useAuthCtx} from '@/ctx/auth'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Button, Card, Chip, Input, ScrollShadow} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import {useCallback, useMemo, useState} from 'react'
import {
  applySlugConflicts,
  defaultImportTitle,
  parseProductsCsv,
  type ParseResult,
  type ParsedRow,
} from '../product/csv-import/lib'

export function ProductCsvUpload() {
  const {user} = useAuthCtx()
  const existingSlugs = useQuery(api.products.q.listProductSlugs) ?? []
  const categories = useQuery(api.categories.q.listCategories) ?? []
  const existingSlugSet = useMemo(() => new Set(existingSlugs), [existingSlugs])
  const validCategorySlugs = useMemo(
    () => new Set(categories.map((c) => c.slug).filter(Boolean)),
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
  const [isDragging, setIsDragging] = useState(false)

  const rowsWithConflicts = useMemo(() => {
    if (!fileParseResult?.ok || !fileParseResult.rows.length) return
    const rows = fileParseResult.rows.map((r) => {
      const errors = [...r.errors]
      const catSlug = r.product.categorySlug as string | undefined
      if (
        catSlug != null &&
        catSlug.trim() !== '' &&
        !validCategorySlugs.has(catSlug.trim())
      ) {
        errors.push(`Category "${catSlug}" not found`)
      }
      return {...r, errors, conflict: r.conflict as ParsedRow['conflict']}
    })
    applySlugConflicts(rows, existingSlugSet)
    return rows
  }, [fileParseResult, existingSlugSet, validCategorySlugs])

  const validRows = useMemo(() => {
    if (!rowsWithConflicts) return []
    return rowsWithConflicts.filter(
      (r) => r.errors.length === 0 && r.conflict === null,
    )
  }, [rowsWithConflicts])

  const canImport = validRows.length > 0 && title.trim().length > 0
  const uploaderEmail = user?.email ?? ''

  const processFile = useCallback((text: string, name: string) => {
    const result = parseProductsCsv(text)
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
    try {
      const result = await seedProducts({
        title: title.trim(),
        uploadedBy: uploaderEmail,
        products: products as Parameters<typeof seedProducts>[0]['products'],
      })
      if (result.errorCount > 0) {
        setImportError(
          `Imported ${result.successCount} products. ${result.errorCount} row(s) failed.`,
        )
      } else {
        setImportSuccess(`Imported ${result.successCount} product(s).`)
      }
    } catch (e) {
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

  const displayRows = rowsWithConflicts ?? fileParseResult?.rows ?? []
  const errorCount = displayRows.reduce((s, r) => s + r.errors.length, 0)
  const conflictCount = displayRows.filter((r) => r.conflict !== null).length

  return (
    <div className='flex h-full flex-col gap-6 bg-sidebar p-4 rounded-lg'>
      {/* Header */}
      <header className='space-y-1'>
        <h1 className='font-okxs text-xl tracking-tight text-foreground'>
          Product CSV Import
        </h1>
        <p className='max-w-xl text-sm text-default-500'>
          Upload a CSV in the same format as export. Preview rows, fix
          validation errors and slug conflicts, then import. Each run is signed
          by you and titled with a timestamp by default.
        </p>
      </header>

      {/* Drop zone / file picker */}
      <Card
        radius='lg'
        shadow='none'
        className={cn(
          'border-2 border-dashed transition-colors duration-200',
          isDragging
            ? 'border-primary bg-primary/5 dark:bg-primary/10'
            : 'border-default-200 hover:border-default-300 dark:border-default-100 dark:hover:border-default-200',
        )}>
        <label
          className='flex min-h-[140px] cursor-pointer flex-col items-center justify-center gap-3 p-6'
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}>
          <input
            type='file'
            accept='.csv,text/csv'
            className='hidden'
            onChange={handleFileChange}
          />
          {!fileName ? (
            <>
              <div
                className={cn(
                  'flex size-12 items-center justify-center rounded-xl transition-colors',
                  isDragging
                    ? 'bg-primary/20'
                    : 'bg-default-100 dark:bg-default-50/20',
                )}>
                <Icon
                  name='upload'
                  className={cn(
                    'size-6',
                    isDragging ? 'text-primary' : 'text-default-500',
                  )}
                />
              </div>
              <span className='text-center text-sm font-medium text-default-600 dark:text-default-400'>
                Drop CSV here or click to choose
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

      {/* Metadata */}
      {displayRows.length > 0 && (
        <Card
          radius='lg'
          shadow='none'
          className='border border-default-200/80 dark:border-default-100/50 bg-default-50/50 dark:bg-default-100/5'>
          <div className='grid grid-cols-1 gap-4 p-4 sm:grid-cols-2'>
            <Input
              label='Import title'
              placeholder='e.g. 2026-03-03T12-34-56'
              value={title}
              onValueChange={setTitle}
              description='Used for audit; default is current timestamp.'
              size='sm'
              radius='lg'
              classNames={{
                input: 'font-mono',
                inputWrapper:
                  'border border-default-200 dark:border-default-100 bg-background',
              }}
            />
            <div className='flex flex-col justify-end gap-1 rounded-lg border border-default-200 dark:border-default-100 bg-background px-3 py-2'>
              <span className='text-xs font-medium text-default-500'>
                Signed by
              </span>
              <span className='font-mono text-sm text-foreground'>
                {uploaderEmail || '—'}
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Stats + table */}
      {displayRows.length > 0 && (
        <div className='flex flex-1 min-h-0 flex-col gap-4'>
          <div className='flex flex-wrap items-center gap-2'>
            <Chip
              size='sm'
              variant='flat'
              classNames={{
                base: 'bg-default-100 dark:bg-default-100/20',
                content: 'font-medium',
              }}>
              {displayRows.length} rows
            </Chip>
            {errorCount > 0 && (
              <Chip size='sm' variant='flat' color='warning'>
                {errorCount} error{errorCount !== 1 ? 's' : ''}
              </Chip>
            )}
            {conflictCount > 0 && (
              <Chip size='sm' variant='flat' color='danger'>
                {conflictCount} conflict{conflictCount !== 1 ? 's' : ''}
              </Chip>
            )}
            {validRows.length > 0 && (
              <Chip size='sm' variant='flat' color='success'>
                {validRows.length} ready to import
              </Chip>
            )}
          </div>

          <Card
            radius='lg'
            shadow='none'
            className='flex flex-1 min-h-0 flex-col overflow-hidden border border-default-200/80 dark:border-default-100/50'>
            <ScrollShadow className='flex-1 min-h-0' hideScrollBar={false}>
              <table className='w-full text-sm'>
                <thead className='sticky top-0 z-10 bg-default-100/95 dark:bg-default-100/10 backdrop-blur supports-[backdrop-filter]:bg-default-100/80'>
                  <tr>
                    <th className='w-12 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-default-600'>
                      #
                    </th>
                    <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-default-600'>
                      Name
                    </th>
                    <th className='max-w-[180px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-default-600'>
                      Slug
                    </th>
                    <th className='max-w-[120px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-default-600'>
                      Category
                    </th>
                    <th className='w-40 min-w-[140px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-default-600'>
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-default-100 dark:divide-default-50/20'>
                  {displayRows.map((row) => (
                    <PreviewRow key={row.rowIndex} row={row} />
                  ))}
                </tbody>
              </table>
            </ScrollShadow>
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
              : 'border-success-200 bg-success-50/50 dark:border-success-900/50 dark:bg-success-950/20',
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
        </Card>
      )}

      {/* Import CTA */}
      {displayRows.length > 0 && (
        <div className='flex flex-shrink-0 items-center justify-end gap-3 border-t border-default-200 pt-4'>
          <Button
            color='primary'
            size='md'
            isDisabled={!canImport}
            isLoading={isImporting}
            onPress={handleImport}
            radius='lg'
            className='min-w-[180px] font-semibold'
            startContent={
              !isImporting ? (
                <Icon name='download' className='size-5' />
              ) : undefined
            }>
            {isImporting
              ? 'Importing…'
              : `Import ${validRows.length} product${validRows.length !== 1 ? 's' : ''}`}
          </Button>
        </div>
      )}
    </div>
  )
}

function PreviewRow({row}: {row: ParsedRow}) {
  const name = String(row.product.name ?? '—')
  const slug = String(row.product.slug ?? '—')
  const category = String(row.product.categorySlug ?? '—')
  const hasError = row.errors.length > 0 || row.conflict !== null
  return (
    <tr
      className={cn(
        'transition-colors',
        hasError
          ? 'bg-danger-50/40 dark:bg-danger-950/30 hover:bg-danger-50/60 dark:hover:bg-danger-950/40'
          : 'hover:bg-default-50/80 dark:hover:bg-default-100/10',
      )}>
      <td className='px-4 py-2.5 font-mono text-xs text-default-500'>
        {row.rowIndex}
      </td>
      <td
        className='max-w-[220px] truncate px-4 py-2.5 font-medium'
        title={name}>
        {name}
      </td>
      <td
        className='max-w-[180px] truncate px-4 py-2.5 font-mono text-xs text-default-600'
        title={slug}>
        {slug}
      </td>
      <td
        className='max-w-[120px] truncate px-4 py-2.5 text-default-600'
        title={category}>
        {category}
      </td>
      <td className='px-4 py-2.5'>
        <div className='flex flex-wrap items-center gap-1.5'>
          {row.conflict === 'slug' && (
            <Chip
              size='sm'
              variant='flat'
              color='danger'
              className='font-medium'>
              Slug conflict
            </Chip>
          )}
          {row.errors.length > 0 && (
            <ul className='list-inside list-disc space-y-0.5 text-xs text-warning-600 dark:text-warning-400'>
              {row.errors.slice(0, 2).map((e, i) => (
                <li key={i}>{e}</li>
              ))}
              {row.errors.length > 2 && <li>+{row.errors.length - 2} more</li>}
            </ul>
          )}
          {!hasError && (
            <Chip size='sm' variant='flat' color='success'>
              OK
            </Chip>
          )}
        </div>
      </td>
    </tr>
  )
}

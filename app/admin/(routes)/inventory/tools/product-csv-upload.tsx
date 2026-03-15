'use client'

import {commonInputClassNames} from '@/app/admin/_components/ui/fields'
import {JunctionBox} from '@/app/admin/_components/ui/junction-box'
import {useSidebar} from '@/app/admin/_components/ui/sidebar'
import {TabContentContainer} from '@/app/admin/_components/ui/tab-content'
import {api} from '@/convex/_generated/api'
import {useAuthCtx} from '@/ctx/auth'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Button, Card, Chip, Input} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import {useCallback, useMemo, useRef, useState} from 'react'
import {CSV_DENOM_KEYS} from '../product/csv-import/constants'
import {
  applySlugConflicts,
  defaultImportTitle,
  OMIT_FROM_IMPORT_HEADERS,
  parseProductsCsv,
  type ParsedRow,
  type ParseResult,
} from '../product/csv-import/lib'

const DEFAULT_PRODUCT_IMAGE_STORAGE_ID = 'kg24p8cjdd0rr1fnsjzspxxa1182b51r'
const DEFAULT_DENOMINATION_STOCK = 100

/** CSV column order for preview: #, ...file headers (excluding _id, _creationTime), Status */
function getPreviewColumns(
  fileParseResult: ParseResult | null,
  displayRows: ParsedRow[],
): string[] {
  const headers =
    fileParseResult?.headers ??
    (displayRows.length > 0 ? Object.keys(displayRows[0].raw) : [])
  const visible = headers.filter((h) => !OMIT_FROM_IMPORT_HEADERS.has(h))
  return ['#', ...visible, 'Status']
}

function parseDenominationMapCell(
  value: string | undefined,
): Record<string, number> {
  if (!value?.trim()) return {}

  try {
    const parsed = JSON.parse(value) as unknown
    if (parsed == null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {}
    }

    return Object.fromEntries(
      Object.entries(parsed).flatMap(([key, rawValue]) => {
        const normalizedKey = key.trim()
        const numericValue =
          typeof rawValue === 'number'
            ? rawValue
            : typeof rawValue === 'string'
              ? Number(rawValue)
              : Number.NaN

        if (!normalizedKey || !Number.isFinite(numericValue)) {
          return []
        }

        return [[normalizedKey, numericValue]]
      }),
    )
  } catch {
    return {}
  }
}

function sortDenominationKeys(keys: Iterable<string>): string[] {
  const uniqueKeys = [...new Set(Array.from(keys).map((key) => key.trim()))]
    .filter(Boolean)
    .sort((a, b) => {
      const aKnownIndex = CSV_DENOM_KEYS.indexOf(
        a as (typeof CSV_DENOM_KEYS)[number],
      )
      const bKnownIndex = CSV_DENOM_KEYS.indexOf(
        b as (typeof CSV_DENOM_KEYS)[number],
      )

      if (aKnownIndex !== -1 && bKnownIndex !== -1) {
        return aKnownIndex - bKnownIndex
      }

      const aNum = Number(a)
      const bNum = Number(b)
      if (Number.isFinite(aNum) && Number.isFinite(bNum) && aNum !== bNum) {
        return aNum - bNum
      }

      return a.localeCompare(b, undefined, {numeric: true})
    })

  return uniqueKeys
}

function seedDenominationColumnsFromMaps(
  parseResult: ParseResult,
): ParseResult {
  if (!parseResult.ok || parseResult.rows.length === 0) {
    return parseResult
  }

  const denominationKeys = new Set<string>()

  const rows = parseResult.rows.map((row) => {
    const priceByDenominationFromCell = parseDenominationMapCell(
      row.raw.priceByDenomination,
    )
    const stockByDenominationFromCell = parseDenominationMapCell(
      row.raw.stockByDenomination,
    )

    for (const key of Object.keys(priceByDenominationFromCell)) {
      denominationKeys.add(key)
    }
    for (const key of Object.keys(stockByDenominationFromCell)) {
      denominationKeys.add(key)
    }

    const nextRaw = {...row.raw}
    for (const [key, value] of Object.entries(priceByDenominationFromCell)) {
      const column = `price_${key}`
      if (!nextRaw[column]?.trim()) {
        nextRaw[column] = String(value)
      }
    }
    for (const [key, value] of Object.entries(stockByDenominationFromCell)) {
      const column = `stock_${key}`
      if (!nextRaw[column]?.trim()) {
        nextRaw[column] = String(value)
      }
    }

    const parsedProductPriceByDenomination =
      row.product.priceByDenomination != null &&
      typeof row.product.priceByDenomination === 'object' &&
      !Array.isArray(row.product.priceByDenomination)
        ? (row.product.priceByDenomination as Record<string, number>)
        : {}

    const parsedProductStockByDenomination =
      row.product.stockByDenomination != null &&
      typeof row.product.stockByDenomination === 'object' &&
      !Array.isArray(row.product.stockByDenomination)
        ? (row.product.stockByDenomination as Record<string, number>)
        : {}

    const mergedPriceByDenomination = {
      ...priceByDenominationFromCell,
      ...parsedProductPriceByDenomination,
    }
    const mergedStockByDenomination = {
      ...stockByDenominationFromCell,
      ...parsedProductStockByDenomination,
    }

    return {
      ...row,
      raw: nextRaw,
      product: {
        ...row.product,
        priceByDenomination:
          Object.keys(mergedPriceByDenomination).length > 0
            ? mergedPriceByDenomination
            : undefined,
        stockByDenomination:
          Object.keys(mergedStockByDenomination).length > 0
            ? mergedStockByDenomination
            : undefined,
      },
    }
  })

  const seededHeaders = sortDenominationKeys(denominationKeys).flatMap(
    (key) => [`price_${key}`, `stock_${key}`],
  )
  const headers = [
    ...parseResult.headers,
    ...seededHeaders.filter((header) => !parseResult.headers.includes(header)),
  ]

  return {...parseResult, headers, rows}
}

function seedDefaultImage(parseResult: ParseResult): ParseResult {
  if (!parseResult.ok || parseResult.rows.length === 0) {
    return parseResult
  }

  const rows = parseResult.rows.map((row) => {
    if (row.raw.image?.trim() || String(row.product.image ?? '').trim()) {
      return row
    }

    return {
      ...row,
      raw: {
        ...row.raw,
        image: DEFAULT_PRODUCT_IMAGE_STORAGE_ID,
      },
      product: {
        ...row.product,
        image: DEFAULT_PRODUCT_IMAGE_STORAGE_ID,
      },
    }
  })

  const headers = parseResult.headers.includes('image')
    ? parseResult.headers
    : [...parseResult.headers, 'image']

  return {...parseResult, headers, rows}
}

function seedDefaultDenominationStock(parseResult: ParseResult): ParseResult {
  if (!parseResult.ok || parseResult.rows.length === 0) {
    return parseResult
  }

  const rows = parseResult.rows.map((row) => {
    if (
      row.product.inventoryMode === 'shared' ||
      row.product.inventoryMode === 'shared_weight'
    ) {
      return row
    }

    const parsedProductStockByDenomination =
      row.product.stockByDenomination != null &&
      typeof row.product.stockByDenomination === 'object' &&
      !Array.isArray(row.product.stockByDenomination)
        ? (row.product.stockByDenomination as Record<string, number>)
        : {}

    const nextRaw = {...row.raw}
    const nextStockByDenomination = {...parsedProductStockByDenomination}

    for (const key of CSV_DENOM_KEYS) {
      const column = `stock_${key}`
      const rawValue = nextRaw[column]?.trim()

      if (!rawValue) {
        nextRaw[column] = String(DEFAULT_DENOMINATION_STOCK)
      }

      if (nextStockByDenomination[key] === undefined) {
        nextStockByDenomination[key] = DEFAULT_DENOMINATION_STOCK
      }
    }

    return {
      ...row,
      raw: nextRaw,
      product: {
        ...row.product,
        stockByDenomination: nextStockByDenomination,
      },
    }
  })

  const headers = [
    ...parseResult.headers,
    ...CSV_DENOM_KEYS.map((key) => `stock_${key}`).filter(
      (header) => !parseResult.headers.includes(header),
    ),
  ]

  return {...parseResult, headers, rows}
}

export function ProductCsvUpload() {
  const {user} = useAuthCtx()
  const existingSlugsData = useQuery(api.products.q.listProductSlugs)
  const categoriesData = useQuery(api.categories.q.listCategories)
  const existingSlugs = useMemo(
    () => existingSlugsData ?? [],
    [existingSlugsData],
  )
  const categories = useMemo(() => categoriesData ?? [], [categoriesData])
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
  const fileInputRef = useRef<HTMLInputElement>(null)

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
        setFileParseResult(null)
        setFileName(null)
        setTitle('')
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
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
  const {open: sidebarOpen} = useSidebar()

  return (
    <TabContentContainer
      title='Product CSV Import'
      description='Upload a CSV in the same format as export. Preview rows, fix
                validation errors and slug conflicts, then import. Each run is signed
                by you and titled with a timestamp by default.'
      className={cn(
        'flex h-full min-w-0 md:max-w-[calc(95lvw)] flex-col gap-6 overflow-hidden bg-sidebar p-4 rounded-lg',
        {'md:max-w-[85lvw]': sidebarOpen},
      )}
      extraHeader={
        fileName ? (
          <div className='font-ios text-blue-500 px-4 py-1 rounded-sm bg-blue-400/10'>
            {fileName}
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
                  <span className='inline-flex h-10 items-center justify-center rounded-sm dark:bg-white bg-sidebar dark:text-dark-table/70 px-8 text-sm font-semibold tracking-wide'>
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
            className='min-w-0 max-w-full p-0 bg-transparent'>
            <div className='grid min-w-0 max-w-full grid-cols-1 gap-4 md:grid-cols-4'>
              <div className='col-span-3 min-w-0 max-w-full'>
                <Input
                  label='Upload title'
                  placeholder='e.g. 2026-03-03T12-34-56'
                  value={title}
                  onValueChange={setTitle}
                  // description='Used for audit; default is current timestamp.'
                  size='sm'
                  radius='lg'
                  className='w-5xl min-w-0 max-w-full'
                  classNames={{
                    ...commonInputClassNames,
                    base: 'w-full min-w-0 max-w-full',
                  }}
                />
              </div>
              <JunctionBox
                title={uploaderEmail.split('@')[0]}
                description='Signer'
                onUpdate={() => ({})}
                checked={false}
                className='max-h-18 bg-white dark:bg-background/60'
              />
              {/*<div className='flex flex-col gap-1 rounded-lg border border-default-200 dark:border-default-100 bg-background px-3 py-2'>
              <span className='text-xs font-medium text-default-500'>
                Signed by
              </span>
              <span className='font-mono text-sm text-foreground'>
                {uploaderEmail || '—'}
              </span>
            </div>*/}
            </div>
          </Card>
        )}

        {/* Stats + table */}
        {displayRows.length > 0 && (
          <div className='flex min-w-0 max-w-[82lvw] shrink-0 flex-col gap-4 overflow-hidden font-clash'>
            <div className='flex flex-wrap items-center justify-between gap-3 capitalize'>
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
                  <Chip
                    radius='none'
                    size='sm'
                    variant='flat'
                    color='warning'
                    className='rounded-sm'>
                    <span className='px-1.5'>{errorCount}</span> error
                    {errorCount !== 1 ? 's' : ''}
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
              <Button
                color='primary'
                size='sm'
                isDisabled={!canImport}
                isLoading={isImporting}
                onPress={handleImport}
                radius='lg'
                className='min-w-[181.1px] font-semibold'
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

            <Card
              radius='lg'
              shadow='none'
              className='flex h-[min(55vh,480px)] min-h-50 min-w-0 max-w-full flex-col overflow-hidden border border-default-200/80 dark:border-default-100/50'>
              <div className='min-h-0 w-full flex-1 overflow-x-auto overflow-y-auto'>
                <table className='min-w-full table-fixed text-sm'>
                  <thead className='sticky top-0 z-10 bg-default-100/95 dark:bg-default-100/10 backdrop-blur supports-backdrop-filter:bg-default-100/80'>
                    <tr>
                      {getPreviewColumns(fileParseResult, displayRows).map(
                        (col) => (
                          <th
                            key={col}
                            className='max-w-35 truncate whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest opacity-60'>
                            {col}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-default-100 dark:divide-default-50/20'>
                    {displayRows.map((row) => (
                      <PreviewRow
                        key={row.rowIndex}
                        row={row}
                        columns={getPreviewColumns(
                          fileParseResult,
                          displayRows,
                        )}
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
        {displayRows.length > 0 && <div className='h-px shrink-0' />}
      </div>
    </TabContentContainer>
  )
}

function PreviewRow({row, columns}: {row: ParsedRow; columns: string[]}) {
  const hasError = row.errors.length > 0 || row.conflict !== null
  return (
    <tr
      className={cn(
        'transition-colors',
        hasError
          ? 'bg-danger-50/40 dark:bg-danger-950/30 hover:bg-danger-50/60 dark:hover:bg-danger-950/40'
          : 'max-w-5xl hover:bg-default-50/80 dark:hover:bg-default-100/10',
      )}>
      {columns.map((col) => {
        if (col === '#') {
          return (
            <td
              key={col}
              className='sticky left-0 z-1 whitespace-nowrap bg-inherit px-4 py-2.5 font-mono text-xs text-default-500'>
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
                  <ul className='hidden list-inside list-disc space-y-0.5 text-xs text-warning-600 dark:text-warning-400'>
                    {row.errors.slice(0, 2).map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                    {row.errors.length > 2 && (
                      <li>+{row.errors.length - 2} more</li>
                    )}
                  </ul>
                )}
                {!hasError && (
                  <Chip size='sm' variant='flat' color='success'>
                    OK
                  </Chip>
                )}
              </div>
            </td>
          )
        }
        const value = row.raw[col] ?? '—'
        const display = String(value).trim() || '—'
        return (
          <td
            key={col}
            className='max-w-35 truncate whitespace-nowrap px-4 py-2.5 text-default-600'
            title={display}>
            {display}
          </td>
        )
      })}
    </tr>
  )
}

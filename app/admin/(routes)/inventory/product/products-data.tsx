'use client'

import type {TableToolbarContext} from '@/components/table-v2'
import {DataTable} from '@/components/table-v2'
import {
  formatText,
  HoverCell,
  linkText,
  textCell,
  toggleCell,
} from '@/components/table-v2/cells-v2'
import {ColumnConfig} from '@/components/table-v2/create-column'
import {ColHeader} from '@/components/table-v2/headers'
import {api} from '@/convex/_generated/api'
import {Doc} from '@/convex/_generated/dataModel'
import type {ProductType} from '@/convex/products/d'
import {useSaveAdminProductFormReturn} from '@/hooks/use-save-admin-product-form-return'
import {Icon} from '@/lib/icons'
import {formatTimestamp} from '@/utils/date'
import {formatPrice} from '@/utils/formatPrice'
import {Button, Dropdown} from '@heroui/react'
import {CellContext} from '@tanstack/react-table'
import {useMutation, useQuery} from 'convex/react'
import Link from 'next/link'
import {useCallback, useMemo} from 'react'
import {CSV_DENOM_KEYS, PRODUCT_CSV_FIELDS} from './csv-import/constants'
import {
  getProductTierOptionsByCategory,
  mapNumericFractions,
} from './product-schema'

function escapeCsvValue(value: unknown): string {
  const s = value === null || value === undefined ? '' : String(value)
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function serializeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'number') return String(value)
  if (typeof value === 'string') return escapeCsvValue(value)
  return escapeCsvValue(JSON.stringify(value))
}

function normalizeInventoryModeForCsv(value: unknown) {
  if (value === 'shared' || value === 'shared_weight') {
    return 'shared'
  }
  return value
}

function exportProductsToCsv(
  products: Doc<'products'>[],
  filenamePrefix = 'products',
) {
  const denomHeaders = CSV_DENOM_KEYS.flatMap((k) => [
    `price_${k}`,
    `stock_${k}`,
  ])
  const headers = [...PRODUCT_CSV_FIELDS, ...denomHeaders]
  const rows = products.map((p) => {
    const record = p as Record<string, unknown>
    const mainCells = PRODUCT_CSV_FIELDS.map((h) =>
      serializeCsvCell(
        h === 'inventoryMode'
          ? normalizeInventoryModeForCsv(record[h])
          : record[h],
      ),
    )
    const priceByDenom =
      (record.priceByDenomination as Record<string, number> | undefined) ?? {}
    const stockByDenom =
      (record.stockByDenomination as Record<string, number> | undefined) ?? {}
    const denomCells = CSV_DENOM_KEYS.flatMap((k) => [
      serializeCsvCell(priceByDenom[k]),
      serializeCsvCell(stockByDenom[k]),
    ])
    return [...mainCells, ...denomCells].join(',')
  })
  const headerRow = headers.join(',')
  const csv = [headerRow, ...rows].join('\r\n')
  const blob = new Blob([csv], {type: 'text/csv;charset=utf-8'})
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filenamePrefix}-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function parseStockValue(value: unknown) {
  const stock =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number(value)
        : Number.NaN
  return Number.isFinite(stock) ? stock : Number.POSITIVE_INFINITY
}

function getStockClasses(stock: number) {
  if (!Number.isFinite(stock) || stock <= 0) {
    return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-200 dark:border-red-900/50'
  }
  if (stock <= 3) {
    return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950/40 dark:text-orange-200 dark:border-orange-900/50'
  }
  if (stock <= 9) {
    return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-900/50'
  }
  return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-900/50'
}

function availableDenominationsCell(
  ctx: CellContext<Doc<'products'>, unknown>,
) {
  const row = ctx.row.original
  const denoms = row.availableDenominations ?? []
  const priceByDenom = row.priceByDenomination ?? {}
  const stockByDenom = row.stockByDenomination ?? {}
  // const sortedDenoms = [...denoms].sort((a, b) => {
  //   const stockA = parseStockValue(stockByDenom[String(a)])
  //   const stockB = parseStockValue(stockByDenom[String(b)])
  //   if (stockA === stockB) return a - b
  //   return stockA - stockB
  // })

  if (denoms.length === 0) {
    return <span className='font-brk text-sm opacity-60'>····</span>
  }

  return (
    <div className='font-brk text-sm flex items-center whitespace-nowrap gap-x-1 gap-y-0.5 px-4'>
      {denoms.map((denom: number, index: number) => {
        const key = String(denom)
        const label = mapNumericFractions[key] ?? key
        const price = priceByDenom[key]
        const stock = stockByDenom[key]
        const parsedStock = parseStockValue(stock)
        const stockClasses = getStockClasses(parsedStock)
        const content = (
          <div className='space-y-1 text-sm'>
            {/*<div className='font-medium'>{label}</div>*/}
            {price != null && <div>Price: {formatPrice(price)}</div>}
            {stock != null && <div>Stock: {Number(stock).toFixed(0)}</div>}
            {price == null && stock == null && (
              <div className='text-muted-foreground'>No price/stock data</div>
            )}
          </div>
        )
        return (
          <span key={`${key}-${index}`}>
            <HoverCell label={label} content={content}>
              <div
                className={`px-2 font-brk text-base flex items-center space-x-3 border rounded-sm ${stockClasses}`}>
                {label === '⅛' && (
                  <Icon
                    name='8th'
                    className='size-5 text-purple-600 dark:text-indigo-400'
                  />
                )}
                {label === '¼' && (
                  <Icon
                    name='4th'
                    className='size-5 text-orange-600 dark:text-orange-400'
                  />
                )}
                {label === '½' && (
                  <Icon name='half' className='size-5 text-lime-600' />
                )}
                {Number(label) >= 1 && <span className='min-w-5'>{label}</span>}
                <span className='w-8 font-okxs text-lg text-center bg-white/30 dark:bg-black/20 rounded-sm'>
                  {stock != null && Number(stock).toFixed(0)}
                </span>
              </div>
            </HoverCell>
            {/*{Number(label) > 1 && < denoms.length - 1 ? ' ' : null}*/}
          </span>
        )
      })}
    </div>
  )
}

function masterStockCell(ctx: CellContext<Doc<'products'>, unknown>) {
  const {masterStockQuantity, masterStockUnit} = ctx.row.original

  if (masterStockQuantity == null) {
    return <span className='font-brk text-sm opacity-60'>····</span>
  }

  const quantity = Number.isInteger(masterStockQuantity)
    ? String(masterStockQuantity)
    : String(Number(masterStockQuantity.toFixed(3)))
  const unit = masterStockUnit?.trim()

  return (
    <span className='font-ios text-sm'>
      {quantity} {unit && <span className='text-xs'>{unit}</span>}
    </span>
  )
}

function getUniqueFilterOptions(
  values: Iterable<string | null | undefined>,
): string[] {
  return [
    ...new Set(
      Array.from(values, (value) => value?.trim()).filter(
        (value): value is string =>
          typeof value === 'string' && value.length > 0,
      ),
    ),
  ].sort((a, b) => a.localeCompare(b))
}

// function noseRatingCell(ctx: CellContext<Doc<'products'>, unknown>) {
//   const rawValue = ctx.row.original.noseRating
//   const value =
//     typeof rawValue === 'number' && Number.isFinite(rawValue)
//       ? Math.max(0, Math.min(10, Math.round(rawValue)))
//       : 0

//   return (
//     <div className='flex items-center justify-center'>
//       <Slider
//         aria-label='Nose rating'
//         orientation='vertical'
//         minValue={0}
//         maxValue={10}
//         step={1}
//         value={value}
//         isDisabled
//         hideValue
//         size='sm'
//         classNames={{
//           base: 'h-16 w-6',
//         }}
//       />
//     </div>
//   )
// }

interface ProductsDataProps {
  data: Doc<'products'>[] | undefined
  title?: string
  exportFilePrefix?: string
  loading?: boolean
  defaultLoadedCount?: number
  canLoadMore?: boolean
  isLoadingMore?: boolean
  onLoadMore?: VoidFunction
  loadMoreLabel?: string
}

const toBulkEditableProductFields = (
  updates: Partial<Doc<'products'>>,
): ProductType => {
  const fields: ProductType = {}

  if (updates.name !== undefined) {
    fields.name = updates.name
  }
  if (updates.categorySlug !== undefined) {
    fields.categorySlug = updates.categorySlug
  }
  if (updates.tier !== undefined) {
    fields.tier = updates.tier
  }
  if (updates.available !== undefined) {
    fields.available = updates.available
  }
  if (updates.eligibleForDeals !== undefined) {
    fields.eligibleForDeals = updates.eligibleForDeals
  }
  if (updates.featured !== undefined) {
    fields.featured = updates.featured
  }
  if (updates.eligibleForRewards !== undefined) {
    fields.eligibleForRewards = updates.eligibleForRewards
  }
  if (updates.onSale !== undefined) {
    fields.onSale = updates.onSale
  }
  if (updates.limited !== undefined) {
    fields.limited = updates.limited
  }
  if (updates.eligibleForUpgrade !== undefined) {
    fields.eligibleForUpgrade = updates.eligibleForUpgrade
  }
  if (updates.packagingMode !== undefined) {
    fields.packagingMode = updates.packagingMode
  }
  if (updates.masterStockQuantity !== undefined) {
    fields.masterStockQuantity = updates.masterStockQuantity
  }
  if (updates.lineage !== undefined) {
    fields.lineage = updates.lineage
  }
  if (updates.noseRating !== undefined) {
    fields.noseRating = updates.noseRating
  }

  return fields
}

export const ProductsData = ({
  data,
  title = 'Products',
  exportFilePrefix = 'products',
  loading,
  defaultLoadedCount = 100,
  canLoadMore = false,
  isLoadingMore = false,
  onLoadMore,
  loadMoreLabel = 'Load more',
}: ProductsDataProps) => {
  const saveAdminProductFormReturn = useSaveAdminProductFormReturn()
  const categories = useQuery(api.categories.q.listCategories)
  const archiveProduct = useMutation(api.products.m.archiveProduct)
  const updateProduct = useMutation(api.products.m.updateProduct)
  const safeData = useMemo(() => data ?? [], [data])
  // const leadImageStorageIds = useMemo(
  //   () => [
  //     ...new Set(
  //       safeData.flatMap((product) => (product.image ? [product.image] : [])),
  //     ),
  //   ],
  //   [safeData],
  // )
  // const optimizedLeadImageIds = useQuery(
  //   api.files.upload.getTaggedStorageIds,
  //   leadImageStorageIds.length > 0
  //     ? {
  //         storageIds: leadImageStorageIds,
  //         requiredTag: 'gallery:optimized',
  //       }
  //     : 'skip',
  // )
  // const optimizedStorageIds = useMemo(() => {
  //   const ids = new Set<string>()

  //   for (const storageId of optimizedLeadImageIds ?? []) {
  //     ids.add(String(storageId))
  //   }

  //   return ids
  // }, [optimizedLeadImageIds])
  const categorySlugs = useMemo(
    () =>
      (categories ?? [])
        .map((c) => c.slug)
        .filter((s): s is string => typeof s === 'string' && s.length > 0),
    [categories],
  )
  const brandFilterOptions = useMemo(
    () => getUniqueFilterOptions(safeData.flatMap((product) => product.brand)),
    [safeData],
  )
  const subcategoryFilterOptions = useMemo(
    () =>
      getUniqueFilterOptions(safeData.map((product) => product.subcategory)),
    [safeData],
  )
  const productTypeFilterOptions = useMemo(
    () =>
      getUniqueFilterOptions(safeData.map((product) => product.productType)),
    [safeData],
  )
  const columns = useMemo(
    () =>
      [
        {
          id: '_id',
          header: <ColHeader tip='ID' symbol='ID' className='w-12' left />,
          accessorKey: '_id',
          cell: ({row}) => {
            const productId = row.original._id

            return (
              <Link
                href={`/admin/inventory/product/${productId}`}
                onClick={saveAdminProductFormReturn}
                className='font-brk text-sm tracking-wide uppercase hover:underline underline-offset-4 decoration-dotted text-mac-blue dark:text-blue-400'>
                {productId.substring(28)}
              </Link>
            )
          },
          size: 80,
          enableFiltering: false,
        },
        {
          id: 'name',
          header: 'Name',
          accessorKey: 'name',
          cell: textCell('name'),
          size: 200,
          enableFiltering: false,
        },
        {
          id: 'categorySlug',
          header: <ColHeader tip='Category' symbol='cat' />,
          accessorKey: 'categorySlug',
          cell: linkText('categorySlug', '/admin/inventory/category/'),
          size: 100,
          meta: {filterOptions: categorySlugs},
        },
        {
          id: 'tier',
          header: <ColHeader tip='Tier Class' symbol='tier' center />,
          accessorKey: 'tier',
          cell: textCell('tier', 'text-center uppercase'),
          size: 64,
          meta: {
            bulkEditor: {
              type: 'select',
              options: (rows: Doc<'products'>[]) => {
                const uniqueCategorySlugs = [
                  ...new Set(
                    rows
                      .map((row) => row.categorySlug)
                      .filter(
                        (slug): slug is string =>
                          typeof slug === 'string' && slug.length > 0,
                      ),
                  ),
                ]

                return uniqueCategorySlugs.flatMap((slug) =>
                  getProductTierOptionsByCategory(slug, categories ?? []),
                )
              },
            },
          },
        },
        {
          id: 'brand',
          header: <ColHeader tip='Brand' symbol='Brand' />,
          accessorKey: 'brand',
          cell: textCell('brand', 'text-xs uppercase'),
          size: 100,
          meta: {filterOptions: brandFilterOptions},
        },
        {
          id: 'subcategory',
          header: <ColHeader tip='Subcategory' symbol='Subcat' />,
          accessorKey: 'subcategory',
          cell: textCell('subcategory', 'text-xs uppercase'),
          size: 100,
          meta: {filterOptions: subcategoryFilterOptions},
        },
        {
          id: 'productType',
          header: <ColHeader tip='Product Type' symbol='Type' />,
          accessorKey: 'productType',
          cell: textCell('productType', 'text-xs uppercase'),
          size: 100,
          meta: {filterOptions: productTypeFilterOptions},
        },
        // {
        //   id: 'leadImageOptimized',
        //   header: (
        //     <ColHeader
        //       tip='Lead Image in Optimized Gallery'
        //       symbol={
        //         <Icon name='image-bold' className='size-5 text-indigo-700' />
        //       }
        //       center
        //     />
        //   ),
        //   accessorKey: 'image',
        //   cell: ({row}) => {
        //     const imageId = row.original.image

        //     if (!imageId || optimizedLeadImageIds === undefined) {
        //       return (
        //         <div className='text-center font-brk text-sm opacity-60'>
        //           ····
        //         </div>
        //       )
        //     }

        //     return (
        //       <div className='flex items-center justify-center'>
        //         {optimizedStorageIds.has(String(imageId)) ? (
        //           <Icon
        //             name='checkbox-checked'
        //             className='size-5 text-indigo-500'
        //           />
        //         ) : null}
        //       </div>
        //     )
        //   },
        //   size: 56,
        //   enableFiltering: false,
        // },
        {
          id: 'available',
          header: <ColHeader tip='Available' symbol='avl' center />,
          accessorKey: 'available',
          cell: toggleCell('available', api.products.m.toggleAvailability, {
            values: [true, false],
            getMutationArgs: (row, newValue) => ({
              productId: row._id,
              available: newValue,
            }),
          }),
          size: 40,
        },
        {
          id: 'eligibleForDeals',
          header: <ColHeader tip='Deals' symbol='deal' center />,
          accessorKey: 'eligibleForDeals',
          cell: toggleCell('eligibleForDeals', api.products.m.toggleDeals, {
            values: [true, false],
            getMutationArgs: (row, newValue) => ({
              productId: row._id,
              deals: newValue,
            }),
          }),
          size: 40,
        },
        {
          id: 'featured',
          header: <ColHeader tip='Featured Product' symbol='feat' center />,
          accessorKey: 'featured',
          cell: toggleCell('featured', api.products.m.toggleFeatured, {
            values: [true, false],
            getMutationArgs: (row, newValue) => ({
              productId: row._id,
              featured: newValue,
            }),
          }),
          size: 40,
        },
        {
          id: 'eligibleForRewards',
          header: <ColHeader tip='Eligible for Rewards' symbol='rwds' center />,
          accessorKey: 'eligibleForRewards',
          cell: toggleCell(
            'eligibleForRewards',
            api.products.m.toggleRewardEligibility,
            {
              values: [true, false],
              getMutationArgs: (row, newValue) => ({
                productId: row._id,
                eligibleForRewards: newValue,
              }),
            },
          ),
          size: 40,
        },
        {
          id: 'onSale',
          header: <ColHeader tip='On-Sale Product' symbol='Sale' center />,
          accessorKey: 'onSale',
          cell: toggleCell('onSale', api.products.m.toggleOnSale, {
            values: [true, false],
            getMutationArgs: (row, newValue) => ({
              productId: row._id,
              onSale: newValue,
            }),
          }),
          size: 40,
        },
        // {
        //   id: 'limited',
        //   header: <ColHeader tip='Limited Quantity' symbol='ltd' center />,
        //   accessorKey: 'limited',
        //   cell: toggleCell('limited', api.products.m.toggleLimited, {
        //     values: [true, false],
        //     colors: ['primary', 'default'],
        //     getMutationArgs: (row, newValue) => ({
        //       productId: row._id,
        //       limited: newValue,
        //     }),
        //   }),
        //   size: 40,
        // },
        {
          id: 'eligibleForUpgrade',
          header: <ColHeader tip='Upgradable' symbol='upgr' center />,
          accessorKey: 'eligibleForUpgrade',
          cell: toggleCell(
            'eligibleForUpgrade',
            api.products.m.toggleUpgradeEligibility,
            {
              values: [true, false],
              getMutationArgs: (row, newValue) => ({
                productId: row._id,
                eligibleForUpgrade: newValue,
              }),
            },
          ),
          size: 40,
        },
        {
          id: 'availableDenominations',
          header: (
            <ColHeader
              tip='Available Denominations'
              symbol='Denominations'
              className='pl-4'
            />
          ),
          accessorKey: 'availableDenominations',
          cell: availableDenominationsCell,
          size: 400,
        },
        {
          id: 'packagingMode',
          header: <ColHeader tip='Packaging Mode' symbol='Packaging' />,
          accessorKey: 'packagingMode',
          cell: textCell('packagingMode', 'uppercase text-xs'),
          size: 140,
          meta: {
            bulkEditor: {
              type: 'select',
              options: [
                {value: 'bulk', label: 'Bulk'},
                {value: 'prepack', label: 'Prepack'},
              ],
            },
          },
        },
        {
          id: 'masterStock',
          header: <ColHeader tip='Stock Count' symbol='Stock' />,
          accessorKey: 'masterStockQuantity',
          cell: masterStockCell,
          size: 140,
          enableFiltering: false,
        },
        {
          id: 'lineage',
          header: (
            <ColHeader tip='Lineage' symbol='Lineage' className='w-20' center />
          ),
          accessorKey: 'lineage',
          cell: (ctx) => {
            const lineage = ctx.row.original.lineage?.trim()

            if (!lineage) {
              return (
                <div className='text-center font-brk text-sm opacity-60'>
                  ····
                </div>
              )
            }

            return (
              <HoverCell
                label={<Icon name='t' className='size-5 text-terpenes' />}
                content={
                  <div className='max-w-64 whitespace-pre-wrap text-sm text-foreground'>
                    {lineage}
                  </div>
                }>
                <div className='text-center font-ios text-xs uppercase text-mac-blue dark:text-blue-400'>
                  view
                </div>
              </HoverCell>
            )
          },
          size: 100,
        },
        {
          id: 'noseRating',
          header: (
            <ColHeader
              tip='Nose Rating'
              symbol='Nose'
              className='w-20'
              center
            />
          ),
          accessorKey: 'noseRating',
          cell: formatText('noseRating', (v) => v, 'text-center'),
          size: 80,
        },
        {
          id: 'createdAt',
          header: <ColHeader tip='Last Updated' symbol='Updated' />,
          accessorKey: '_creationTime',
          size: 180,
          enableFiltering: false,
          cell: ({row}) => (
            <span className='whitespace-nowrap font-ios text-xs'>
              {formatTimestamp(row.original._creationTime)}
            </span>
          ),
        },
      ] as ColumnConfig<Doc<'products'>>[],
    [
      brandFilterOptions,
      categories,
      categorySlugs,
      // optimizedLeadImageIds,
      // optimizedStorageIds,
      productTypeFilterOptions,
      saveAdminProductFormReturn,
      subcategoryFilterOptions,
    ],
  )

  const ExportCsvToolbar = useCallback(
    (context: TableToolbarContext<Doc<'products'>>) => {
      return (
        <div className='flex items-center gap-2'>
          <span className='text-xs font-brk uppercase tracking-tight text-foreground/55'>
            {safeData.length} loaded
          </span>
          {onLoadMore && (canLoadMore || isLoadingMore) && (
            <Button
              size='sm'
              variant='tertiary'
              isDisabled={isLoadingMore}
              onPress={onLoadMore}
              className='rounded-sm min-w-0 gap-1.5 font-brk'>
              {isLoadingMore ? 'Loading...' : loadMoreLabel}
            </Button>
          )}
          <Dropdown>
            <Dropdown.Trigger>
              <Button
                size='sm'
                variant='tertiary'
                className='rounded-sm bg-sidebar/60 min-w-0 gap-1.5 font-brk portrait:aspect-square'>
                <Icon name='download' className='size-3 m-auto' />
                <span className='hidden sm:inline'>Export CSV</span>
                <Icon name='chevron-down' className='size-4 md:flex hidden' />
              </Button>
            </Dropdown.Trigger>
            <Dropdown.Popover>
              <Dropdown.Menu aria-label='Export CSV options'>
                <Dropdown.Item
                  id='all'
                  onPress={() =>
                    exportProductsToCsv(safeData, exportFilePrefix)
                  }>
                  {canLoadMore || isLoadingMore
                    ? 'Export loaded'
                    : 'Export all'}
                </Dropdown.Item>
                <Dropdown.Item
                  id='current'
                  onPress={() =>
                    exportProductsToCsv(
                      context.getFilteredData(),
                      exportFilePrefix,
                    )
                  }>
                  Export current list
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        </div>
      )
    },
    [
      canLoadMore,
      exportFilePrefix,
      isLoadingMore,
      loadMoreLabel,
      onLoadMore,
      safeData,
    ],
  )
  const handleArchiveSelected = useCallback(
    async (ids: string[]) => {
      await Promise.all(
        ids.map((productId) =>
          archiveProduct({
            productId: productId as Parameters<
              typeof archiveProduct
            >[0]['productId'],
          }),
        ),
      )
    },
    [archiveProduct],
  )

  const handleBulkUpdateSelected = useCallback(
    async ({
      rows,
      updates,
    }: {
      ids: string[]
      rows: Doc<'products'>[]
      updates: Partial<Doc<'products'>>
    }) => {
      const fields = toBulkEditableProductFields(updates)
      if (Object.keys(fields).length === 0) {
        return
      }

      await Promise.all(
        rows.map((row) =>
          updateProduct({
            id: row._id,
            fields,
          }),
        ),
      )
    },
    [updateProduct],
  )

  return (
    <div className='relative w-full max-w-full overflow-hidden'>
      <DataTable
        title={title}
        data={safeData}
        loading={loading ?? !data}
        columnConfigs={columns}
        editingRowId={null}
        defaultPageSize={25}
        defaultLoadedCount={defaultLoadedCount}
        loadedCountParamKey='loaded'
        rightToolbarLeft={ExportCsvToolbar}
        deleteIdAccessor='_id'
        deleteActionLabel='Delete Selected'
        onDeleteSelected={handleArchiveSelected}
        onBulkUpdateSelected={handleBulkUpdateSelected}
      />
    </div>
  )
}

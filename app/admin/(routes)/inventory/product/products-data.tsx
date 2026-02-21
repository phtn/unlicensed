'use client'

import {DataTable} from '@/components/table-v2'
import {
  HoverCell,
  linkText,
  textCell,
  toggleCell,
} from '@/components/table-v2/cells-v2'
import {ColumnConfig} from '@/components/table-v2/create-column'
import {ColHeader} from '@/components/table-v2/headers'
import {api} from '@/convex/_generated/api'
import {Doc} from '@/convex/_generated/dataModel'
import {Icon} from '@/lib/icons'
import {formatPrice} from '@/utils/formatPrice'
import {Button, Slider} from '@heroui/react'
import {CellContext} from '@tanstack/react-table'
import {useMemo} from 'react'
import {mapNumericFractions} from './product-schema'

function escapeCsvValue(value: unknown): string {
  const s = value === null || value === undefined ? '' : String(value)
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function exportProductsToCsv(products: Doc<'products'>[]) {
  const headers = [
    '_id',
    'name',
    'categorySlug',
    'tier',
    'available',
    'eligibleForDeals',
    'featured',
    'eligibleForRewards',
    'onSale',
    'limited',
    'eligibleForUpgrade',
    'lineage',
    'noseRating',
  ]
  const rows = products.map((p) =>
    headers
      .map((h) => escapeCsvValue((p as Record<string, unknown>)[h]))
      .join(','),
  )
  const csv = [headers.join(','), ...rows].join('\r\n')
  const blob = new Blob([csv], {type: 'text/csv;charset=utf-8'})
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `products-${new Date().toISOString().slice(0, 10)}.csv`
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
  const sortedDenoms = [...denoms].sort((a, b) => {
    const stockA = parseStockValue(stockByDenom[String(a)])
    const stockB = parseStockValue(stockByDenom[String(b)])
    if (stockA === stockB) return a - b
    return stockA - stockB
  })

  if (denoms.length === 0) {
    return <span className='font-brk text-sm opacity-60'>····</span>
  }

  return (
    <div className='font-brk text-sm flex items-center whitespace-nowrap gap-x-1 gap-y-0.5 px-4'>
      {denoms.map((denom, index) => {
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

function noseRatingCell(ctx: CellContext<Doc<'products'>, unknown>) {
  const rawValue = ctx.row.original.noseRating
  const value =
    typeof rawValue === 'number' && Number.isFinite(rawValue)
      ? Math.max(0, Math.min(10, Math.round(rawValue)))
      : 0

  return (
    <div className='flex items-center justify-center'>
      <Slider
        aria-label='Nose rating'
        orientation='vertical'
        minValue={0}
        maxValue={10}
        step={1}
        value={value}
        isDisabled
        hideValue
        size='sm'
        classNames={{
          base: 'h-16 w-6',
        }}
      />
    </div>
  )
}

interface ProductsDataProps {
  data: Doc<'products'>[] | undefined
}
export const ProductsData = ({data}: ProductsDataProps) => {
  const columns = useMemo(
    () =>
      [
        {
          id: '_id',
          header: () => (
            <div className='w-full flex items-center space-x-1'>
              <span>ID</span>
              <Icon name='pencil-fill' className='size-4' />
            </div>
          ),
          accessorKey: '_id',
          size: 60,
          cell: linkText('_id', `/admin/inventory/product/`, (v) =>
            v.substring(28),
          ),
        },
        {
          id: 'name',
          header: 'Name',
          accessorKey: 'name',
          cell: textCell('name'),
          size: 200,
        },
        {
          id: 'categorySlug',
          header: <ColHeader tip='Category' symbol='cat' />,
          accessorKey: 'categorySlug',
          cell: linkText('categorySlug', '/admin/inventory/category/'),
          size: 100,
        },
        {
          id: 'tier',
          header: <ColHeader tip='Tier Class' symbol='tier' center />,
          accessorKey: 'tier',
          cell: textCell('tier', 'text-center uppercase'),
          size: 64,
        },
        {
          id: 'available',
          header: <ColHeader tip='Available' symbol='avl' center />,
          accessorKey: 'available',
          cell: toggleCell('available', api.products.m.toggleAvailability, {
            values: [true, false],
            colors: ['primary', 'default'],
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
            colors: ['primary', 'default'],
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
            colors: ['primary', 'default'],
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
              colors: ['primary', 'default'],
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
            colors: ['primary', 'default'],
            getMutationArgs: (row, newValue) => ({
              productId: row._id,
              onSale: newValue,
            }),
          }),
          size: 40,
        },
        {
          id: 'limited',
          header: <ColHeader tip='Limited Quantity' symbol='ltd' center />,
          accessorKey: 'limited',
          cell: toggleCell('limited', api.products.m.toggleLimited, {
            values: [true, false],
            colors: ['primary', 'default'],
            getMutationArgs: (row, newValue) => ({
              productId: row._id,
              limited: newValue,
            }),
          }),
          size: 40,
        },
        {
          id: 'eligibleForUpgrade',
          header: <ColHeader tip='Upgradable' symbol='upgr' center />,
          accessorKey: 'eligibleForUpgrade',
          cell: toggleCell(
            'eligibleForUpgrade',
            api.products.m.toggleUpgradeEligibility,
            {
              values: [true, false],
              colors: ['primary', 'default'],
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
          size: 480,
        },

        {
          id: 'lineage',
          header: <ColHeader tip='Lineage' symbol='Lineage' />,
          accessorKey: 'lineage',
          cell: textCell('lineage'),
        },
        {
          id: 'noseRating',
          header: (
            <ColHeader tip='Nose Rating' symbol='Nose' className='pr-4' />
          ),
          accessorKey: 'noseRating',
          cell: textCell('noseRating'),
          size: 40,
        },
        // {
        //   id: 'createdAt',
        //   header: 'Created',
        //   accessorKey: 'createdAt',
        // },
      ] as ColumnConfig<Doc<'products'>>[],
    [],
  )

  const exportButton = useMemo(
    () => (
      <Button
        size='sm'
        radius='none'
        variant='flat'
        className='rounded-sm bg-sidebar/60 min-w-0 gap-1.5 font-brk'
        onPress={() => exportProductsToCsv(data ?? [])}>
        <Icon name='download' className='size-4' />
        <span className='hidden sm:inline'>Export CSV</span>
      </Button>
    ),
    [data],
  )

  return (
    <div className='relative w-full max-w-full overflow-hidden'>
      {data && (
        <DataTable
          title={'Products'}
          data={data}
          loading={!data}
          columnConfigs={columns}
          editingRowId={null}
          rightToolbarLeft={exportButton}
        />
      )}
    </div>
  )
}

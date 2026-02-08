'use client'

import {mapNumericFractions} from '@/app/admin/_components/product-schema'
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
import {CellContext} from '@tanstack/react-table'
import {useMemo} from 'react'

function availableDenominationsCell(
  ctx: CellContext<Doc<'products'>, unknown>,
) {
  const row = ctx.row.original
  const denoms = row.availableDenominations ?? []
  const priceByDenom = row.priceByDenomination ?? {}
  const stockByDenom = row.stockByDenomination ?? {}

  if (denoms.length === 0) {
    return <span className='font-brk text-sm opacity-60'>····</span>
  }

  return (
    <div className='font-brk text-sm flex flex-wrap items-center gap-x-1 gap-y-0.5 px-4'>
      {denoms.map((denom, index) => {
        const key = String(denom)
        const label = mapNumericFractions[key] ?? key
        const price = priceByDenom[key]
        const stock = stockByDenom[key]
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
              <div className='px-2 font-brk text-base flex items-center space-x-3 bg-alum/20 rounded-sm'>
                {label === '⅛' && (
                  <Icon name='8th' className='size-5 text-purple-600' />
                )}
                {label === '¼' && (
                  <Icon name='4th' className='size-5 text-orange-600' />
                )}
                {label === '½' && (
                  <Icon name='half' className='size-5 text-lime-600' />
                )}
                {Number(label) >= 1 && <span className='min-w-5'>{label}</span>}
                <span className='w-8 font-okxs text-lg bg-sidebar/20 rounded-sm'>
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
          header: <ColHeader tip='Tier Class' symbol='tier' />,
          accessorKey: 'tier',
          cell: textCell('tier', 'text-center uppercase'),
          size: 40,
        },
        {
          id: 'available',
          header: <ColHeader tip='Available' symbol='avl' center />,
          accessorKey: 'available',
          cell: toggleCell('available', api.products.m.toggleAvailability, {
            values: [true, false],
            colors: ['success', 'default'],
            getMutationArgs: (row, newValue) => ({
              productId: row._id,
              available: newValue,
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
              colors: ['warning', 'default'],
              getMutationArgs: (row, newValue) => ({
                productId: row._id,
                eligibleForRewards: newValue,
              }),
            },
          ),
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
              colors: ['success', 'success'],
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
              symbol='_____  Denominations'
            />
          ),
          accessorKey: 'availableDenominations',
          cell: availableDenominationsCell,
          size: 480,
        },
        {
          id: 'popularDenomination',
          header: <ColHeader tip='Popular' symbol='Pop' />,
          accessorKey: 'popularDenomination',
          cell: textCell('popularDenomination'),
        },
        // {
        //   id: 'createdAt',
        //   header: 'Created',
        //   accessorKey: 'createdAt',
        // },
      ] as ColumnConfig<Doc<'products'>>[],
    [],
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
        />
      )}
    </div>
  )
}

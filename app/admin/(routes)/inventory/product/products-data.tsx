'use client'

import {DataTable} from '@/components/table-v2'
import {
  countCell,
  linkText,
  priceCell,
  textCell,
  toggleCell,
} from '@/components/table-v2/cells-v2'
import {ColumnConfig} from '@/components/table-v2/create-column'
import {ColHeader} from '@/components/table-v2/headers'
import {api} from '@/convex/_generated/api'
import {Doc} from '@/convex/_generated/dataModel'
import {Icon} from '@/lib/icons'
import {useMemo} from 'react'

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
          id: 'priceCents',
          header: () => <div className='text-right w-full mr-10'>Price</div>,
          accessorKey: 'priceCents',
          cell: priceCell('priceCents'),
          size: 120,
        },
        {
          id: 'stock',
          header: () => <div className='text-center w-full'>Stock</div>,
          accessorKey: 'stock',
          cell: countCell('stock', 'text-center'),
          size: 80,
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
          header: <ColHeader tip='Available Denominations' symbol='Denom' />,
          accessorKey: 'availableDenominations',
          cell: textCell('availableDenominations'),
          size: 100,
        },
        {
          id: 'popularDenomination',
          header: <ColHeader tip='Popular' symbol='Pop' />,
          accessorKey: 'popularDenomination',
          cell: textCell('popularDenomination'),
        },
        {
          id: 'createdAt',
          header: 'Created',
          accessorKey: 'createdAt',
        },
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

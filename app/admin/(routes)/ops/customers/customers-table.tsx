'use client'

import {DataTable} from '@/components/table-v2'
import {ColumnConfig} from '@/components/table-v2/create-column'
import {ColHeader} from '@/components/table-v2/headers'
import {api} from '@/convex/_generated/api'
import type {Doc} from '@/convex/_generated/dataModel'
import {Chip, User} from '@heroui/react'
import {useQuery} from 'convex/react'
import Link from 'next/link'
import {useMemo} from 'react'
import {idLink} from './id-link'

const formatDate = (timestamp?: number) => {
  if (!timestamp) return 'N/A'
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export const CustomersTable = () => {
  const customers = useQuery(api.users.q.getAllUsers, {limit: 100})

  const columns = useMemo(
    () =>
      [
        {
          id: 'name',
          header: <ColHeader tip='Customer' symbol='Customer' />,
          accessorKey: 'name',
          size: 200,
          cell: ({row}) => {
            const profileId = row.original.firebaseId ?? row.original.fid
            const displayName = row.original.name || 'Unnamed customer'
            const nameNode = profileId ? (
              <Link href={`/admin/ops/customers/${profileId}`} prefetch>
                {displayName}
              </Link>
            ) : (
              displayName
            )

            return (
              <User
                name={nameNode}
                avatarProps={{
                  src: row.original.photoUrl,
                  size: 'sm',
                  className: 'scale-80',
                }}
                classNames={{
                  name: 'text-base font-okxs capitalize hover:text-mac-blue hover:underline underline-offset-4 decoration-dotted decoration-[0.5px]',
                  description: 'text-default-500 text-xs',
                  base: 'mt-2 ',
                }}
              />
            )
          },
        },
        {
          id: 'phone',
          header: <ColHeader tip='Phone number' symbol='Phone' />,
          accessorKey: 'contact',
          size: 120,
          cell: ({row}) => (
            <p className='font-mono text-xs text-muted-foreground'>
              {row.original.contact?.phone ?? 'N/A'}
            </p>
          ),
        },
        {
          id: 'email',
          header: <ColHeader tip='Email address' symbol='Email' />,
          accessorKey: 'email',
          size: 200,
          cell: ({row}) => (
            <p className='font-mono text-xs text-muted-foreground'>
              {row.original.email || 'N/A'}
            </p>
          ),
        },
        {
          id: 'spent',
          header: <ColHeader tip='Total Spent($)' symbol='Spent' />,
          accessorKey: 'email',
          size: 200,
          cell: ({row}) => (
            <p className='font-mono text-xs text-muted-foreground'>
              {row.original.email || 'N/A'}
            </p>
          ),
        },
        {
          id: 'latest',
          header: <ColHeader tip='Latest Purchase' symbol='Latest' />,
          accessorKey: 'email',
          size: 100,
          cell: ({row}) => (
            <p className='font-brk text-xs text-muted-foreground'>
              {row.original.email || 'N/A'}
            </p>
          ),
        },
        {
          id: 'status',
          header: <ColHeader tip='Account status' symbol='Status' />,
          accessorKey: 'accountStatus',
          size: 64,
          cell: ({row}) => {
            const status = row.original.accountStatus ?? 'active'
            const normalized = status.toLowerCase()
            const isDanger =
              normalized === 'suspended' || normalized === 'banned'
            const isWarning = normalized === 'pending'
            return (
              <Chip
                size='sm'
                variant='flat'
                color={isDanger ? 'danger' : isWarning ? 'warning' : 'success'}
                className='capitalize'>
                {status.replace(/_/g, ' ')}
              </Chip>
            )
          },
        },
        {
          id: 'fid',
          header: <ColHeader tip='ID' symbol='ID' />,
          accessorKey: 'firebaseId',
          cell: idLink(),
          size: 60,
        },
        {
          id: 'joined',
          header: <ColHeader tip='Account created date' symbol='Joined' />,
          accessorKey: 'createdAt',
          size: 140,
          cell: ({row}) => (
            <p className='text-xs text-muted-foreground'>
              {formatDate(row.original.createdAt)}
            </p>
          ),
        },
      ] as ColumnConfig<Doc<'users'>>[],
    [],
  )

  if (!customers) {
    return (
      <p className='text-sm text-muted-foreground px-4'>Loading customers...</p>
    )
  }

  return (
    <div className='relative w-full max-w-full overflow-hidden'>
      <DataTable
        title='Customers'
        data={customers}
        loading={false}
        editingRowId={null}
        columnConfigs={columns}
      />
    </div>
  )
}

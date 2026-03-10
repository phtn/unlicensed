'use client'

import {SectionHeader} from '@/app/admin/_components/ui/section-header'
import {HyperList} from '@/components/expermtl/hyper-list'
import {api} from '@/convex/_generated/api'
import {Icon} from '@/lib/icons'
import type {GatewayId} from '@/lib/paygate/gateway-config'
import {Card, CardBody, CardHeader} from '@heroui/react'
import {useQuery} from 'convex/react'
import Link from 'next/link'
import {useCallback} from 'react'
import {AccountItemCard} from '../paygate/account-item'

interface GatewayAccountsListProps {
  gateway: GatewayId
  basePath: string
  onEdit?: (id: `0x${string}`) => void
  onRefresh?: (hexAddress: `0x${string}`) => void
  onDelete?: (hexAddress: `0x${string}`) => void
}

export const GatewayAccountsList = ({
  gateway,
  basePath,
  onEdit,
  onRefresh,
  onDelete,
}: GatewayAccountsListProps) => {
  const accounts = useQuery(api.gateways.q.listAccounts, {gateway})

  const handleEdit = useCallback(
    (id?: `0x${string}`) => () => {
      if (!id) return
      if (onEdit) void onEdit(id)
    },
    [onEdit],
  )

  const handleRefresh = useCallback(
    (hexAddress: `0x${string}`) => () => onRefresh?.(hexAddress),
    [onRefresh],
  )

  const handleDelete = useCallback(
    (hexAddress: `0x${string}`) => () => onDelete?.(hexAddress),
    [onDelete],
  )

  if (accounts === undefined) {
    return (
      <Card shadow='none' radius='none' className='md:rounded-lg w-full'>
        <CardBody className='flex items-center justify-center py-12'>
          <Icon name='spinners-ring' className='size-8 animate-spin' />
        </CardBody>
      </Card>
    )
  }

  if (accounts.length === 0) {
    return (
      <Card
        shadow='none'
        radius='none'
        className='md:rounded-lg bg-sidebar/40 dark:bg-dark-table/40 w-full'>
        <CardBody className='text-center py-12'>
          <p className='text-foreground/60 font-polysans capitalize'>
            {`No ${gateway} Accounts`}.
          </p>
          <Link
            href={`${basePath}?tabId=new`}
            className='text-sm text-white mt-2 mx-auto space-x-1 flex items-center bg-blue-500 ps-2.5 px-1 py-1 rounded-md'>
            <span>Create account</span>
            <Icon name='chevron-right' className='size-3' />
          </Link>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card
      shadow='none'
      radius='none'
      className='md:rounded-lg w-full bg-transparent'>
      <CardHeader>
        <SectionHeader title={`${gateway} Accounts`} />
      </CardHeader>
      <CardBody className='space-y-4 h-screen overflow-y-scroll md:h-full '>
        <HyperList
          data={accounts
            .filter((a) => !!a.enabled && !!a.isDefault)
            .map((a) => ({
              ...a,
              onEdit: handleEdit(a.hexAddress as `0x${string}`),
              onRefresh: handleRefresh(a.hexAddress as `0x${string}`),
              onDelete: handleDelete(a.hexAddress as `0x${string}`),
            }))}
          component={AccountItemCard}
          direction='right'
          container='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
        />
      </CardBody>
    </Card>
  )
}

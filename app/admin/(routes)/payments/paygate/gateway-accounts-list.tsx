'use client'

import {HyperList} from '@/components/expermtl/hyper-list'
import {api} from '@/convex/_generated/api'
import type {Doc} from '@/convex/_generated/dataModel'
import type {GatewayId} from '@/lib/paygate/gateway-config'
import {Icon} from '@/lib/icons'
import {Card, CardBody} from '@heroui/react'
import {useQuery} from 'convex/react'
import Link from 'next/link'
import {useCallback} from 'react'
import {AccountItemCard} from './account-item'

type PaygateAccount = Doc<'paygateAccounts'>

interface GatewayAccountsListProps {
  gateway: GatewayId
  basePath: string
  onEdit?: (id: PaygateAccount['_id']) => void
}

export const GatewayAccountsList = ({
  gateway,
  basePath,
  onEdit,
}: GatewayAccountsListProps) => {
  const accounts = useQuery(api.paygateAccounts.q.listAccounts, {gateway})

  const handleEdit = useCallback(
    (id: PaygateAccount['_id']) => () => {
      if (onEdit) void onEdit(id)
    },
    [onEdit],
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
          <p className='text-foreground/60 font-polysans'>
            Create your first account.
          </p>
          <Link
            href={`${basePath}?tabId=new`}
            className='text-sm text-blue-500 mt-2 mx-auto flex items-center bg-blue-500/10 ps-2.5 pe-1 py-1 rounded-lg'>
            <span>Get Started</span>
            <Icon name='chevron-right' className='size-4' />
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
      <CardBody className='space-y-4 h-screen overflow-y-scroll md:h-full '>
        <HyperList
          data={accounts.map((a) => ({...a, onEdit: handleEdit(a._id)}))}
          component={AccountItemCard}
          direction='right'
          container='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
        />
      </CardBody>
    </Card>
  )
}

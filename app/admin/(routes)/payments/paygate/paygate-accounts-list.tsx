'use client'

import {HyperList} from '@/components/expermtl/hyper-list'
import {api} from '@/convex/_generated/api'
import type {Doc} from '@/convex/_generated/dataModel'
import {Icon} from '@/lib/icons'
import {Card, CardBody} from '@heroui/react'
import {useQuery} from 'convex/react'
import Link from 'next/link'
import {useCallback} from 'react'
import {AccountItemCard} from './account-item'

type PaygateAccount = Doc<'paygateAccounts'>

interface PaygateAccountsListProps {
  onEdit?: (id: PaygateAccount['_id']) => void
}

export const PaygateAccountsList = ({onEdit}: PaygateAccountsListProps) => {
  const accounts = useQuery(api.paygateAccounts.q.listAccounts)
  // const deleteAccount = useMutation(api.paygateAccounts.m.deleteAccount)
  // const [, setDeletingId] = useState<PaygateAccount['_id'] | null>(null)

  const handleEdit = useCallback(
    (id: PaygateAccount['_id']) => () => {
      if (onEdit) void onEdit(id)
    },
    [onEdit],
  )

  // const handleDelete = async (id: PaygateAccount['_id']) => {
  //   if (!confirm('Are you sure you want to delete this account?')) return

  //   setDeletingId(id)
  //   try {
  //     await deleteAccount({id})
  //   } catch (error) {
  //     console.error('Failed to delete account:', error)
  //     alert('Failed to delete account')
  //   } finally {
  //     setDeletingId(null)
  //   }
  // }

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
            href='/admin/payments/paygate?tabId=new'
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
      <CardBody className='space-y-4'>
        <HyperList
          data={accounts.map((a) => ({...a, onEdit: handleEdit(a._id)}))}
          component={AccountItemCard}
          direction='right'
          container='grid grid-cols-1 lg:grid-cols-3 gap-6'
        />
      </CardBody>
    </Card>
  )
}

/*
<Table aria-label='PayGate accounts table' removeWrapper>
          <TableHeader>
            <TableColumn>LABEL</TableColumn>
            <TableColumn>WALLET ADDRESS</TableColumn>
            <TableColumn>STATUS</TableColumn>
            <TableColumn>PAYMENT STATUS</TableColumn>
            <TableColumn>AFFILIATE</TableColumn>
            <TableColumn>STATISTICS</TableColumn>
            <TableColumn>ACTIONS</TableColumn>
          </TableHeader>
          <TableBody>
            {accounts.map((account) => (
              <TableRow key={account._id}>
                <TableCell>
                  <div className='flex flex-col'>
                    <span className='font-medium'>
                      {account.label || 'Unnamed Account'}
                    </span>
                    {account.isDefault && (
                      <Chip size='sm' color='primary' variant='flat'>
                        Default
                      </Chip>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <code className='text-xs font-mono bg-default-100 px-2 py-1 rounded'>
                    {account.addressIn}
                  </code>
                </TableCell>
                <TableCell>
                  <Chip
                    size='sm'
                    color={getStatusColor(account)}
                    variant='flat'>
                    {getStatusLabel(account)}
                  </Chip>
                </TableCell>
                <TableCell>
                  {account.paymentStatus ? (
                    <Chip size='sm' color='success' variant='flat'>
                      {account.paymentStatus}
                    </Chip>
                  ) : (
                    <span className='text-foreground/40 text-sm'>—</span>
                  )}
                </TableCell>
                <TableCell>
                  {account.affiliateWallet ? (
                    <div className='flex flex-col gap-1'>
                      <code className='text-xs font-mono bg-default-100 px-2 py-1 rounded'>
                        {account.affiliateWallet.slice(0, 10)}...
                      </code>
                      {account.commissionRate !== undefined && (
                        <span className='text-xs text-foreground/60'>
                          {(account.commissionRate * 100).toFixed(2)}%
                        </span>
                      )}
                      {account.affiliateEnabled !== undefined && (
                        <Chip
                          size='sm'
                          color={
                            account.affiliateEnabled ? 'success' : 'default'
                          }
                          variant='flat'>
                          {account.affiliateEnabled ? 'Enabled' : 'Disabled'}
                        </Chip>
                      )}
                    </div>
                  ) : (
                    <span className='text-foreground/40 text-sm'>—</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className='flex flex-col gap-1 text-xs text-foreground/60'>
                    {account.totalTransactions !== undefined && (
                      <span>
                        Transactions:{' '}
                        {account.totalTransactions.toLocaleString()}
                      </span>
                    )}
                    {account.totalVolume !== undefined && (
                      <span>
                        Volume: ${account.totalVolume.toLocaleString()}
                      </span>
                    )}
                    {account.lastSyncedAt && (
                      <span className='text-foreground/40'>
                        Synced:{' '}
                        {new Date(account.lastSyncedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className='flex items-center gap-2'>
                    {onEdit && (
                      <Button
                        size='sm'
                        variant='light'
                        onPress={() => onEdit(account._id)}>
                        Edit
                      </Button>
                    )}
                    <Button
                      size='sm'
                      variant='light'
                      color='danger'
                      onPress={() => handleDelete(account._id)}
                      isLoading={deletingId === account._id}>
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
*/

'use client'

import {api} from '@/convex/_generated/api'
import type {Doc} from '@/convex/_generated/dataModel'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {
  Button,
  Card,
  CardBody,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import {useState} from 'react'

type PaygateAccount = Doc<'paygateAccounts'>

interface PaygateAccountsListProps {
  onEdit?: (id: PaygateAccount['_id']) => void
}

export const PaygateAccountsList = ({onEdit}: PaygateAccountsListProps) => {
  const accounts = useQuery(api.paygateAccounts.q.listAccounts)
  const deleteAccount = useMutation(api.paygateAccounts.m.deleteAccount)
  const [deletingId, setDeletingId] = useState<PaygateAccount['_id'] | null>(
    null,
  )

  const handleDelete = async (id: PaygateAccount['_id']) => {
    if (!confirm('Are you sure you want to delete this account?')) return

    setDeletingId(id)
    try {
      await deleteAccount({id})
    } catch (error) {
      console.error('Failed to delete account:', error)
      alert('Failed to delete account')
    } finally {
      setDeletingId(null)
    }
  }

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
      <Card shadow='none' radius='none' className='md:rounded-lg w-full'>
        <CardBody className='text-center py-12'>
          <p className='text-foreground/60'>No PayGate accounts configured yet.</p>
          <p className='text-sm text-foreground/40 mt-2'>
            Create your first account to get started.
          </p>
        </CardBody>
      </Card>
    )
  }

  const getStatusColor = (
    account: PaygateAccount,
  ): 'default' | 'success' | 'warning' | 'danger' => {
    if (!account.enabled) return 'default'
    if (account.accountStatus === 'active') return 'success'
    if (account.accountStatus === 'suspended') return 'danger'
    if (account.accountStatus === 'pending') return 'warning'
    return 'default'
  }

  const getStatusLabel = (account: PaygateAccount): string => {
    if (!account.enabled) return 'Disabled'
    if (account.accountStatus) return account.accountStatus
    return 'Unknown'
  }

  return (
    <Card shadow='none' radius='none' className='md:rounded-lg w-full'>
      <CardBody className='space-y-4'>
        <div>
          <h3 className='text-lg font-semibold'>PayGate Accounts</h3>
          <p className='text-sm text-foreground/60'>
            Manage your PayGate wallet accounts and sync data from PayGate API.
          </p>
        </div>

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
                          color={account.affiliateEnabled ? 'success' : 'default'}
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
                        Transactions: {account.totalTransactions.toLocaleString()}
                      </span>
                    )}
                    {account.totalVolume !== undefined && (
                      <span>Volume: ${account.totalVolume.toLocaleString()}</span>
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
      </CardBody>
    </Card>
  )
}


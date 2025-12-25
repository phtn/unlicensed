'use client'

import {api} from '@/convex/_generated/api'
import type {Doc} from '@/convex/_generated/dataModel'
import {Icon} from '@/lib/icons'
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

type AffiliateAccount = Doc<'affiliateAccounts'>

interface AffiliateAccountsListProps {
  onEdit?: (id: AffiliateAccount['_id']) => void
}

export const AffiliateAccountsList = ({
  onEdit,
}: AffiliateAccountsListProps) => {
  const affiliates = useQuery(api.affiliateAccounts.q.listAffiliates)
  const deleteAffiliate = useMutation(api.affiliateAccounts.m.deleteAffiliate)
  const [deletingId, setDeletingId] = useState<
    AffiliateAccount['_id'] | null
  >(null)

  const handleDelete = async (id: AffiliateAccount['_id']) => {
    if (!confirm('Are you sure you want to delete this affiliate account?'))
      return

    setDeletingId(id)
    try {
      await deleteAffiliate({id})
    } catch (error) {
      console.error('Failed to delete affiliate account:', error)
      alert('Failed to delete affiliate account')
    } finally {
      setDeletingId(null)
    }
  }

  if (affiliates === undefined) {
    return (
      <Card shadow='none' radius='none' className='md:rounded-lg w-full'>
        <CardBody className='flex items-center justify-center py-12'>
          <Icon name='spinners-ring' className='size-8 animate-spin' />
        </CardBody>
      </Card>
    )
  }

  if (affiliates.length === 0) {
    return (
      <Card shadow='none' radius='none' className='md:rounded-lg w-full'>
        <CardBody className='text-center py-12'>
          <p className='text-foreground/60'>
            No affiliate accounts configured yet.
          </p>
          <p className='text-sm text-foreground/40 mt-2'>
            Create your first affiliate account to get started.
          </p>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card shadow='none' radius='none' className='md:rounded-lg w-full'>
      <CardBody className='space-y-4'>
        <div>
          <h3 className='text-lg font-semibold'>Affiliate Accounts</h3>
          <p className='text-sm text-foreground/60'>
            Manage affiliate accounts and commission settings.
          </p>
        </div>

        <Table aria-label='Affiliate accounts table' removeWrapper>
          <TableHeader>
            <TableColumn>LABEL</TableColumn>
            <TableColumn>WALLET ADDRESS</TableColumn>
            <TableColumn>COMMISSION RATE</TableColumn>
            <TableColumn>STATUS</TableColumn>
            <TableColumn>STATISTICS</TableColumn>
            <TableColumn>ACTIONS</TableColumn>
          </TableHeader>
          <TableBody>
            {affiliates.map((affiliate) => (
              <TableRow key={affiliate._id}>
                <TableCell>
                  <span className='font-medium'>
                    {affiliate.label || 'Unnamed Affiliate'}
                  </span>
                </TableCell>
                <TableCell>
                  <code className='text-xs font-mono bg-default-100 px-2 py-1 rounded'>
                    {affiliate.walletAddress}
                  </code>
                </TableCell>
                <TableCell>
                  {affiliate.commissionRate !== undefined ? (
                    <span className='font-medium'>
                      {(affiliate.commissionRate * 100).toFixed(2)}%
                    </span>
                  ) : (
                    <span className='text-foreground/40 text-sm'>—</span>
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    size='sm'
                    color={affiliate.enabled ? 'success' : 'default'}
                    variant='flat'>
                    {affiliate.enabled ? 'Enabled' : 'Disabled'}
                  </Chip>
                </TableCell>
                <TableCell>
                  <div className='flex flex-col gap-1 text-xs text-foreground/60'>
                    {affiliate.totalTransactions !== undefined && (
                      <span>
                        Transactions: {affiliate.totalTransactions.toLocaleString()}
                      </span>
                    )}
                    {affiliate.totalCommissions !== undefined && (
                      <span>
                        Commissions: ${affiliate.totalCommissions.toLocaleString()}
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
                        onPress={() => onEdit(affiliate._id)}>
                        Edit
                      </Button>
                    )}
                    <Button
                      size='sm'
                      variant='light'
                      color='danger'
                      onPress={() => handleDelete(affiliate._id)}
                      isLoading={deletingId === affiliate._id}>
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


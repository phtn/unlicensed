'use client'

import {useAdminTabId} from '@/app/admin/_components/use-admin-tab'
import {api} from '@/convex/_generated/api'
import type {Doc} from '@/convex/_generated/dataModel'
import {useQuery} from 'convex/react'
import {Card, CardBody} from '@heroui/react'
import {Suspense} from 'react'
import {parseAsString, useQueryState} from 'nuqs'
import {AffiliateAccountForm} from './affiliate-account-form'
import {AffiliateAccountsList} from './affiliate-accounts-list'

const AffiliateContentInner = () => {
  const [tabId, setTabId, id, setId] = useAdminTabId()
  const [subTabId, setSubTabId] = useQueryState('subTabId', parseAsString.withDefault(''))

  const editingAffiliate = useQuery(
    api.affiliateAccounts.q.getAffiliateById,
    id && subTabId === 'edit'
      ? {id: id as Doc<'affiliateAccounts'>['_id']}
      : 'skip',
  )

  const handleFormSuccess = () => {
    setTabId('affiliate')
    setId(null)
    setSubTabId(null)
  }

  const handleEdit = (affiliateId: Doc<'affiliateAccounts'>['_id']) => {
    setId(affiliateId)
    setTabId('affiliate')
    setSubTabId('edit')
  }

  const handleCancel = () => {
    setTabId('affiliate')
    setId(null)
    setSubTabId(null)
  }

  // Handle affiliate sub-tabs
  if (subTabId === 'new') {
    return (
      <AffiliateAccountForm
        onCreated={handleFormSuccess}
        onCancel={handleCancel}
      />
    )
  }

  if (subTabId === 'edit') {
      if (!id || !editingAffiliate) {
        return (
          <Suspense fallback={<div>Loading...</div>}>
            <AffiliateAccountsList onEdit={handleEdit} />
          </Suspense>
        )
      }
      return (
        <AffiliateAccountForm
          affiliateId={editingAffiliate._id}
          initialValues={{
            walletAddress: editingAffiliate.walletAddress,
            label: editingAffiliate.label ?? '',
            description: editingAffiliate.description ?? '',
            commissionRate: editingAffiliate.commissionRate,
            enabled: editingAffiliate.enabled ?? true,
          }}
          onUpdated={handleFormSuccess}
          onCancel={handleCancel}
        />
      )
  }

  // Default: show affiliate accounts list
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AffiliateAccountsList onEdit={handleEdit} />
    </Suspense>
  )
}

export const AffiliateContent = () => {
  return (
    <div className='space-y-6'>
      <Card
        shadow='none'
        radius='none'
        className='md:rounded-lg md:w-full w-screen overflow-auto'>
        <CardBody className='space-y-4'>
          <div>
            <h2 className='text-xl font-semibold'>Affiliate Accounts</h2>
            <p className='text-sm text-foreground/60 whitespace-normal'>
              Manage affiliate accounts that earn commissions on PayGate
              transactions. Configure wallet addresses and commission rates.
            </p>
          </div>
        </CardBody>
      </Card>

      <Suspense fallback={<div>Loading...</div>}>
        <AffiliateContentInner />
      </Suspense>
    </div>
  )
}


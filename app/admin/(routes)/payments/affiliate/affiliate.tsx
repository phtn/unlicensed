'use client'

import {SectionHeader} from '@/app/admin/_components/ui/section-header'
import {useAdminTabId} from '@/app/admin/_components/use-admin-tab'
import {api} from '@/convex/_generated/api'
import type {Doc} from '@/convex/_generated/dataModel'
import {Card, CardBody} from '@heroui/react'
import {useQuery} from 'convex/react'
import {parseAsString, useQueryState} from 'nuqs'
import {Suspense} from 'react'
import {AffiliateAccountForm} from './affiliate-account-form'
import {AffiliateAccountsList} from './affiliate-accounts-list'

const AffiliateContentInner = () => {
  const [, setTabId, id, setId] = useAdminTabId()
  const [subTabId, setSubTabId] = useQueryState(
    'subTabId',
    parseAsString.withDefault(''),
  )

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
      <Card shadow='none' radius='none' className='md:rounded-lg'>
        <CardBody className='space-y-4 w-full'>
          <SectionHeader
            title='Affiliate Accounts'
            description='Manage affiliate accounts that earn commissions'
          />
        </CardBody>
      </Card>

      <Suspense fallback={<div>Loading...</div>}>
        <AffiliateContentInner />
      </Suspense>
    </div>
  )
}

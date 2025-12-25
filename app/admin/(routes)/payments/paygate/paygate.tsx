'use client'

import {useAdminTabId} from '@/app/admin/_components/use-admin-tab'
import {api} from '@/convex/_generated/api'
import type {Doc} from '@/convex/_generated/dataModel'
import {useQuery} from 'convex/react'
import {Suspense} from 'react'
import {PaygateAccountForm} from './paygate-account-form'
import {PaygateAccountsList} from './paygate-accounts-list'

const PayGateContentInner = () => {
  const [tabId, setTabId, id, setId] = useAdminTabId()

  const editingAccount = useQuery(
    api.paygateAccounts.q.getAccountById,
    id && tabId === 'edit' ? {id: id as Doc<'paygateAccounts'>['_id']} : 'skip',
  )

  const handleFormSuccess = () => {
    setTabId(null)
    setId(null)
  }

  const handleEdit = (accountId: Doc<'paygateAccounts'>['_id']) => {
    setId(accountId)
    setTabId('edit')
  }

  const handleCancel = () => {
    setTabId(null)
    setId(null)
  }

  // Only handle PayGate-specific tabs (not affiliate tabs)
  // If tabId is affiliate or starts with affiliate, this component shouldn't handle it
  if (tabId === 'affiliate' || tabId?.startsWith('affiliate')) {
    // This shouldn't happen as routing should prevent it, but just in case
    return null
  }

  switch (tabId) {
    case 'new':
      return (
        <PaygateAccountForm
          onCreated={handleFormSuccess}
          onCancel={handleCancel}
        />
      )
    case 'edit':
      if (!id || !editingAccount) {
        return (
          <Suspense fallback={<div>Loading...</div>}>
            <PaygateAccountsList onEdit={handleEdit} />
          </Suspense>
        )
      }
      return (
        <PaygateAccountForm
          accountId={editingAccount._id}
          initialValues={{
            hexAddress: editingAccount.hexAddress,
            addressIn: editingAccount.addressIn,
            label: editingAccount.label ?? '',
            description: editingAccount.description ?? '',
            isDefault: editingAccount.isDefault ?? false,
            enabled: editingAccount.enabled ?? true,
          }}
          onUpdated={handleFormSuccess}
          onCancel={handleCancel}
        />
      )
    default:
      return (
        <Suspense fallback={<div>Loading...</div>}>
          <PaygateAccountsList onEdit={handleEdit} />
        </Suspense>
      )
  }
}

export const PayGateContent = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PayGateContentInner />
    </Suspense>
  )
}

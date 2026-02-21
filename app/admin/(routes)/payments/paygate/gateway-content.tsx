'use client'

import {useAdminTabId} from '@/app/admin/_components/use-admin-tab'
import {api} from '@/convex/_generated/api'
import type {Doc} from '@/convex/_generated/dataModel'
import type {GatewayId} from '@/lib/paygate/gateway-config'
import {useQuery} from 'convex/react'
import {Suspense} from 'react'
import {GatewayAccountForm} from './gateway-account-form'
import {GatewayAccountsList} from './gateway-accounts-list'

interface GatewayContentProps {
  gateway: GatewayId
  basePath: string
}

const GatewayContentInner = ({gateway, basePath}: GatewayContentProps) => {
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

  switch (tabId) {
    case 'new':
      return (
        <GatewayAccountForm
          gateway={gateway}
          onCancel={handleCancel}
        />
      )
    case 'edit':
      if (!id || !editingAccount) {
        return (
          <Suspense fallback={<div>Loading...</div>}>
            <GatewayAccountsList
              gateway={gateway}
              basePath={basePath}
              onEdit={handleEdit}
            />
          </Suspense>
        )
      }
      return (
        <GatewayAccountForm
          gateway={gateway}
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
          <GatewayAccountsList
            gateway={gateway}
            basePath={basePath}
            onEdit={handleEdit}
          />
        </Suspense>
      )
  }
}

export const GatewayContent = ({gateway, basePath}: GatewayContentProps) => (
  <Suspense fallback={<div>Loading...</div>}>
    <GatewayContentInner gateway={gateway} basePath={basePath} />
  </Suspense>
)

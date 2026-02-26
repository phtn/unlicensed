'use client'

import {useAdminTabId} from '@/app/admin/_components/use-admin-tab'
import {api} from '@/convex/_generated/api'
import type {GatewayId} from '@/lib/paygate/gateway-config'
import {useMutation, useQuery} from 'convex/react'
import {Suspense, useCallback} from 'react'
import {GatewayAccountForm} from './gateway-account-form'
import {GatewayAccountsList} from './gateway-accounts-list'

interface GatewayContentProps {
  gateway: GatewayId
  basePath: string
}

const GatewayContentInner = ({gateway, basePath}: GatewayContentProps) => {
  const [tabId, setTabId, id, setId] = useAdminTabId()

  const gatewayDoc = useQuery(api.gateways.q.getByGateway, {gateway})
  const editingAccount = useQuery(
    api.gateways.q.getAccount,
    id && tabId === 'edit' ? {gateway, hexAddress: id} : 'skip',
  )

  const handleFormSuccess = useCallback(() => {
    setTabId(null)
    setId(null)
  }, [setTabId, setId])

  const handleEdit = (hexAddress: string) => {
    setId(hexAddress)
    setTabId('edit')
  }

  const handleCancel = () => {
    setTabId(null)
    setId(null)
  }

  const deleteAccount = useMutation(api.gateways.m.deleteAccount)

  const handleDelete = useCallback(
    async (hexAddress: string) => {
      if (!gatewayDoc?._id) return
      await deleteAccount({gatewayId: gatewayDoc._id, hexAddress})
      handleFormSuccess()
    },
    [deleteAccount, gatewayDoc, handleFormSuccess],
  )

  const handleRefresh = useCallback((_hexAddress: string) => {
    // TODO: Sync account data from gateway API
  }, [])

  switch (tabId) {
    case 'new':
      return (
        <GatewayAccountForm
          gateway={gateway}
          gatewayId={gatewayDoc?._id}
          gatewayUrls={
            gatewayDoc
              ? {apiUrl: gatewayDoc.apiUrl, checkoutUrl: gatewayDoc.checkoutUrl}
              : undefined
          }
          onCancel={handleCancel}
        />
      )
    case 'edit':
      if (!id || !editingAccount || !gatewayDoc) {
        return (
          <Suspense fallback={<div>Loading...</div>}>
            <GatewayAccountsList
              gateway={gateway}
              basePath={basePath}
              onEdit={handleEdit}
              onRefresh={handleRefresh}
              onDelete={handleDelete}
            />
          </Suspense>
        )
      }
      return (
        <GatewayAccountForm
          gateway={gateway}
          gatewayId={gatewayDoc._id}
          hexAddress={editingAccount.hexAddress}
          initialValues={editingAccount}
          gatewayUrls={{
            apiUrl: gatewayDoc.apiUrl,
            checkoutUrl: gatewayDoc.checkoutUrl,
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
            onRefresh={handleRefresh}
            onDelete={handleDelete}
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

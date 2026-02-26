// 'use client'

// import {useAdminTabId} from '@/app/admin/_components/use-admin-tab'
// import {api} from '@/convex/_generated/api'
// import {useMutation, useQuery} from 'convex/react'
// import {Suspense, useCallback} from 'react'
// import {PaygateAccountForm} from './paygate-account-form'
// import {PaygateAccountsList} from './paygate-accounts-list'
// import { GatewayAccountForm } from '../_components/gateway-account-form'

// const PayGateContentInner = () => {
//   const [tabId, setTabId, id, setId] = useAdminTabId()

//   const gatewayDoc = useQuery(api.gateways.q.getByGateway, {gateway: 'paygate'})
//   const accounts = useQuery(
//     api.gateways.q.listAccounts,
//     tabId === 'edit' ? {gateway: 'paygate'} : 'skip',
//   )
//   const editingAccount = accounts?.find((account) => account.hexAddress === id)

//   const handleFormSuccess = useCallback(() => {
//     setTabId(null)
//     setId(null)
//   }, [setTabId, setId])

//   const handleEdit = (accountId: `0x${string}`) => {
//     setId(accountId)
//     setTabId('edit')
//   }

//   const handleCancel = () => {
//     setTabId(null)
//     setId(null)
//   }

//   const deleteAccount = useMutation(api.gateways.m.deleteAccount)

//   const handleDelete = useCallback(
//     async (hexAddress: string) => {
//       if (!gatewayDoc?._id) return
//       await deleteAccount({gatewayId: gatewayDoc._id, hexAddress})
//       handleFormSuccess()
//     },
//     [deleteAccount, gatewayDoc, handleFormSuccess],
//   )

//   const handleRefresh = useCallback((_hexAddress: string) => {
//     // TODO: Sync account data from PayGate API
//   }, [])

//   // Only handle PayGate-specific tabs (not affiliate tabs)
//   // If tabId is affiliate or starts with affiliate, this component shouldn't handle it
//   if (tabId === 'affiliate' || tabId?.startsWith('affiliate')) {
//     // This shouldn't happen as routing should prevent it, but just in case
//     return null
//   }

//   switch (tabId) {
//     case 'new':
//       return (
//         <GatewayAccountForm
//           gateway={gateway}
//           gatewayId={gatewayDoc?._id}
//           gatewayUrls={
//             gatewayDoc
//               ? {apiUrl: gatewayDoc.apiUrl, checkoutUrl: gatewayDoc.checkoutUrl}
//               : undefined
//           }
//           onCreated={handleFormSuccess}
//           onCancel={handleCancel}
//         />
//       )
//     case 'edit':
//       if (!id || !editingAccount || !gatewayDoc) {
//         return (
//           <Suspense fallback={<div>Loading...</div>}>
//             <PaygateAccountsList
//               onEdit={handleEdit}
//               onRefresh={handleRefresh}
//               onDelete={handleDelete}
//             />
//           </Suspense>
//         )
//       }
//       return (
//         <PaygateAccountForm
//           gatewayId={gatewayDoc._id}
//           hexAddress={editingAccount.hexAddress}
//           initialValues={{
//             hexAddress: editingAccount.hexAddress,
//             addressIn: editingAccount.addressIn,
//             label: editingAccount.label ?? '',
//             description: editingAccount.description ?? '',
//             isDefault: editingAccount.isDefault ?? false,
//             enabled: editingAccount.enabled ?? true,
//           }}
//           gatewayUrls={{
//             apiUrl: gatewayDoc.apiUrl,
//             checkoutUrl: gatewayDoc.checkoutUrl,
//           }}
//           onUpdated={handleFormSuccess}
//           onCancel={handleCancel}
//         />
//       )
//     default:
//       return (
//         <Suspense fallback={<div>Loading...</div>}>
//           <PaygateAccountsList
//             onEdit={handleEdit}
//             onRefresh={handleRefresh}
//             onDelete={handleDelete}
//           />
//         </Suspense>
//       )
//   }
// }

// export const PayGateContent = () => {
//   return (
//     <Suspense fallback={<div>Loading...</div>}>
//       <PayGateContentInner />
//     </Suspense>
//   )
// }

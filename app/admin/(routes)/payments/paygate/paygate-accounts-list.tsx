'use client'

import {GatewayAccountsList} from '../_components/gateway-accounts-list'

interface PaygateAccountsListProps {
  onEdit?: (id: `0x${string}`) => void
  onRefresh?: (hexAddress: `0x${string}`) => void
  onDelete?: (hexAddress: `0x${string}`) => void
}

/** PayGate-specific wrapper around shared GatewayAccountsList */
export const PaygateAccountsList = (props: PaygateAccountsListProps) => (
  <GatewayAccountsList
    gateway='paygate'
    basePath='/admin/payments/paygate'
    {...props}
  />
)

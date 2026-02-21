'use client'

import type {Doc} from '@/convex/_generated/dataModel'
import {GatewayAccountsList} from './gateway-accounts-list'

interface PaygateAccountsListProps {
  onEdit?: (id: Doc<'paygateAccounts'>['_id']) => void
}

/** PayGate-specific wrapper around shared GatewayAccountsList */
export const PaygateAccountsList = (props: PaygateAccountsListProps) => (
  <GatewayAccountsList
    gateway='paygate'
    basePath='/admin/payments/paygate'
    {...props}
  />
)

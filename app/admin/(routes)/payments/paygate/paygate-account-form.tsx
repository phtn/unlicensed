'use client'

import type {Doc} from '@/convex/_generated/dataModel'
import {GatewayAccountForm} from './gateway-account-form'

export type PaygateAccountFormValues = {
  hexAddress: string
  addressIn: string
  label?: string
  description?: string
  isDefault?: boolean
  enabled?: boolean
  callbackUrl?: string
}

type PaygateAccountFormProps = {
  accountId?: Doc<'paygateAccounts'>['_id']
  initialValues?: PaygateAccountFormValues
  onCreated?: VoidFunction
  onUpdated?: VoidFunction
  onCancel?: VoidFunction
}

/** PayGate-specific wrapper around shared GatewayAccountForm */
export const PaygateAccountForm = (props: PaygateAccountFormProps) => (
  <GatewayAccountForm gateway='paygate' {...props} />
)

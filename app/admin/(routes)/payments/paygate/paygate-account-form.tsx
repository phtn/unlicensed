'use client'

import {GatewayAccountForm} from '../_components/gateway-account-form'

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
  gatewayId?: import('@/convex/_generated/dataModel').Id<'gateways'>
  hexAddress?: string
  initialValues?: PaygateAccountFormValues
  onCreated?: VoidFunction
  onUpdated?: VoidFunction
  onCancel?: VoidFunction
}

/** PayGate-specific wrapper around shared GatewayAccountForm */
export const PaygateAccountForm = (props: PaygateAccountFormProps) => (
  <GatewayAccountForm gateway='paygate' {...props} />
)

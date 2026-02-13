import { IconName } from '@/lib/icons'
import { Dispatch, Ref, SetStateAction } from 'react'

export interface Balance {
  value: bigint
  symbol: string
  decimals: number
}

export type ReceiptStatus = { blockNumber: bigint; status: 'success' | 'reverted' } | null

export interface PayTabProps {
  onSend: VoidFunction
  onPaymentSuccess?: (transactionHash: `0x${string}`) => void | Promise<void>
  formattedBalance: string | null
  balance: Balance | null
  tokenPrice: number | null
  disabled: boolean
  amountInputRef: Ref<HTMLInputElement>
  addressInputRef: Ref<HTMLInputElement>
  setTo: Dispatch<SetStateAction<string>>
  setAmount: Dispatch<SetStateAction<string>>
  amount: string
  /** Default USD amount when no paymentAmountUsd in URL (e.g. order total for order payment flow). */
  defaultPaymentAmountUsd?: string
  isPending?: boolean
  isConfirming?: boolean
  receipt?: ReceiptStatus
  hash?: `0x${string}` | null
  explorerUrl?: string | null
  onReset?: VoidFunction
}

export interface TokenData {
  name: string
  color: string
  icon: IconName
}

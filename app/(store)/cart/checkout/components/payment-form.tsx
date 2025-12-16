'use client'

import {Select, SelectItem} from '@heroui/react'
import {FormData} from '../types'

interface PaymentFormProps {
  formData: FormData
  onInputChange: (value: FormData['paymentMethod']) => void
}

export function PaymentForm({
  formData,
  onInputChange,
}: PaymentFormProps) {
  return (
    <div>
      <h3 className='text-lg font-semibold mb-4'>Payment Method</h3>
      <Select
        label='Payment Method'
        selectedKeys={[formData.paymentMethod]}
        onSelectionChange={(keys) => {
          const selected = Array.from(keys)[0] as string
          onInputChange(selected as FormData['paymentMethod'])
        }}>
        <SelectItem key='credit_card'>Credit Card</SelectItem>
        <SelectItem key='crypto'>Cryptocurrency</SelectItem>
        <SelectItem key='cashapp'>CashApp</SelectItem>
      </Select>
    </div>
  )
}


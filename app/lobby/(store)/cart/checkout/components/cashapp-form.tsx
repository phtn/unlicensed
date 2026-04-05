'use client'

import {Icon} from '@/lib/icons'
import {Input} from '@heroui/react'
import {ChangeEvent, useCallback} from 'react'
import {FormData, FormErrors} from '../types'

interface CashAppFormProps {
  formData: FormData
  formErrors: FormErrors
  onInputChange: (field: keyof FormData, value: string) => void
}

export function CashAppForm({formData, onInputChange}: CashAppFormProps) {
  const handleUsernameChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onInputChange('cashAppUsername', e.target.value)
    },
    [onInputChange],
  )

  const _handlePhoneChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onInputChange('contactPhone', e.target.value)
    },
    [onInputChange],
  )

  return (
    <div className='space-y-2'>
      <h3 className='flex items-center space-x-1.5 text-lg font-medium my-3 opacity-80'>
        <Icon name='cashapp' className='size-4.5' />
        <span className='whitespace-nowrap'>CashApp Account</span>
      </h3>
      <div className='space-y-1'>
        <Input
          type='text'
          value={formData.cashAppUsername}
          onChange={handleUsernameChange}
          spellCheck='false'
          autoFocus={false}
        />
      </div>
    </div>
  )
}

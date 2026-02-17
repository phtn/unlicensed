'use client'

import {commonInputClassNames} from '@/app/admin/_components/ui/fields'
import {Icon} from '@/lib/icons'
import {Input} from '@heroui/react'
import {ChangeEvent, useCallback} from 'react'
import {FormData, FormErrors} from '../types'

interface CashAppFormProps {
  formData: FormData
  formErrors: FormErrors
  onInputChange: (field: keyof FormData, value: string) => void
}

export function CashAppForm({
  formData,
  formErrors,
  onInputChange,
}: CashAppFormProps) {
  const handleUsernameChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onInputChange('cashAppUsername', e.target.value)
    },
    [onInputChange],
  )

  const handlePhoneChange = useCallback(
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
          label='CashApp Username'
          type='text'
          radius='sm'
          classNames={commonInputClassNames}
          value={formData.cashAppUsername}
          onChange={handleUsernameChange}
          isRequired
          spellCheck='false'
          isInvalid={!!formErrors.cashAppUsername}
          errorMessage={formErrors.cashAppUsername}
          autoFocus={false}
        />
      </div>
    </div>
  )
}

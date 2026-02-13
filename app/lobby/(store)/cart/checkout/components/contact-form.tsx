'use client'

import {commonInputClassNames} from '@/app/admin/_components/ui/fields'
import {Icon} from '@/lib/icons'
import {Input} from '@heroui/react'
import {ChangeEvent, useCallback} from 'react'
import {FormData, FormErrors} from '../types'

interface ContactFormProps {
  formData: FormData
  formErrors: FormErrors
  onInputChange: (field: keyof FormData, value: string) => void
}

export function ContactForm({
  formData,
  formErrors,
  onInputChange,
}: ContactFormProps) {
  const handleEmailChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onInputChange('contactEmail', e.target.value)
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
      <h3 className='flex items-center space-x-1.5 text-lg font-semibold my-3 opacity-80'>
        <Icon name='mail-send-fill' className='size-5' />
        <span className='whitespace-nowrap'>Contact Information</span>
      </h3>
      <div className='space-y-1'>
        <Input
          label='Email'
          type='email'
          radius='sm'
          classNames={commonInputClassNames}
          value={formData.contactEmail}
          onChange={handleEmailChange}
          isRequired
          spellCheck='false'
          isInvalid={!!formErrors.contactEmail}
          errorMessage={formErrors.contactEmail}
          autoFocus={false}
        />
        <Input
          label='Phone'
          radius='sm'
          type='tel'
          spellCheck='false'
          classNames={commonInputClassNames}
          value={formData.contactPhone}
          onChange={handlePhoneChange}
          autoFocus={false}
        />
      </div>
    </div>
  )
}

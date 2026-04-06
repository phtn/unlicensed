'use client'

import {Icon} from '@/lib/icons'
import {Input} from '@heroui/react'
import {ChangeEvent, useCallback} from 'react'
import {FormData, FormErrors} from '../types'

interface ContactFormProps {
  formData: FormData
  formErrors: FormErrors
  onInputChange: (field: keyof FormData, value: string) => void
}

export function ContactForm({formData, onInputChange}: ContactFormProps) {
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
    <div className='space-y-2 text-foreground'>
      <h3 className='flex items-center space-x-2 text-lg font-clash font-medium my-3'>
        <Icon name='mail-send-fill' className='size-5' />
        <span className='whitespace-nowrap'>Contact Information</span>
      </h3>
      <div className='space-y-2 px-1'>
        <div className='flex items-center space-x-2'>
          <Icon name='email' />
          <Input
            required
            fullWidth
            type='email'
            value={formData.contactEmail}
            onChange={handleEmailChange}
            spellCheck='false'
            autoFocus={false}
            className='rounded-xs shadow-none bg-sidebar/50 placeholder:text-foreground/50'
          />
        </div>

        <div className='flex items-center space-x-2'>
          <Icon name='phone' />
          <Input
            type='tel'
            fullWidth
            spellCheck='false'
            value={formData.contactPhone}
            onChange={handlePhoneChange}
            autoFocus={false}
            className='rounded-xs tracking-widest shadow-none bg-sidebar/50 outline-none placeholder:text-foreground/50'
          />
        </div>
      </div>
    </div>
  )
}

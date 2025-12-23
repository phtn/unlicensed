'use client'

import {Icon} from '@/lib/icons'
import {Input} from '@heroui/react'
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
  return (
    <div className='space-y-2'>
      <h3 className='flex items-center space-x-1.5 text-lg font-semibold my-3 tracking-tighter'>
        <Icon name='email' className='size-6 opacity-80' />
        <span className='whitespace-nowrap'>Contact Information</span>
      </h3>
      <div className='space-y-1'>
        <Input
          label='Email'
          type='email'
          radius='sm'
          classNames={{label: 'opacity-80'}}
          value={formData.contactEmail}
          onChange={(e) => onInputChange('contactEmail', e.target.value)}
          isRequired
          isInvalid={!!formErrors.contactEmail}
          errorMessage={formErrors.contactEmail}
        />
        <Input
          label='Phone'
          radius='sm'
          type='tel'
          value={formData.contactPhone}
          onChange={(e) => onInputChange('contactPhone', e.target.value)}
        />
      </div>
    </div>
  )
}

'use client'

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
    <div>
      <h3 className='text-lg font-semibold mb-4'>Contact Information</h3>
      <div className='space-y-4'>
        <Input
          label='Email'
          type='email'
          value={formData.contactEmail}
          onChange={(e) => onInputChange('contactEmail', e.target.value)}
          isRequired
          isInvalid={!!formErrors.contactEmail}
          errorMessage={formErrors.contactEmail}
        />
        <Input
          label='Phone'
          type='tel'
          value={formData.contactPhone}
          onChange={(e) => onInputChange('contactPhone', e.target.value)}
        />
      </div>
    </div>
  )
}


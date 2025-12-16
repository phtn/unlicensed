import {PaymentMethod} from '@/convex/orders/d'
import {UserType} from '@/convex/users/d'
import {FormData, FormErrors} from './types'

/**
 * Split user's full name into first and last name
 */
export function splitUserName(user: UserType | null | undefined): {
  firstName: string
  lastName: string
} {
  if (!user?.name) {
    return {firstName: '', lastName: ''}
  }
  const nameParts = user.name.trim().split(/\s+/)
  if (nameParts.length === 1) {
    return {firstName: nameParts[0], lastName: ''}
  }
  // Take last part as last name, rest as first name
  const lastName = nameParts[nameParts.length - 1]
  const firstName = nameParts.slice(0, -1).join(' ')
  return {firstName, lastName}
}

/**
 * Get default payment method from user preferences
 */
export function getDefaultPaymentMethod(
  user: UserType | null | undefined,
): PaymentMethod {
  return (user?.preferences?.defaultPaymentMethod || 'credit_card') as PaymentMethod
}

/**
 * Validate form fields
 */
export function validateForm(formData: FormData): FormErrors {
  const errors: FormErrors = {}

  if (!formData.contactEmail.trim()) {
    errors.contactEmail = 'Email address is required'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
    errors.contactEmail = 'Please enter a valid email address'
  }

  if (!formData.firstName.trim()) {
    errors.firstName = 'First name is required'
  }

  if (!formData.lastName.trim()) {
    errors.lastName = 'Last name is required'
  }

  if (!formData.addressLine1.trim()) {
    errors.addressLine1 = 'Address line 1 is required'
  }

  if (!formData.city.trim()) {
    errors.city = 'City is required'
  }

  if (!formData.state.trim()) {
    errors.state = 'State is required'
  }

  if (!formData.zipCode.trim()) {
    errors.zipCode = 'ZIP code is required'
  } else if (!/^\d{5}(-\d{4})?$/.test(formData.zipCode)) {
    errors.zipCode = 'Please enter a valid ZIP code'
  }

  // Country is always defaulted to "US" - no validation needed

  // Validate billing address if different from shipping
  if (!formData.useSameBilling) {
    if (!formData.billingFirstName.trim()) {
      errors.billingFirstName = 'Billing first name is required'
    }
    if (!formData.billingLastName.trim()) {
      errors.billingLastName = 'Billing last name is required'
    }
    if (!formData.billingAddressLine1.trim()) {
      errors.billingAddressLine1 = 'Billing address line 1 is required'
    }
    if (!formData.billingCity.trim()) {
      errors.billingCity = 'Billing city is required'
    }
    if (!formData.billingState.trim()) {
      errors.billingState = 'Billing state is required'
    }
    if (!formData.billingZipCode.trim()) {
      errors.billingZipCode = 'Billing ZIP code is required'
    } else if (!/^\d{5}(-\d{4})?$/.test(formData.billingZipCode)) {
      errors.billingZipCode = 'Please enter a valid ZIP code'
    }
    // Billing country is always defaulted to "US" - no validation needed
  }

  return errors
}

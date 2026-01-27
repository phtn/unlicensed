'use client'

import {PaymentMethod} from '@/convex/orders/d'
import {AddressType, UserType} from '@/convex/users/d'
import {useCallback, useEffect, useMemo, useState, useTransition} from 'react'
import {FormData, FormErrors} from '../types'
import {getDefaultPaymentMethod, splitUserName, validateForm} from '../utils'

interface UseOrderFormProps {
  isAuthenticated: boolean
  userEmail: string
  userPhone?: string
  defaultAddress?: AddressType
  defaultBillingAddress?: AddressType
  cashAppUsername?: string | null
  convexUser?: UserType | null
}

export function useOrderForm({
  isAuthenticated,
  userEmail,
  userPhone,
  defaultAddress,
  defaultBillingAddress,
  cashAppUsername,
  convexUser,
}: UseOrderFormProps) {
  const [isPending, startTransition] = useTransition()
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [formData, setFormData] = useState<FormData>(() => {
    const {firstName: userNameFirst, lastName: userNameLast} =
      splitUserName(convexUser)
    const defaultPaymentMethod = getDefaultPaymentMethod(convexUser)

    return {
      contactEmail: userEmail ?? '',
      contactPhone: userPhone ?? defaultAddress?.phone ?? '',
      cashAppUsername: cashAppUsername ?? '',
      paymentMethod: defaultPaymentMethod,
      // Shipping address - prefer address name, fallback to user's name
      firstName: defaultAddress?.firstName ?? userNameFirst ?? '',
      lastName: defaultAddress?.lastName ?? userNameLast ?? '',
      addressLine1: defaultAddress?.addressLine1 ?? '',
      addressLine2: defaultAddress?.addressLine2 ?? '',
      city: defaultAddress?.city ?? '',
      state: defaultAddress?.state ?? '',
      zipCode: defaultAddress?.zipCode ?? '',
      country: defaultAddress?.country ?? 'US',
      // Billing address (optional) - prefer billing address name, fallback to user's name
      useSameBilling: true, // Default to checked - user can uncheck to enter different billing address
      billingFirstName: defaultBillingAddress?.firstName ?? userNameFirst ?? '',
      billingLastName: defaultBillingAddress?.lastName ?? userNameLast ?? '',
      billingAddressLine1: defaultBillingAddress?.addressLine1 ?? '',
      billingAddressLine2: defaultBillingAddress?.addressLine2 ?? '',
      billingCity: defaultBillingAddress?.city ?? '',
      billingState: defaultBillingAddress?.state ?? '',
      billingZipCode: defaultBillingAddress?.zipCode ?? '',
      billingCountry: defaultBillingAddress?.country ?? 'US',
    }
  })

  const {firstName: userNameFirst, lastName: userNameLast} = useMemo(
    () => splitUserName(convexUser),
    [convexUser],
  )

  // Auto-populate form fields from user data when available
  // This effect runs whenever user data changes and populates empty fields
  useEffect(() => {
    if (!isAuthenticated) return

    startTransition(() => {
      setFormData((prev) => {
        const updates: Partial<FormData> = {}

        // Populate email if field is empty and user email is available
        if (userEmail && !prev.contactEmail.trim()) {
          updates.contactEmail = userEmail
        }

        // Populate phone if field is empty and user phone is available
        const phoneToUse = userPhone || defaultAddress?.phone
        if (phoneToUse && !prev.contactPhone.trim()) {
          updates.contactPhone = phoneToUse
        }

        // Populate payment method from preferences if available
        if (convexUser?.preferences?.defaultPaymentMethod) {
          updates.paymentMethod = convexUser.preferences
            .defaultPaymentMethod as PaymentMethod
        }

        // Populate first and last name from user's name if fields are empty
        // Prefer address name if available, otherwise use user's name
        if (!prev.firstName.trim()) {
          if (defaultAddress?.firstName) {
            updates.firstName = defaultAddress.firstName
          } else if (userNameFirst) {
            updates.firstName = userNameFirst
          }
        }
        if (!prev.lastName.trim()) {
          if (defaultAddress?.lastName) {
            updates.lastName = defaultAddress.lastName
          } else if (userNameLast) {
            updates.lastName = userNameLast
          }
        }

        // Populate shipping address fields if empty and default address is available
        if (defaultAddress) {
          if (defaultAddress.addressLine1 && !prev.addressLine1.trim()) {
            updates.addressLine1 = defaultAddress.addressLine1
          }
          if (defaultAddress.addressLine2 && !prev.addressLine2.trim()) {
            updates.addressLine2 = defaultAddress.addressLine2
          }
          if (defaultAddress.city && !prev.city.trim()) {
            updates.city = defaultAddress.city
          }
          if (defaultAddress.state && !prev.state.trim()) {
            updates.state = defaultAddress.state
          }
          if (defaultAddress.zipCode && !prev.zipCode.trim()) {
            updates.zipCode = defaultAddress.zipCode
          }
          // Country is always "US" - ensure it's set
          if (!prev.country.trim()) {
            updates.country = 'US'
          }
          // Use address phone if contact phone is empty
          if (defaultAddress.phone && !prev.contactPhone.trim()) {
            updates.contactPhone = defaultAddress.phone
          }
        }

        // Populate billing address fields if available and useSameBilling is false
        // Only populate if user has unchecked "use same billing" or if no billing fields are filled
        if (defaultBillingAddress && !prev.useSameBilling) {
          if (!prev.billingFirstName.trim()) {
            if (defaultBillingAddress.firstName) {
              updates.billingFirstName = defaultBillingAddress.firstName
            } else if (userNameFirst) {
              updates.billingFirstName = userNameFirst
            }
          }
          if (!prev.billingLastName.trim()) {
            if (defaultBillingAddress.lastName) {
              updates.billingLastName = defaultBillingAddress.lastName
            } else if (userNameLast) {
              updates.billingLastName = userNameLast
            }
          }
          if (
            defaultBillingAddress.addressLine1 &&
            !prev.billingAddressLine1.trim()
          ) {
            updates.billingAddressLine1 = defaultBillingAddress.addressLine1
          }
          if (
            defaultBillingAddress.addressLine2 &&
            !prev.billingAddressLine2.trim()
          ) {
            updates.billingAddressLine2 = defaultBillingAddress.addressLine2
          }
          if (defaultBillingAddress.city && !prev.billingCity.trim()) {
            updates.billingCity = defaultBillingAddress.city
          }
          if (defaultBillingAddress.state && !prev.billingState.trim()) {
            updates.billingState = defaultBillingAddress.state
          }
          if (defaultBillingAddress.zipCode && !prev.billingZipCode.trim()) {
            updates.billingZipCode = defaultBillingAddress.zipCode
          }
          // Billing country is always "US" - ensure it's set
          if (!prev.billingCountry.trim()) {
            updates.billingCountry = 'US'
          }
        }

        // Only update if there are changes
        if (Object.keys(updates).length > 0) {
          return {...prev, ...updates}
        }

        return prev
      })
    })
  }, [
    isAuthenticated,
    userEmail,
    userPhone,
    defaultAddress,
    defaultBillingAddress,
    convexUser?.preferences?.defaultPaymentMethod,
    userNameFirst,
    userNameLast,
    formData.useSameBilling, // React to useSameBilling changes to auto-populate billing when unchecked
  ])

  const handleInputChange = useCallback(
    (field: keyof FormData, value: string | boolean | PaymentMethod) => {
      // Use direct state update for input changes to prevent flickering
      // Only use startTransition for heavy operations
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }))
      // Clear error for this field when user starts typing
      if (formErrors[field as keyof FormErrors]) {
        setFormErrors((prev) => {
          const newErrors = {...prev}
          delete newErrors[field as keyof FormErrors]
          return newErrors
        })
      }
    },
    [formErrors],
  )

  const validate = useCallback((): boolean => {
    const errors = validateForm(formData)
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }, [formData])

  return {
    formData,
    formErrors,
    isPending,
    startTransition,
    handleInputChange,
    validate,
  }
}

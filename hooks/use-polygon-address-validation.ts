import {useApiCall} from '@/hooks/use-api-call'
import {useCallback, useEffect, useMemo, useState} from 'react'

interface UsePolygonAddressValidationOptions {
  /**
   * Minimum length for a valid Ethereum address (default: 42)
   */
  minLength?: number
  /**
   * Whether to automatically validate when address changes
   */
  autoValidate?: boolean
}

interface ValidationResult {
  /**
   * Whether the address format is valid
   */
  isValidFormat: boolean
  /**
   * Whether the address exists on Polygon network
   */
  isValidAddress: boolean | null
  /**
   * Validation error message if any
   */
  error: string | null
  /**
   * Whether validation is in progress
   */
  isValidating: boolean
}

export function usePolygonAddressValidation(
  address: string | null | undefined,
  options: UsePolygonAddressValidationOptions = {},
) {
  const {minLength = 42, autoValidate = true} = options
  const {handleApiCall, response, loading} = useApiCall()
  const [validationResult, setValidationResult] =
    useState<ValidationResult>({
      isValidFormat: false,
      isValidAddress: null,
      error: null,
      isValidating: false,
    })

  /**
   * Validates the format of an Ethereum address
   */
  const validateFormat = useCallback(
    (addr: string | null | undefined): boolean => {
      if (!addr || typeof addr !== 'string') {
        return false
      }

      const trimmed = addr.trim()

      // Check length
      if (trimmed.length !== minLength) {
        return false
      }

      // Check if it starts with 0x
      if (!trimmed.startsWith('0x')) {
        return false
      }

      // Check if the rest is valid hexadecimal (40 characters after 0x)
      const hexPart = trimmed.slice(2)
      if (hexPart.length !== 40) {
        return false
      }

      // Validate hex characters
      const hexRegex = /^[0-9a-fA-F]+$/
      return hexRegex.test(hexPart)
    },
    [minLength],
  )

  /**
   * Validates the address by checking if it exists on Polygon network
   */
  const validateAddress = useCallback(
    async (addr: string): Promise<boolean> => {
      if (!validateFormat(addr)) {
        return false
      }

      try {
        setValidationResult((prev) => ({
          ...prev,
          isValidating: true,
          error: null,
        }))

        // Make API call to PolygonScan
        await handleApiCall(`https://polygonscan.com/address/${addr}`)

        // The response will be set by useApiCall hook
        // We'll check it in the useEffect below
        return true
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to validate address'
        setValidationResult((prev) => ({
          ...prev,
          isValidating: false,
          error: errorMessage,
          isValidAddress: false,
        }))
        return false
      }
    },
    [handleApiCall, validateFormat],
  )

  // Update validation result based on API response
  useEffect(() => {
    if (loading) {
      return
    }

    if (!response) {
      return
    }

    const isValidFormatResult = validateFormat(address)

    if (!isValidFormatResult) {
      setValidationResult({
        isValidFormat: false,
        isValidAddress: null,
        error: null,
        isValidating: false,
      })
      return
    }

    // Check if the API call was successful
    // PolygonScan returns HTML for valid addresses (200 status)
    // A successful response means the address page exists on PolygonScan
    // If response.success is true, the address exists; if false, it might not exist or there was an error
    const isValid = response.success === true

    setValidationResult({
      isValidFormat: true,
      isValidAddress: isValid,
      error: response.error || null,
      isValidating: false,
    })
  }, [response, loading, address, validateFormat])

  // Auto-validate when address changes
  useEffect(() => {
    if (!autoValidate || !address) {
      const isValidFormatResult = validateFormat(address)
      setValidationResult({
        isValidFormat: isValidFormatResult,
        isValidAddress: null,
        error: null,
        isValidating: false,
      })
      return
    }

    const trimmed = address.trim()
    if (trimmed.length === minLength && validateFormat(trimmed)) {
      validateAddress(trimmed).catch((error) => {
        console.error('Address validation error:', error)
      })
    } else {
      setValidationResult({
        isValidFormat: validateFormat(trimmed),
        isValidAddress: null,
        error: null,
        isValidating: false,
      })
    }
  }, [address, autoValidate, minLength, validateFormat, validateAddress])

  // Memoized validation state
  const isValid = useMemo(() => {
    return (
      validationResult.isValidFormat &&
      validationResult.isValidAddress === true
    )
  }, [validationResult.isValidFormat, validationResult.isValidAddress])

  return {
    ...validationResult,
    isValid,
    validate: useCallback(() => {
      if (address) {
        return validateAddress(address.trim())
      }
      return Promise.resolve(false)
    }, [address, validateAddress]),
  }
}


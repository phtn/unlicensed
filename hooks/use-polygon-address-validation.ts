import {useApiCall} from '@/hooks/use-api-call'
import {startTransition, useCallback, useEffect, useMemo, useState} from 'react'

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

/**
 * Validates the format of an Ethereum address (pure helper).
 */
function checkFormat(
  addr: string | null | undefined,
  minLength: number,
): boolean {
  if (!addr || typeof addr !== 'string') {
    return false
  }
  const trimmed = addr.trim()
  if (trimmed.length !== minLength || !trimmed.startsWith('0x')) {
    return false
  }
  const hexPart = trimmed.slice(2)
  if (hexPart.length !== 40) {
    return false
  }
  return /^[0-9a-fA-F]+$/.test(hexPart)
}

export function usePolygonAddressValidation(
  address: string | null | undefined,
  options: UsePolygonAddressValidationOptions = {},
) {
  const {minLength = 42, autoValidate = true} = options
  const {handleApiCall, response, loading} = useApiCall()
  const [lastValidatedAddress, setLastValidatedAddress] = useState<string>('')

  const validateFormat = useCallback(
    (addr: string | null | undefined): boolean => checkFormat(addr, minLength),
    [minLength],
  )

  /**
   * Validates the address by checking if it exists on Polygon network.
   * Does not call setState; result is derived from useApiCall's response.
   */
  const validateAddress = useCallback(
    async (addr: string): Promise<boolean> => {
      if (!checkFormat(addr, minLength)) {
        return false
      }
      try {
        await handleApiCall(`https://polygonscan.com/address/${addr}`)
        return true
      } catch (error) {
        console.error(error)
        return false
      }
    },
    [handleApiCall, minLength],
  )

  // Only trigger async validation when address changes; track which address via state (set in transition to avoid sync setState in effect)
  useEffect(() => {
    if (!autoValidate || !address) {
      startTransition(() => setLastValidatedAddress(''))
      return
    }
    const trimmed = address.trim()
    if (trimmed.length === minLength && checkFormat(trimmed, minLength)) {
      startTransition(() => setLastValidatedAddress(trimmed))
      void validateAddress(trimmed).catch((error) => {
        console.error('Address validation error:', error)
      })
    } else {
      startTransition(() => setLastValidatedAddress(''))
    }
  }, [address, autoValidate, minLength, validateAddress])

  // Derive validation result from response/loading and current address (no setState in effects)
  const validationResult = useMemo((): ValidationResult => {
    const isValidFormat = validateFormat(address)
    const trimmed = address?.trim() ?? ''

    if (!address) {
      return {
        isValidFormat: false,
        isValidAddress: null,
        error: null,
        isValidating: false,
      }
    }

    const isResponseForCurrentAddress =
      response != null && trimmed === lastValidatedAddress

    if (loading && trimmed === lastValidatedAddress) {
      return {
        isValidFormat,
        isValidAddress: null,
        error: null,
        isValidating: true,
      }
    }

    if (isResponseForCurrentAddress && response) {
      return {
        isValidFormat: true,
        isValidAddress: response.success,
        error: response.error ?? null,
        isValidating: false,
      }
    }

    return {
      isValidFormat,
      isValidAddress: null,
      error: null,
      isValidating: false,
    }
  }, [address, response, loading, lastValidatedAddress, validateFormat])

  const isValid = useMemo(
    () =>
      validationResult.isValidFormat &&
      validationResult.isValidAddress === true,
    [validationResult.isValidFormat, validationResult.isValidAddress],
  )

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

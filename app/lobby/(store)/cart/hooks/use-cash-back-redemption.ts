'use client'

import {useCallback, useEffect, useState} from 'react'

const CASH_BACK_REDEMPTION_STORAGE_KEY = 'hyfe:cash-back-redemption:v1'
const CASH_BACK_REDEMPTION_EVENT = 'hyfe:cash-back-redemption-updated'

function readCashBackRedemptionPreference(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  const storedValue = window.localStorage.getItem(
    CASH_BACK_REDEMPTION_STORAGE_KEY,
  )
  return storedValue === 'true'
}

function writeCashBackRedemptionPreference(nextValue: boolean) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(
    CASH_BACK_REDEMPTION_STORAGE_KEY,
    String(nextValue),
  )
  window.dispatchEvent(
    new CustomEvent(CASH_BACK_REDEMPTION_EVENT, {detail: nextValue}),
  )
}

export function useCashBackRedemption() {
  const [isEnabled, setIsEnabled] = useState(readCashBackRedemptionPreference)

  useEffect(() => {
    const handleStorageSync = () => {
      setIsEnabled(readCashBackRedemptionPreference())
    }

    window.addEventListener('storage', handleStorageSync)
    window.addEventListener(CASH_BACK_REDEMPTION_EVENT, handleStorageSync)

    return () => {
      window.removeEventListener('storage', handleStorageSync)
      window.removeEventListener(CASH_BACK_REDEMPTION_EVENT, handleStorageSync)
    }
  }, [])

  const updatePreference = useCallback((nextValue: boolean) => {
    setIsEnabled(nextValue)
    writeCashBackRedemptionPreference(nextValue)
  }, [])

  return {
    isCashBackEnabled: isEnabled,
    setCashBackEnabled: updatePreference,
  }
}

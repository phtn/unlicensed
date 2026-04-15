'use client'

import {useCallback, useEffect, useState} from 'react'

const CASH_BACK_REDEMPTION_STORAGE_KEY = 'hyfe:cash-back-redemption:v2'
const CASH_BACK_REDEMPTION_EVENT = 'hyfe:cash-back-redemption-updated'

interface CashBackRedemptionState {
  enabled: boolean
  customCents: number | null // null = use all available points
}

const DEFAULT_STATE: CashBackRedemptionState = {
  enabled: false,
  customCents: null,
}

function readRedemptionState(): CashBackRedemptionState {
  if (typeof window === 'undefined') return DEFAULT_STATE

  const raw = window.localStorage.getItem(CASH_BACK_REDEMPTION_STORAGE_KEY)
  if (!raw) {
    // Migrate from v1 boolean key
    const v1 = window.localStorage.getItem('hyfe:cash-back-redemption:v1')
    if (v1 === 'true') return {enabled: true, customCents: null}
    return DEFAULT_STATE
  }

  try {
    const parsed = JSON.parse(raw) as CashBackRedemptionState
    return {
      enabled: !!parsed.enabled,
      customCents:
        typeof parsed.customCents === 'number' && parsed.customCents > 0
          ? parsed.customCents
          : null,
    }
  } catch {
    return DEFAULT_STATE
  }
}

function writeRedemptionState(state: CashBackRedemptionState) {
  if (typeof window === 'undefined') return

  window.localStorage.setItem(
    CASH_BACK_REDEMPTION_STORAGE_KEY,
    JSON.stringify(state),
  )
  window.dispatchEvent(
    new CustomEvent(CASH_BACK_REDEMPTION_EVENT, {detail: state}),
  )
}

export function useCashBackRedemption() {
  const [state, setState] = useState(readRedemptionState)

  useEffect(() => {
    const handleSync = () => setState(readRedemptionState())

    window.addEventListener('storage', handleSync)
    window.addEventListener(CASH_BACK_REDEMPTION_EVENT, handleSync)

    return () => {
      window.removeEventListener('storage', handleSync)
      window.removeEventListener(CASH_BACK_REDEMPTION_EVENT, handleSync)
    }
  }, [])

  const setCashBackEnabled = useCallback((nextValue: boolean) => {
    setState((prev) => {
      const next = {...prev, enabled: nextValue}
      writeRedemptionState(next)
      return next
    })
  }, [])

  const setCashBackCustomCents = useCallback(
    (cents: number | null) => {
      setState((prev) => {
        const next = {
          ...prev,
          customCents: cents !== null && cents > 0 ? cents : null,
        }
        writeRedemptionState(next)
        return next
      })
    },
    [],
  )

  return {
    isCashBackEnabled: state.enabled,
    setCashBackEnabled,
    customRedemptionCents: state.customCents,
    setCashBackCustomCents,
  }
}

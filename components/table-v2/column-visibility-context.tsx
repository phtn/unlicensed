'use client'

import type {VisibilityState} from '@tanstack/react-table'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

type SetColumnVisibility = (
  updater: VisibilityState | ((prev: VisibilityState) => VisibilityState),
) => void

interface ColumnVisibilityContextValue {
  columnVisibility: VisibilityState
  setColumnVisibility: SetColumnVisibility
}

const ColumnVisibilityContext = createContext<
  ColumnVisibilityContextValue | null
>(null)

interface ColumnVisibilityProviderProps {
  /** Initial/URL-driven visibility (e.g. from nuqs param). Synced into local state when this changes. */
  valueFromUrl: VisibilityState
  /** Called when user toggles so the URL can be updated (e.g. setColumnVisibilityParam). */
  onVisibilityChange: (next: VisibilityState) => void
  children: ReactNode
}

export function ColumnVisibilityProvider({
  valueFromUrl,
  onVisibilityChange,
  children,
}: ColumnVisibilityProviderProps) {
  const [columnVisibility, setColumnVisibilityState] =
    useState<VisibilityState>(() => valueFromUrl ?? {})

  useEffect(() => {
    setColumnVisibilityState(valueFromUrl ?? {})
  }, [valueFromUrl])

  const setColumnVisibility = useCallback<SetColumnVisibility>(
    (updater) => {
      setColumnVisibilityState((prev) => {
        const next =
          typeof updater === 'function' ? updater(prev) : updater
        onVisibilityChange(next)
        return next
      })
    },
    [onVisibilityChange],
  )

  const value = useMemo<ColumnVisibilityContextValue>(
    () => ({columnVisibility, setColumnVisibility}),
    [columnVisibility, setColumnVisibility],
  )

  return (
    <ColumnVisibilityContext.Provider value={value}>
      {children}
    </ColumnVisibilityContext.Provider>
  )
}

export function useColumnVisibility(): ColumnVisibilityContextValue {
  const ctx = useContext(ColumnVisibilityContext)
  if (ctx == null) {
    throw new Error(
      'useColumnVisibility must be used within a ColumnVisibilityProvider',
    )
  }
  return ctx
}

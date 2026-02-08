'use client'

import type {VisibilityState} from '@tanstack/react-table'
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
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

const isVisibilityEqual = (
  a: VisibilityState,
  b: VisibilityState,
): boolean => {
  const aKeys = Object.keys(a)
  const bKeys = Object.keys(b)

  if (aKeys.length !== bKeys.length) {
    return false
  }

  return aKeys.every((key) => a[key] === b[key])
}

export function ColumnVisibilityProvider({
  valueFromUrl,
  onVisibilityChange,
  children,
}: ColumnVisibilityProviderProps) {
  const columnVisibility = useMemo(() => valueFromUrl ?? {}, [valueFromUrl])

  const setColumnVisibility = useCallback<SetColumnVisibility>(
    (updater) => {
      const next =
        typeof updater === 'function' ? updater(columnVisibility) : updater
      if (isVisibilityEqual(columnVisibility, next)) {
        return
      }
      onVisibilityChange(next)
    },
    [columnVisibility, onVisibilityChange],
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

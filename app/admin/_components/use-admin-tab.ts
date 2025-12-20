'use client'

import {parseAsString, useQueryState} from 'nuqs'

/**
 * Hook for managing admin tab state via URL search parameters
 * Replaces pathname-based tab detection with URL query parameters
 */
export function useAdminTab(defaultTab?: string) {
  const [tab, setTab] = useQueryState(
    'tab',
    parseAsString.withDefault(defaultTab ?? ''),
  )

  return [tab, setTab] as const
}

/**
 * Hook for managing tabId state (used in toolbar components)
 * This is a more specific variant for tab navigation
 */
export function useAdminTabId(defaultTabId?: string) {
  const [tabId, setTabId] = useQueryState(
    'tabId',
    parseAsString.withDefault(defaultTabId ?? ''),
  )
  const [id, setId] = useQueryState('id', parseAsString.withDefault(''))

  return [tabId, setTabId, id, setId] as const
}

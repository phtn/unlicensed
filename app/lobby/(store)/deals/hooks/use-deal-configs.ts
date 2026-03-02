'use client'

import {
  dealDocToBundleConfig,
  type BundleConfig,
} from '@/app/lobby/(store)/deals/lib/deal-types'
import {api} from '@/convex/_generated/api'
import {useQuery} from 'convex/react'
import {useMemo} from 'react'

/** Returns deal configs keyed by id for the store (enabled only). Use in deals page, cart, pending deals. */
export function useDealConfigs(): {
  configs: Record<string, BundleConfig>
  configsList: BundleConfig[]
  isLoading: boolean
} {
  const deals = useQuery(api.deals.q.listForStore)

  return useMemo(() => {
    if (deals === undefined) {
      return {
        configs: {},
        configsList: [],
        isLoading: true,
      }
    }
    const list = deals.map((d) => dealDocToBundleConfig(d))
    const configs: Record<string, BundleConfig> = {}
    for (const c of list) configs[c.id] = c
    return {
      configs,
      configsList: list,
      isLoading: false,
    }
  }, [deals])
}

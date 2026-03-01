'use client'

import type {Id} from '@/convex/_generated/dataModel'
import {parseAsInteger, parseAsString, useQueryStates} from 'nuqs'
import {useCallback, useEffect, useMemo, useRef} from 'react'
import type {BundleType} from '../lib/deal-types'
import {
  BUNDLE_PARAM_KEYS,
  parseSelectionsString,
  serializeSelections,
} from '../searchParams'

type SelectionsMap = Map<string, {productId: Id<'products'>; quantity: number}>

export interface BundleState {
  variationIndex: number
  selections: SelectionsMap
}

export type DealsState = Record<BundleType, BundleState>

const DEALS_PARSERS = Object.fromEntries(
  Object.values(BUNDLE_PARAM_KEYS).flatMap((keys) => [
    [keys.v, parseAsInteger.withDefault(0)] as const,
    [keys.s, parseAsString.withDefault('')] as const,
  ]),
)

export function useDealsQueryState(
  defaultVariationByBundle: Partial<Record<BundleType, number>>,
) {
  const [raw, setRaw] = useQueryStates(DEALS_PARSERS, {
    shallow: true,
  })

  const state = useMemo((): DealsState => {
    const result = {} as DealsState
    for (const [bundleId, keys] of Object.entries(BUNDLE_PARAM_KEYS) as Array<
      [BundleType, {v: string; s: string}]
    >) {
      const v = raw[keys.v] ?? defaultVariationByBundle[bundleId] ?? 0
      const sRaw = raw[keys.s] ?? ''
      const parsed = parseSelectionsString(sRaw)
      const selections = new Map<
        string,
        {productId: Id<'products'>; quantity: number}
      >()
      for (const [id, val] of parsed) {
        selections.set(id, {productId: id as Id<'products'>, quantity: val.quantity})
      }
      result[bundleId] = {variationIndex: v, selections}
    }
    return result
  }, [raw, defaultVariationByBundle])

  const stateRef = useRef(state)
  useEffect(() => {
    stateRef.current = state
  }, [state])

  const setBundleState = useCallback(
    (
      bundleId: BundleType,
      update:
        | Partial<BundleState>
        | ((prev: BundleState) => Partial<BundleState>),
    ) => {
      const keys = BUNDLE_PARAM_KEYS[bundleId]
      const prev = stateRef.current[bundleId]
      const next =
        typeof update === 'function' ? {...prev, ...update(prev)} : {...prev, ...update}
      setRaw({
        [keys.v]: next.variationIndex,
        [keys.s]: serializeSelections(next.selections),
      })
    },
    [setRaw],
  )

  return {state, setBundleState}
}

'use client'

import type {Id} from '@/convex/_generated/dataModel'
import {parseAsInteger, parseAsString, useQueryStates} from 'nuqs'
import {useCallback, useEffect, useMemo, useRef} from 'react'
import type {BundleType} from '../lib/deal-types'
import {
  getParamKeysForDealId,
  parseSelectionsString,
  serializeSelections,
} from '../searchParams'

type SelectionsMap = Map<string, {productId: Id<'products'>; quantity: number}>

export interface BundleState {
  variationIndex: number
  selections: SelectionsMap
}

export type DealsState = Record<string, BundleState>

function buildDealsParsers(dealIds: string[]) {
  const entries: Array<[string, ReturnType<typeof parseAsInteger.withDefault> | ReturnType<typeof parseAsString.withDefault>]> = []
  for (const id of dealIds) {
    const keys = getParamKeysForDealId(id)
    entries.push([keys.v, parseAsInteger.withDefault(0)])
    entries.push([keys.s, parseAsString.withDefault('')])
  }
  return Object.fromEntries(entries)
}

export function useDealsQueryState(
  defaultVariationByBundle: Partial<Record<BundleType, number>>,
  dealIds: string[],
) {
  const parsers = useMemo(() => buildDealsParsers(dealIds), [dealIds])
  const [raw, setRaw] = useQueryStates(parsers, {
    shallow: true,
  })

  const state = useMemo((): DealsState => {
    const result: DealsState = {}
    for (const bundleId of dealIds) {
      const keys = getParamKeysForDealId(bundleId)
      const vRaw = raw[keys.v] ?? defaultVariationByBundle[bundleId] ?? 0
      const variationIndex = typeof vRaw === 'number' ? vRaw : 0
      const sRaw = String(raw[keys.s] ?? '')
      const parsed = parseSelectionsString(sRaw)
      const selections = new Map<
        string,
        {productId: Id<'products'>; quantity: number}
      >()
      for (const [id, val] of parsed) {
        selections.set(id, {productId: id as Id<'products'>, quantity: val.quantity})
      }
      result[bundleId] = {variationIndex, selections}
    }
    return result
  }, [raw, defaultVariationByBundle, dealIds])

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
      const keys = getParamKeysForDealId(bundleId)
      const prev = stateRef.current[bundleId] ?? {
        variationIndex: 0,
        selections: new Map(),
      }
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

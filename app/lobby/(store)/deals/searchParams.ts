import {parseAsInteger, parseAsString} from 'nuqs'
import type {BundleType} from './lib/deal-types'

/** Short URL-safe keys per bundle */
export const BUNDLE_PARAM_KEYS: Record<BundleType, {v: string; s: string}> = {
  'build-your-own-oz': {v: 'byozo_v', s: 'byozo_s'},
  'mix-match-4oz': {v: 'mm4oz_v', s: 'mm4oz_s'},
  'extracts-3g': {v: 'ex3g_v', s: 'ex3g_s'},
  'extracts-7g': {v: 'ex7g_v', s: 'ex7g_s'},
  'edibles-prerolls-5': {v: 'ed5_v', s: 'ed5_s'},
  'edibles-prerolls-10': {v: 'ed10_v', s: 'ed10_s'},
}

/** Parse "id1:2,id2:1" into Map<productId, quantity> */
export function parseSelectionsString(
  s: string,
): Map<string, {productId: string; quantity: number}> {
  const map = new Map<string, {productId: string; quantity: number}>()
  if (!s?.trim()) return map
  for (const part of s.split(',')) {
    const [id, qtyStr] = part.split(':')
    if (!id || qtyStr == null) continue
    const qty = parseInt(qtyStr, 10)
    if (Number.isNaN(qty) || qty <= 0) continue
    map.set(id.trim(), {productId: id.trim(), quantity: qty})
  }
  return map
}

/** Serialize selections Map to "id1:2,id2:1" */
export function serializeSelections(
  selections: Map<string, {productId: string; quantity: number}>,
): string {
  return Array.from(selections.entries())
    .filter(([, v]) => v.quantity > 0)
    .map(([id, v]) => `${id}:${v.quantity}`)
    .join(',')
}

export const parseAsDealsVariation = parseAsInteger
export const parseAsDealsSelections = parseAsString.withDefault('')

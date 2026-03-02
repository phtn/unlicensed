import {parseAsInteger, parseAsString} from 'nuqs'

/** Short URL-safe keys for known deal ids (backward compatible). */
const LEGACY_PARAM_KEYS: Record<string, {v: string; s: string}> = {
  'build-your-own-oz': {v: 'byozo_v', s: 'byozo_s'},
  'mix-match-4oz': {v: 'mm4oz_v', s: 'mm4oz_s'},
  'extracts-3g': {v: 'ex3g_v', s: 'ex3g_s'},
  'extracts-7g': {v: 'ex7g_v', s: 'ex7g_s'},
  'edibles-prerolls-5': {v: 'ed5_v', s: 'ed5_s'},
  'edibles-prerolls-10': {v: 'ed10_v', s: 'ed10_s'},
}

/** URL param keys for a deal id (short for legacy, prefixed for others). */
export function getParamKeysForDealId(id: string): {v: string; s: string} {
  const legacy = LEGACY_PARAM_KEYS[id]
  if (legacy) return legacy
  const slug = id.replace(/-/g, '_').slice(0, 16)
  return {v: `d_${slug}_v`, s: `d_${slug}_s`}
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

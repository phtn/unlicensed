import type {Doc, Id, TableNames} from '../_generated/dataModel'

/**
 * CWE-89 (SQL Injection) mitigation:
 * Convex does not use SQL; it uses a typed document API. All lookups are
 * parameterized (id passed as value, never concatenated). We still apply
 * "accept known good" (CWE-89): validate ID format and table before any
 * database access. See https://cwe.mitre.org/data/definitions/89.html
 */

const BASE64_ID_PART = /^[A-Za-z0-9+/=]+$/

/**
 * Validates that an ID is a valid Convex ID format (allowlist).
 * Convex IDs: tableName:base64EncodedString — alphanumeric, +, /, = only.
 */
export function isValidConvexId(id: unknown): id is string {
  if (typeof id !== 'string') return false
  if (!id.includes(':')) return false
  const parts = id.split(':')
  if (parts.length !== 2) return false
  const [tableName, idPart] = parts
  if (!tableName?.length || !idPart?.length) return false
  if (!BASE64_ID_PART.test(idPart)) return false
  return true
}

/**
 * Validates that an ID belongs to a specific table.
 */
export function isValidIdForTable<T extends TableNames>(
  id: unknown,
  tableName: T,
): id is Id<T> {
  if (!isValidConvexId(id)) return false
  const parts = id.split(':')
  return parts[0] === tableName
}

/**
 * Sanitizes an ID for use in db.get (CWE-89: accept known good).
 * Returns a validated Id<T> or null. Use only this sanitized value for get.
 */
export function sanitizeIdForTable<T extends TableNames>(
  id: unknown,
  tableName: T,
): Id<T> | null {
  if (!isValidIdForTable(id, tableName)) return null
  return id as Id<T>
}

/**
 * Safely gets a document by ID. Uses sanitizeIdForTable so only validated
 * IDs reach db.get (parameterized; no query string construction).
 */
export async function safeGet<T extends TableNames>(
  db: { get: (id: Id<T>) => Promise<Doc<T> | null> },
  tableName: T,
  id: unknown,
): Promise<Doc<T> | null> {
  const sanitized = sanitizeIdForTable(id, tableName)
  if (sanitized === null) return null
  try {
    return await db.get(sanitized)
  } catch {
    return null
  }
}

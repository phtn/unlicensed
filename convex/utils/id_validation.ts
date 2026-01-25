import type {Doc, Id, TableNames} from '../_generated/dataModel'

/**
 * Validates that an ID is a valid Convex ID format
 * Convex IDs follow the pattern: tableName:base64EncodedString
 */
export function isValidConvexId(id: unknown): id is string {
  if (typeof id !== 'string') {
    return false
  }

  // Convex IDs contain a colon separating table name from the ID part
  if (!id.includes(':')) {
    return false
  }

  // Split by colon to get table name and ID part
  const parts = id.split(':')
  if (parts.length !== 2) {
    return false
  }

  const [tableName, idPart] = parts

  // Validate table name is not empty
  if (!tableName || tableName.length === 0) {
    return false
  }

  // Validate ID part is not empty and contains only valid base64 characters
  if (!idPart || idPart.length === 0) {
    return false
  }

  // Base64 characters: A-Z, a-z, 0-9, +, /, = (for padding)
  const base64Regex = /^[A-Za-z0-9+/=]+$/
  if (!base64Regex.test(idPart)) {
    return false
  }

  return true
}

/**
 * Validates that an ID belongs to a specific table
 */
export function isValidIdForTable<T extends TableNames>(
  id: unknown,
  tableName: T,
): id is Id<T> {
  if (!isValidConvexId(id)) {
    return false
  }

  const parts = id.split(':')
  const idTableName = parts[0]

  return idTableName === tableName
}

/**
 * Safely gets a document by ID with validation
 * Returns null if ID is invalid or document doesn't exist
 */
export async function safeGet<T extends TableNames>(
  db: {
    get: (id: Id<T>) => Promise<Doc<T> | null>
  },
  tableName: T,
  id: unknown,
): Promise<Doc<T> | null> {
  if (!isValidIdForTable(id, tableName)) {
    return null
  }

  try {
    return await db.get(id as Id<T>)
  } catch {
    return null
  }
}

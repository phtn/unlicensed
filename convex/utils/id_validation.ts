import type {Doc, Id, TableNames} from '../_generated/dataModel'

type DbReader = {
  get: <T extends TableNames>(id: Id<T>) => Promise<Doc<T> | null>
  normalizeId: <T extends TableNames>(tableName: T, id: string) => Id<T> | null
}

/**
 * Uses Convex's own table-aware ID normalization so both current and legacy
 * ID string representations are handled safely.
 */
export function sanitizeIdForTable<T extends TableNames>(
  db: Pick<DbReader, 'normalizeId'>,
  id: unknown,
  tableName: T,
): Id<T> | null {
  if (typeof id !== 'string' || id.length === 0) return null
  return db.normalizeId(tableName, id)
}

/**
 * Safely gets a document by ID using table-aware ID normalization.
 */
export async function safeGet<T extends TableNames>(
  db: Pick<DbReader, 'get' | 'normalizeId'>,
  tableName: T,
  id: unknown,
): Promise<Doc<T> | null> {
  const sanitized = sanitizeIdForTable(db, id, tableName)
  if (sanitized === null) return null
  try {
    return await db.get(sanitized)
  } catch {
    return null
  }
}

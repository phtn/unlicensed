const PRODUCT_IMPORT_ROW_ID_PATTERN = /^[a-z0-9]{20,}$/i

export function getProductCsvImportRowId(row: {
  _id?: unknown
}): string | undefined {
  if (typeof row._id !== 'string') {
    return undefined
  }

  const normalizedId = row._id
    .trim()
    .replace(/^['"`]+|['"`]+$/g, '')
    .trim()

  if (!normalizedId) {
    return undefined
  }

  return PRODUCT_IMPORT_ROW_ID_PATTERN.test(normalizedId)
    ? normalizedId
    : undefined
}

export function sortProductCsvImportRowsForProcessing<
  T extends {_id?: unknown},
>(rows: T[]): Array<{row: T; rowIndex: number}> {
  return rows
    .map((row, rowIndex) => ({row, rowIndex}))
    .sort((a, b) => {
      const aIsReplacement = getProductCsvImportRowId(a.row) != null
      const bIsReplacement = getProductCsvImportRowId(b.row) != null

      if (aIsReplacement !== bIsReplacement) {
        return aIsReplacement ? -1 : 1
      }

      return a.rowIndex - b.rowIndex
    })
}

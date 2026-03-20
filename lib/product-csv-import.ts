export function getProductCsvImportRowId(row: {_id?: unknown}): string | undefined {
  return typeof row._id === 'string' && row._id.trim()
    ? row._id.trim()
    : undefined
}

export function sortProductCsvImportRowsForProcessing<T extends {_id?: unknown}>(
  rows: T[],
): Array<{row: T; rowIndex: number}> {
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

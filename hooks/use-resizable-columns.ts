import {createHyfeStorageKey} from '@/lib/storage-keys'
import {useCallback, useEffect, useRef, useState} from 'react'

type ColumnWidths = Record<string, number>

const LEGACY_STORAGE_KEY_PREFIX = 'table-column-widths-'

export const useResizableColumns = (
  tableId: string,
  columns: Array<{uid: string; name: string; minWidth?: number}>,
  defaultWidths?: ColumnWidths,
) => {
  const storageKey = createHyfeStorageKey('table-column-widths', tableId)
  const legacyStorageKey = `${LEGACY_STORAGE_KEY_PREFIX}${tableId}`
  const [columnWidths, setColumnWidths] = useState<ColumnWidths>(() => {
    if (typeof window === 'undefined') {
      return defaultWidths ?? {}
    }
    try {
      const saved =
        localStorage.getItem(storageKey) ??
        localStorage.getItem(legacyStorageKey)
      if (saved) {
        const parsed = JSON.parse(saved) as ColumnWidths
        // Validate that all columns have widths
        const allColumnsHaveWidths = columns.every((col) => col.uid in parsed)
        if (allColumnsHaveWidths) {
          return parsed
        }
      }
    } catch (error) {
      console.error('[Resize] Error loading from localStorage:', error)
    }
    return defaultWidths ?? {}
  })

  const [resizingColumn, setResizingColumn] = useState<string | null>(null)
  const [startX, setStartX] = useState(0)
  const [startWidth, setStartWidth] = useState(0)
  const tableRef = useRef<HTMLDivElement | null>(null)

  // Save to localStorage whenever widths change
  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      Object.keys(columnWidths).length === 0
    ) {
      return
    }
    try {
      localStorage.setItem(storageKey, JSON.stringify(columnWidths))
      localStorage.removeItem(legacyStorageKey)
    } catch (error) {
      console.error('[Resize] Failed to save to localStorage:', error)
    }
  }, [columnWidths, legacyStorageKey, storageKey])

  const handleMouseDown = useCallback(
    (columnUid: string, event: React.MouseEvent) => {
      event.preventDefault()
      event.stopPropagation()

      const wrapper = tableRef.current
      let currentWidth = columnWidths[columnUid] ?? 150

      if (wrapper) {
        const table = wrapper.querySelector('table')
        if (table) {
          const headerCells = table.querySelectorAll('thead th')
          const columnIndex = columns.findIndex((col) => col.uid === columnUid)
          if (columnIndex >= 0 && headerCells[columnIndex]) {
            const cell = headerCells[columnIndex] as HTMLElement
            const rect = cell.getBoundingClientRect()
            currentWidth = rect.width
          }
        }
      }

      setResizingColumn(columnUid)
      setStartX(event.clientX)
      setStartWidth(currentWidth)
    },
    [columns, columnWidths],
  )

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!resizingColumn) {
        return
      }

      const diff = event.clientX - startX
      const column = columns.find((col) => col.uid === resizingColumn)
      const minWidth = column?.minWidth ?? 50 // Use column's minWidth or default to 50px
      const newWidth = Math.max(minWidth, startWidth + diff)

      setColumnWidths((prev) => {
        return {
          ...prev,
          [resizingColumn]: newWidth,
        }
      })
    },
    [resizingColumn, startX, startWidth, columns],
  )

  const handleMouseUp = useCallback(() => {
    setResizingColumn(null)
  }, [])

  useEffect(() => {
    if (resizingColumn) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }
  }, [resizingColumn, handleMouseMove, handleMouseUp])

  const getColumnWidth = useCallback(
    (columnUid: string): number | undefined => {
      return columnWidths[columnUid]
    },
    [columnWidths],
  )

  const resetColumnWidths = useCallback(() => {
    setColumnWidths(defaultWidths ?? {})
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(storageKey)
        localStorage.removeItem(legacyStorageKey)
      } catch {
        // Ignore storage errors
      }
    }
  }, [defaultWidths, legacyStorageKey, storageKey])

  return {
    columnWidths,
    resizingColumn,
    tableRef,
    handleMouseDown,
    getColumnWidth,
    resetColumnWidths,
  }
}

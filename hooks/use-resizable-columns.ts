import {useCallback, useEffect, useRef, useState} from 'react'

type ColumnWidths = Record<string, number>

const STORAGE_KEY_PREFIX = 'table-column-widths-'

export const useResizableColumns = (
  tableId: string,
  columns: Array<{uid: string; name: string; minWidth?: number}>,
  defaultWidths?: ColumnWidths,
) => {
  const storageKey = `${STORAGE_KEY_PREFIX}${tableId}`
  const [columnWidths, setColumnWidths] = useState<ColumnWidths>(() => {
    console.log('[Resize] Initializing columnWidths state', {storageKey, tableId, columns})
    if (typeof window === 'undefined') {
      console.log('[Resize] No window, using defaultWidths')
      return defaultWidths ?? {}
    }
    try {
      const saved = localStorage.getItem(storageKey)
      console.log('[Resize] localStorage.getItem result:', saved)
      if (saved) {
        const parsed = JSON.parse(saved) as ColumnWidths
        console.log('[Resize] Parsed localStorage:', parsed)
        // Validate that all columns have widths
        const allColumnsHaveWidths = columns.every((col) => col.uid in parsed)
        console.log('[Resize] All columns have widths:', allColumnsHaveWidths)
        if (allColumnsHaveWidths) {
          return parsed
        }
      }
    } catch (error) {
      console.error('[Resize] Error loading from localStorage:', error)
    }
    console.log('[Resize] Using defaultWidths:', defaultWidths)
    return defaultWidths ?? {}
  })

  const [resizingColumn, setResizingColumn] = useState<string | null>(null)
  const [startX, setStartX] = useState(0)
  const [startWidth, setStartWidth] = useState(0)
  const tableRef = useRef<HTMLDivElement | null>(null)

  // Save to localStorage whenever widths change
  useEffect(() => {
    console.log('[Resize] columnWidths changed:', columnWidths)
    if (typeof window === 'undefined' || Object.keys(columnWidths).length === 0) {
      console.log('[Resize] Skipping localStorage save - no window or empty widths')
      return
    }
    try {
      localStorage.setItem(storageKey, JSON.stringify(columnWidths))
      console.log('[Resize] Saved to localStorage:', storageKey, columnWidths)
    } catch (error) {
      console.error('[Resize] Failed to save to localStorage:', error)
    }
  }, [columnWidths, storageKey])

  const handleMouseDown = useCallback(
    (columnUid: string, event: React.MouseEvent) => {
      console.log('[Resize] handleMouseDown called', {columnUid, clientX: event.clientX})
      event.preventDefault()
      event.stopPropagation()
      
      const wrapper = tableRef.current
      console.log('[Resize] tableRef.current:', wrapper)
      let currentWidth = columnWidths[columnUid] ?? 150
      console.log('[Resize] initial width from state:', columnWidths[columnUid], 'fallback:', currentWidth)
      
      if (wrapper) {
        const table = wrapper.querySelector('table')
        console.log('[Resize] table element:', table)
        if (table) {
          const headerCells = table.querySelectorAll('thead th')
          console.log('[Resize] headerCells count:', headerCells.length)
          const columnIndex = columns.findIndex((col) => col.uid === columnUid)
          console.log('[Resize] columnIndex:', columnIndex)
          if (columnIndex >= 0 && headerCells[columnIndex]) {
            const cell = headerCells[columnIndex] as HTMLElement
            const rect = cell.getBoundingClientRect()
            currentWidth = rect.width
            console.log('[Resize] calculated width from DOM:', currentWidth, 'rect:', rect)
          }
        }
      }
      
      console.log('[Resize] Setting state:', {columnUid, startX: event.clientX, startWidth: currentWidth})
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

      console.log('[Resize] handleMouseMove', {
        resizingColumn,
        clientX: event.clientX,
        startX,
        diff,
        startWidth,
        minWidth,
        newWidth,
      })

      setColumnWidths((prev) => {
        const updated = {
          ...prev,
          [resizingColumn]: newWidth,
        }
        console.log('[Resize] Updating columnWidths:', updated)
        return updated
      })
    },
    [resizingColumn, startX, startWidth, columns],
  )

  const handleMouseUp = useCallback(() => {
    console.log('[Resize] handleMouseUp called, clearing resizingColumn')
    setResizingColumn(null)
  }, [])

  useEffect(() => {
    console.log('[Resize] Effect triggered, resizingColumn:', resizingColumn)
    if (resizingColumn) {
      console.log('[Resize] Adding event listeners')
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'

      return () => {
        console.log('[Resize] Removing event listeners')
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
      } catch {
        // Ignore storage errors
      }
    }
  }, [defaultWidths, storageKey])

  return {
    columnWidths,
    resizingColumn,
    tableRef,
    handleMouseDown,
    getColumnWidth,
    resetColumnWidths,
  }
}
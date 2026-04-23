'use client'
import {
  Column,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  Row,
  RowSelectionState,
  SortingState,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table'

import {useQueryState, useQueryStates} from 'nuqs'
import {
  ChangeEvent,
  ReactNode,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'

import {useSidebar} from '@/app/admin/_components/ui/sidebar'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {DialogWindow} from '@/components/ui/window'
import {useMobile} from '@/hooks/use-mobile'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {parseAsBoolean} from 'nuqs/server'
import {ColumnSort} from './column-sort-v2'
import {ColumnView} from './column-view-v3'
import {
  ColumnVisibilityProvider,
  useColumnVisibility,
} from './column-visibility-context'
import {
  ActionConfig,
  ColumnConfig,
  createColumns,
  globalFilterFn,
} from './create-column'
import {DeleteButton} from './delete-row-v2'
import {EmptyTable} from './empty-table-v2'
import {Filter} from './filter-v2'
import {HyperWrap} from './hyper-wrap'
import {MultiSelect} from './multi-select'
import {PageControl, Paginator} from './pagination-v2'
import {
  createColumnFiltersParser,
  createColumnVisibilityParser,
  createLoadedCountParser,
  createPaginationParser,
  createRowSelectionParser,
  createSortingParser,
  searchParser,
  selectModeParser,
} from './parsers-v2'
import {RenderRow} from './render-row'
import {Search} from './search-v2'
import {SelectToggle} from './select-toggle'
import {
  CenterTableToolbar,
  LeftTableToolbar,
  RightTableToolbar,
} from './toolbar'
import {ViewStyleGroup} from './view-style-group'

export interface TableToolbarContext<T> {
  getFilteredData: () => T[]
}

interface BulkUpdateSelectionArgs<T> {
  ids: string[]
  rows: T[]
  updates: Partial<T>
}

interface TableProps<T> {
  data: T[]
  title?: string
  loading: boolean
  editingRowId: string | null
  columnConfigs: ColumnConfig<T>[]
  actionConfig?: ActionConfig<T>
  onDeleteSelected?: (ids: string[]) => void | Promise<void>
  deleteActionLabel?: string
  onBulkUpdateSelected?: (
    args: BulkUpdateSelectionArgs<T>,
  ) => void | Promise<void>
  deleteIdAccessor?: keyof T
  selectedItemId?: string | null
  /** Default rows per page when no URL param is set. Defaults to 100. */
  defaultPageSize?: number
  /** Default loaded row count when no URL param is set. */
  defaultLoadedCount?: number
  /** Query param key used to persist the current loaded row count. */
  loadedCountParamKey?: string
  /** Initial column visibility when no column visibility URL param is set. */
  defaultColumnVisibility?: VisibilityState
  centerToolbarDateRange?: ReactNode
  rightToolbarLeft?:
    | ReactNode
    | ((context: TableToolbarContext<T>) => ReactNode)
}

function DataTableContent<T>({
  data,
  loading,
  editingRowId,
  columnConfigs,
  actionConfig,
  onDeleteSelected,
  deleteActionLabel = 'Delete selected',
  onBulkUpdateSelected,
  deleteIdAccessor = 'id' as keyof T,
  selectedItemId,
  defaultPageSize = 100,
  defaultLoadedCount = 100,
  loadedCountParamKey,
  centerToolbarDateRange,
  rightToolbarLeft,
}: TableProps<T>) {
  const [tableData, setTableData] = useState(data)
  const [bulkAction, setBulkAction] = useState<'idle' | 'update' | 'delete'>(
    'idle',
  )
  const {columnVisibility, setColumnVisibility} = useColumnVisibility()

  const paginationParserInstance = useMemo(
    () => createPaginationParser(defaultPageSize),
    [defaultPageSize],
  )
  const [pagination, setPagination] = useQueryStates(paginationParserInstance)
  const [globalFilter, setGlobalFilter] = useQueryState(
    'search',
    searchParser.withDefault(''),
  )
  const sortingParser = useMemo(() => createSortingParser(), [])
  const [sortingParam, setSortingParam] = useQueryState('sort', sortingParser)
  const columnFiltersParser = useMemo(() => createColumnFiltersParser(), [])
  const [columnFiltersParam, setColumnFiltersParam] = useQueryState(
    'filters',
    columnFiltersParser,
  )
  const rowSelectionParser = useMemo(() => createRowSelectionParser(), [])
  const [rowSelectionParam, setRowSelectionParam] = useQueryState(
    'selected',
    rowSelectionParser,
  )
  const [selectModeParam, setSelectModeParam] = useQueryState(
    'selectMode',
    selectModeParser,
  )

  const [multiRowCompact, setMultiRowCompact] = useQueryState(
    'multiRowCompact',
    parseAsBoolean.withDefault(false),
  )
  const loadedCountParser = useMemo(
    () => createLoadedCountParser(defaultLoadedCount),
    [defaultLoadedCount],
  )
  const [loadedCountParam, setLoadedCountParam] = useQueryState(
    loadedCountParamKey ?? '__tableLoadedCount',
    loadedCountParser,
  )

  const paginationState: PaginationState = useMemo(
    () => ({
      pageIndex: pagination.pageIndex ?? 0,
      pageSize: pagination.pageSize ?? defaultPageSize,
    }),
    [pagination.pageIndex, pagination.pageSize, defaultPageSize],
  )

  const columnFilters: ColumnFiltersState = useMemo(
    () => (Array.isArray(columnFiltersParam) ? columnFiltersParam : []),
    [columnFiltersParam],
  )

  const rowSelection: RowSelectionState = useMemo(
    () => rowSelectionParam ?? {},
    [rowSelectionParam],
  )

  const selectOn = useMemo(() => selectModeParam === 'true', [selectModeParam])

  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTableData(data)
  }, [data])

  useEffect(() => {
    if (
      !loadedCountParamKey ||
      loading ||
      data.length === 0 ||
      loadedCountParam === data.length
    ) {
      return
    }

    void setLoadedCountParam(data.length)
  }, [
    data.length,
    loadedCountParam,
    loadedCountParamKey,
    loading,
    setLoadedCountParam,
  ])

  const handleFilterChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    setGlobalFilter(e.target.value || null)
  }

  const clearGlobalFilter = useCallback(() => {
    setGlobalFilter(null)
  }, [setGlobalFilter])

  const handlePaginationChange = useCallback(
    (
      updater: PaginationState | ((old: PaginationState) => PaginationState),
    ) => {
      const newPagination =
        typeof updater === 'function' ? updater(paginationState) : updater
      setPagination({
        pageIndex: newPagination.pageIndex,
        pageSize: newPagination.pageSize,
      })
    },
    [paginationState, setPagination],
  )

  const handlePageSizeChange = useCallback(
    (value: string) => {
      const nextPageSize = Number(value) || paginationState.pageSize
      handlePaginationChange({
        ...paginationState,
        pageSize: nextPageSize,
      })
    },
    [paginationState, handlePaginationChange],
  )
  const sorting: SortingState = useMemo(
    () => (Array.isArray(sortingParam) ? sortingParam : []),
    [sortingParam],
  )
  const handleSortingChange = useCallback(
    (updater: SortingState | ((old: SortingState) => SortingState)) => {
      const newSorting =
        typeof updater === 'function' ? updater(sorting) : updater
      setSortingParam(newSorting)
    },
    [sorting, setSortingParam],
  )

  const handleColumnFiltersChange = useCallback(
    (
      updater:
        | ColumnFiltersState
        | ((old: ColumnFiltersState) => ColumnFiltersState),
    ) => {
      const newFilters =
        typeof updater === 'function' ? updater(columnFilters) : updater
      setColumnFiltersParam(newFilters)
    },
    [columnFilters, setColumnFiltersParam],
  )

  const handleRowSelectionChange = useCallback(
    (
      updater:
        | RowSelectionState
        | ((old: RowSelectionState) => RowSelectionState),
    ) => {
      const newSelection =
        typeof updater === 'function' ? updater(rowSelection) : updater
      setRowSelectionParam(newSelection)
    },
    [rowSelection, setRowSelectionParam],
  )

  const selectToggle = useCallback(() => {
    const nextSelectOn = !selectOn
    setSelectModeParam(nextSelectOn ? 'true' : 'false')

    if (!nextSelectOn) {
      setRowSelectionParam({})
    }
  }, [selectOn, setRowSelectionParam, setSelectModeParam])

  // const handleDeleteRows = () => {
  //   const selectedRows = table.getSelectedRowModel().rows;
  //   const updatedData = d.filter(
  //     (item) => !selectedRows.some((row) => row.original.id === item.id),
  //   );
  //   setData(updatedData);
  //   table.resetRowSelection();
  // };

  const columns = useMemo(
    () => createColumns(columnConfigs, actionConfig, selectOn),
    [columnConfigs, actionConfig, selectOn],
  )

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: handleSortingChange,
    enableSortingRemoval: false,
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: handlePaginationChange,
    onColumnFiltersChange: handleColumnFiltersChange,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: handleRowSelectionChange,
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    globalFilterFn: globalFilterFn,
    state: {
      sorting,
      pagination: paginationState,
      columnFilters,
      globalFilter: globalFilter ?? '',
      columnVisibility,
      rowSelection,
    },
  })

  useEffect(() => {
    const filterableColumnIds = new Set(
      table
        .getAllColumns()
        .filter((column) => column.getCanFilter())
        .map((column) => column.id),
    )

    const nextFilters = columnFilters.filter((filter) =>
      filterableColumnIds.has(filter.id),
    )

    if (nextFilters.length === columnFilters.length) {
      return
    }

    void setColumnFiltersParam(nextFilters)
  }, [columnFilters, setColumnFiltersParam, table])

  // Derive active filter columns from URL so Filter UI stays in sync with ?filters=
  const activeFilterColumns = useMemo(() => {
    const cols: Column<T, unknown>[] = []
    for (const f of columnFilters) {
      const col = table.getColumn(f.id)
      if (col?.getCanFilter()) cols.push(col)
    }
    return cols
  }, [table, columnFilters])

  const handleAddFilterColumn = useCallback(
    (columnId: string) => {
      if (columnFilters.some((f) => f.id === columnId)) return
      setColumnFiltersParam([
        ...columnFilters,
        {id: columnId, value: [] as string[]},
      ])
    },
    [columnFilters, setColumnFiltersParam],
  )

  const handleRemoveFilterColumn = useCallback(
    (columnId: string) => {
      setColumnFiltersParam(columnFilters.filter((f) => f.id !== columnId))
    },
    [columnFilters, setColumnFiltersParam],
  )

  const allCols = table.getAllColumns().filter((c) => c.getCanHide()) as Column<
    T,
    unknown
  >[]
  const columnVisibilitySignature = useMemo(
    () =>
      Object.entries(columnVisibility)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([id, visible]) => `${id}:${visible === false ? '0' : '1'}`)
        .join('|'),
    [columnVisibility],
  )

  // const rowCount = useMemo(() => table.getRowCount(), [table])
  const pageControl: PageControl = {
    gotoFirst: () => {
      handlePaginationChange({...paginationState, pageIndex: 0})
    },
    disabledPrev: !table.getCanPreviousPage(),
    gotoPrev: () => {
      handlePaginationChange({
        ...paginationState,
        pageIndex: Math.max(0, paginationState.pageIndex - 1),
      })
    },
    disabledNext: table.getCanNextPage() === false,
    gotoNext: () => {
      handlePaginationChange({
        ...paginationState,
        pageIndex: paginationState.pageIndex + 1,
      })
    },
    gotoLast: () => {
      const lastPageIndex = Math.max(
        0,
        Math.ceil(table.getRowCount() / paginationState.pageSize) - 1,
      )
      handlePaginationChange({
        ...paginationState,
        pageIndex: lastPageIndex,
      })
    },
  }

  const tableRows = table.getRowModel().rows
  const selectedRowModel = table.getSelectedRowModel().rows
  const selectedRows = selectedRowModel
  const selectedRowData = useMemo(
    () => selectedRows.map((row) => row.original),
    [selectedRows],
  )
  const selectedRowSignature = useMemo(
    () =>
      selectedRows
        .map((row) => row.id)
        .sort()
        .join('|'),
    [selectedRows],
  )

  const getSelectionIds = useCallback(
    (rows: Row<T>[]) =>
      rows.map((row) => {
        const value = row.original[deleteIdAccessor]
        return value == null ? row.id : String(value)
      }),
    [deleteIdAccessor],
  )

  const clearSelection = useCallback(() => {
    setRowSelectionParam({})
  }, [setRowSelectionParam])

  const handleDeleteSelectedRows = useCallback(async () => {
    if (selectedRows.length === 0 || bulkAction !== 'idle') return

    setBulkAction('delete')

    try {
      if (onDeleteSelected) {
        await onDeleteSelected(getSelectionIds(selectedRows))
      } else {
        const selectedRowIds = new Set(selectedRows.map((row) => row.id))
        setTableData((current) =>
          current.filter((_, index) => !selectedRowIds.has(String(index))),
        )
      }

      clearSelection()
    } finally {
      setBulkAction('idle')
    }
  }, [
    bulkAction,
    clearSelection,
    getSelectionIds,
    onDeleteSelected,
    selectedRows,
  ])

  const handleBulkUpdateRows = useCallback(
    async (updates: Partial<T>) => {
      if (
        selectedRows.length === 0 ||
        Object.keys(updates).length === 0 ||
        bulkAction !== 'idle'
      ) {
        return
      }

      setBulkAction('update')

      try {
        if (onBulkUpdateSelected) {
          await onBulkUpdateSelected({
            ids: getSelectionIds(selectedRows),
            rows: selectedRowData,
            updates,
          })
        } else {
          const selectedRowIds = new Set(selectedRows.map((row) => row.id))
          setTableData((current) =>
            current.map((item, index) => {
              if (!selectedRowIds.has(String(index))) {
                return item
              }

              return {
                ...(item as Record<string, unknown>),
                ...(updates as Record<string, unknown>),
              } as T
            }),
          )
        }
      } finally {
        setBulkAction('idle')
      }
    },
    [
      bulkAction,
      getSelectionIds,
      onBulkUpdateSelected,
      selectedRowData,
      selectedRows,
    ],
  )

  const toolbarLeftContent =
    typeof rightToolbarLeft === 'function'
      ? rightToolbarLeft({
          getFilteredData: () =>
            table.getFilteredRowModel().rows.map((r) => r.original),
        })
      : rightToolbarLeft

  const isMobile = useMobile()

  const id = useId()
  const {open: sidebarOpen} = useSidebar()

  return (
    <div className={cn('text-foreground max-w-full overflow-hidden')}>
      <div
        className={cn(
          'relative inset-0 dark:inset-0 md:pb-8 md:max-w-[84lvw] md:w-full max-w-full overflow-hidden mb-0',
          {'md:max-w-[96.25lvw]': !sidebarOpen},
        )}
      >
        <div className='portrait:sticky left-0 flex min-h-10.5 w-full max-w-full shrink-0 flex-nowrap items-center justify-between gap-2 overflow-x-auto overflow-y-visible md:gap-0'>
          <div className='flex shrink-0 flex-nowrap items-center gap-2 md:gap-3'>
            <LeftTableToolbar
              select={
                <SelectToggle
                  on={selectOn}
                  toggleFn={selectToggle}
                  rows={selectedRows}
                />
              }
              deleteRow={
                onDeleteSelected && (
                  <DeleteButton
                    rows={selectedRows}
                    onDelete={handleDeleteSelectedRows}
                    idAccessor={deleteIdAccessor}
                    disabled={loading || bulkAction !== 'idle'}
                  />
                )
              }
              views={<ViewStyleGroup />}
            />
            <CenterTableToolbar
              filter={
                <Filter
                  columns={allCols}
                  activeFilterColumns={activeFilterColumns}
                  onAddFilterColumn={handleAddFilterColumn}
                  onRemoveFilterColumn={handleRemoveFilterColumn}
                  isMobile={isMobile}
                />
              }
              dateRange={centerToolbarDateRange}
              view={
                <ColumnView
                  cols={allCols}
                  isMobile={isMobile}
                  onColumnVisibilityChange={setColumnVisibility}
                />
              }
            />
          </div>
          <RightTableToolbar
            left={toolbarLeftContent}
            search={
              <Search
                ref={inputRef}
                onChange={handleFilterChange}
                onClear={clearGlobalFilter}
                value={globalFilter ?? ''}
              />
            }
          />
        </div>
        {/* Table */}
        <HyperWrap className='h-[calc(100svh-7rem)] w-full max-w-full overflow-scroll pb-2 md:h-[93lvh] md:w-full md:pb-12'>
          <TableContainer>
            <Table
              className='w-fit min-w-4xl table-fixed'
              style={{width: `${table.getTotalSize()}px`}}
            >
              <TableHeader className='w-full'>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow
                    key={headerGroup.id}
                    className='bg-dark-table dark:bg-dark-table/0 md:h-8 h-7'
                  >
                    {headerGroup.headers
                      .filter((header) => header.column.getIsVisible())
                      .map((header) => {
                        const headerSize = header.getSize()
                        return (
                          <TableHead
                            key={header.id + id}
                            style={{
                              width: `${headerSize}px`,
                              minWidth: `${headerSize}px`,
                              maxWidth: `${headerSize}px`,
                            }}
                            className={cn(
                              'sticky top-0 z-20 bg-[#eceef2] md:h-8 h-7 uppercase overflow-hidden',
                              'font-clash font-medium tracking-tight text-dark-table/80 dark:text-white md:tracking-tight text-xs md:text-sm',
                              'dark:text-zinc-300 dark:bg-dark-table ps-2',
                            )}
                          >
                            <ColumnSort
                              flexRender={flexRender}
                              header={header}
                            />
                          </TableHead>
                        )
                      })}
                  </TableRow>
                ))}
              </TableHeader>

              <TableBody>
                {tableRows.length ? (
                  tableRows.map((row) => (
                    <RenderRow
                      key={`${row.id}:${columnVisibilitySignature}`}
                      row={row}
                      editingRowId={editingRowId}
                      showSelectColumn={selectOn}
                      selectedItemId={selectedItemId}
                    />
                  ))
                ) : (
                  <EmptyTable colSpan={columns.length} />
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <Paginator
            state={paginationState}
            rowCount={table.getRowCount()}
            setPageSize={handlePageSizeChange}
            pageControl={pageControl}
          />
        </HyperWrap>
      </div>

      <DialogWindow
        open={selectedRows.length > 0}
        onOpenChange={(open) => {
          if (!open) {
            clearSelection()
          }
        }}
        aria-label='Multi-Row Editor'
        actions={
          <Icon
            name='minus'
            className={cn('size-3.5 mr-3', {'mr-1.5': multiRowCompact})}
            onClick={() => setMultiRowCompact((b) => !b)}
          />
        }
        title={<span className='text-lg'>Multi-Row Editor</span>}
        description={`Review and confirm changed values before they are applied.`}
        className={cn(
          'h-auto max-h-none translate-x-0 rounded-xl border-dark-table/20',
          'w-[calc(100vw-1.5rem)] max-w-[31rem] md:w-[min(calc(100vw-3rem),31rem)]',
          {
            'w-[min(calc(100vw-16rem),32rem)] md:w-[min(calc(100vw-20rem),16rem)]':
              multiRowCompact,
          },
          'md:right-6 md:top-24 md:bottom-6 left-auto right-3 top-30 bottom-16 ',
        )}
      >
        <MultiSelect
          key={selectedRowSignature}
          selectedRows={selectedRowData}
          columnConfigs={columnConfigs}
          pending={loading || bulkAction !== 'idle'}
          onApply={handleBulkUpdateRows}
          onDeleteSelected={handleDeleteSelectedRows}
          deleteActionLabel={deleteActionLabel}
          isCompact={multiRowCompact}
        />
      </DialogWindow>
    </div>
  )
}

export const DataTable = <T,>(props: TableProps<T>) => {
  const columnVisibilityParser = useMemo(
    () => createColumnVisibilityParser(props.defaultColumnVisibility),
    [props.defaultColumnVisibility],
  )
  const [columnVisibilityParam, setColumnVisibilityParam] = useQueryState(
    'columns',
    columnVisibilityParser,
  )
  return (
    <ColumnVisibilityProvider
      valueFromUrl={columnVisibilityParam ?? {}}
      onVisibilityChange={setColumnVisibilityParam}
    >
      <DataTableContent<T> {...props} />
    </ColumnVisibilityProvider>
  )
}

const TableContainer = ({children}: {children: ReactNode}) => (
  <div className='relative h-full w-full overflow-x-auto'>
    <div className='inline-block min-w-full align-top'>{children}</div>
  </div>
)

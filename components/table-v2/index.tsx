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
  RowSelectionState,
  SortingState,
  useReactTable,
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
} from 'react'

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {useMobile} from '@/hooks/use-mobile'
import {cn} from '@/lib/utils'
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
import {PageControl, Paginator} from './pagination-v2'
import {
  createColumnFiltersParser,
  createColumnVisibilityParser,
  createRowSelectionParser,
  createSortingParser,
  paginationParser,
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

interface TableProps<T> {
  data: T[]
  title?: string
  loading: boolean
  editingRowId: string | null
  columnConfigs: ColumnConfig<T>[]
  actionConfig?: ActionConfig<T>
  onDeleteSelected?: (ids: string[]) => void | Promise<void>
  deleteIdAccessor?: keyof T
  selectedItemId?: string | null
  rightToolbarLeft?: ReactNode
}

function DataTableContent<T>({
  data,
  loading,
  editingRowId,
  columnConfigs,
  actionConfig,
  onDeleteSelected,
  deleteIdAccessor = 'id' as keyof T,
  selectedItemId,
  rightToolbarLeft,
}: TableProps<T>) {
  const {columnVisibility, setColumnVisibility} = useColumnVisibility()

  const [pagination, setPagination] = useQueryStates(paginationParser)
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

  const paginationState: PaginationState = useMemo(
    () => ({
      pageIndex: pagination.pageIndex ?? 0,
      pageSize: pagination.pageSize ?? 15,
    }),
    [pagination.pageIndex, pagination.pageSize],
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

  const handleFilterChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    setGlobalFilter(e.target.value || null)
  }

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
    setSelectModeParam(selectOn ? 'false' : 'true')
  }, [selectOn, setSelectModeParam])

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
    data,
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
  // Derive selectedRows during render (simple nullish coalescing)
  const selectedRows = selectedRowModel ?? []

  const isMobile = useMobile()

  // Listen for '/' keypress to focus search input
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if '/' key is pressed
      if (event.key !== '/') return

      // Don't trigger if user is typing in an input or textarea
      const target = event.target as HTMLElement
      const isTyping =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable

      // Only focus if not already typing and input is not already focused
      if (
        !isTyping &&
        inputRef.current &&
        document.activeElement !== inputRef.current
      ) {
        event.preventDefault()
        inputRef.current.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const id = useId()

  return (
    <div className={cn('text-foreground w-full duration-500 ease-in-out')}>
      <div className='h-[94lvh] inset-0 dark:inset-0 pb-8 min-w-0 overflow-hidden'>
        <div className='flex h-auto shrink flex-wrap items-center justify-between gap-2 md:h-10.5 md:flex-nowrap md:gap-0'>
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
                  onDelete={async (ids) => {
                    await onDeleteSelected(ids)
                    setRowSelectionParam({})
                  }}
                  idAccessor={deleteIdAccessor}
                  disabled={loading}
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
            view={
              <ColumnView
                cols={allCols}
                isMobile={isMobile}
                onColumnVisibilityChange={setColumnVisibility}
              />
            }
          />
          <RightTableToolbar
            left={rightToolbarLeft}
            search={
              <Search
                ref={inputRef}
                onChange={handleFilterChange}
                value={globalFilter ?? ''}
              />
            }
          />
        </div>
        {/* Table */}
        <HyperWrap className='h-[94lvh] md:h-[92lvh] pb-12'>
          <TableContainer>
            <Table className='w-fit min-w-4xl overflow-scroll'>
              <TableHeader className='w-full'>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow
                    key={headerGroup.id}
                    className='bg-dark-table dark:bg-dark-table/0'>
                    {headerGroup.headers
                      .filter((header) => header.column.getIsVisible())
                      .map((header) => {
                        return (
                          <TableHead
                            key={header.id + id}
                            style={{width: `${header.getSize()}px`}}
                            className={cn(
                              'sticky top-0 z-20 bg-light-gray/10 md:h-10 h-8 uppercase overflow-hidden',
                              'font-oksx font-semibold tracking-tighter text-white md:tracking-tight text-xs md:text-sm',
                              'dark:text-zinc-400 dark:bg-dark-table/30',
                            )}>
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
    </div>
  )
}

export const DataTable = <T,>(props: TableProps<T>) => {
  const columnVisibilityParser = useMemo(
    () => createColumnVisibilityParser(),
    [],
  )
  const [columnVisibilityParam, setColumnVisibilityParam] = useQueryState(
    'columns',
    columnVisibilityParser,
  )
  return (
    <ColumnVisibilityProvider
      valueFromUrl={columnVisibilityParam ?? {}}
      onVisibilityChange={setColumnVisibilityParam}>
      <DataTableContent<T> {...props} />
    </ColumnVisibilityProvider>
  )
}

const TableContainer = ({children}: {children: ReactNode}) => (
  <div className='relative h-full w-full overflow-x-auto'>
    <div className='inline-block min-w-full align-top'>{children}</div>
  </div>
)

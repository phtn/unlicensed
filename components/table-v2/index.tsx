'use client'
import {
  Cell,
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
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {useMobile} from '@/hooks/use-mobile'
import {cn} from '@/lib/utils'
import {ColumnSort} from './column-sort-v2'
import {ColumnView} from './column-view-v3'
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
import {PageControl} from './pagination-v2'
import {
  createColumnFiltersParser,
  createColumnVisibilityParser,
  createRowSelectionParser,
  createSortingParser,
  paginationParser,
  searchParser,
  selectModeParser,
} from './parsers-v2'
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
}

export const DataTable = <T,>({
  data,
  loading,
  editingRowId,
  columnConfigs,
  actionConfig,
  title = 'Data Table',
  onDeleteSelected,
  deleteIdAccessor = 'id' as keyof T,
  selectedItemId,
}: TableProps<T>) => {
  // URL state management with nuqs
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

  const columnVisibilityParser = useMemo(
    () => createColumnVisibilityParser(),
    [],
  )
  const [columnVisibilityParam, setColumnVisibilityParam] = useQueryState(
    'columns',
    columnVisibilityParser,
  )

  const rowSelectionParser = useMemo(() => createRowSelectionParser(), [])
  const [rowSelectionParam, setRowSelectionParam] = useQueryState(
    'select',
    rowSelectionParser,
  )

  const [selectModeParam, setSelectModeParam] = useQueryState(
    'selectMode',
    selectModeParser,
  )

  // Convert URL params to table state
  const paginationState: PaginationState = useMemo(
    () => ({
      pageIndex: pagination.pageIndex ?? 0,
      pageSize: pagination.pageSize ?? 15,
    }),
    [pagination.pageIndex, pagination.pageSize],
  )

  const sorting: SortingState = useMemo(
    () => sortingParam ?? [{id: 'createdAt', desc: false}],
    [sortingParam],
  )

  const columnFilters: ColumnFiltersState = useMemo(
    () => (Array.isArray(columnFiltersParam) ? columnFiltersParam : []),
    [columnFiltersParam],
  )

  const columnVisibility: VisibilityState = useMemo(
    () => columnVisibilityParam ?? {},
    [columnVisibilityParam],
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

  const handleColumnVisibilityChange = useCallback(
    (
      updater: VisibilityState | ((old: VisibilityState) => VisibilityState),
    ) => {
      const newVisibility =
        typeof updater === 'function' ? updater(columnVisibility) : updater
      setColumnVisibilityParam(newVisibility)
    },
    [columnVisibility, setColumnVisibilityParam],
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

  const [_data] = useState<T[]>(data)

  // const handleDeleteRows = () => {
  //   const selectedRows = table.getSelectedRowModel().rows;
  //   const updatedData = d.filter(
  //     (item) => !selectedRows.some((row) => row.original.id === item.id),
  //   );
  //   setData(updatedData);
  //   table.resetRowSelection();
  // };

  const columns = createColumns(columnConfigs, actionConfig, selectOn)

  const table = useReactTable({
    data: _data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: handleSortingChange,
    enableSortingRemoval: false,
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: handlePaginationChange,
    onColumnFiltersChange: handleColumnFiltersChange,
    onColumnVisibilityChange: handleColumnVisibilityChange,
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

  // State for active filter columns
  const [activeFilterColumns, setActiveFilterColumns] = useState<
    Column<T, unknown>[]
  >([])

  const allCols = table.getAllColumns().filter((c) => c.getCanHide()) as Column<
    T,
    unknown
  >[]

  const rowCount = table.getRowCount()
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
    disabledNext: !table.getCanNextPage(),
    gotoNext: () => {
      handlePaginationChange({
        ...paginationState,
        pageIndex: paginationState.pageIndex + 1,
      })
    },
    gotoLast: () => {
      const lastPageIndex = Math.max(
        0,
        Math.ceil(rowCount / paginationState.pageSize) - 1,
      )
      handlePaginationChange({
        ...paginationState,
        pageIndex: lastPageIndex,
      })
    },
  }

  const tableRows = table.getRowModel().rows
  const selectedRows = useMemo(
    () => table.getSelectedRowModel().rows ?? [],
    [rowSelection],
  )

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

  return (
    <div
      className={cn(
        'text-foreground bg-background/90 w-full max-w-full duration-500 ease-in-out',
      )}>
      <div className='h-[94lvh] md:h-[92lvh] inset-0 dark:inset-0 md:rounded-lg pb-8 min-w-0 max-w-full'>
        <div className='flex items-center justify-between h-10 max-w-[calc(85lvw)] bg-background overflow-scroll'>
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
                onFilterColumnsChange={setActiveFilterColumns}
                isMobile={isMobile}
              />
            }
            view={<ColumnView cols={allCols} isMobile={isMobile} />}
          />
          <RightTableToolbar
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
        <HyperWrap className='relative gap-0 space-y-0 mb-0 h-[94lvh] md:h-[92lvh] inset-0 dark:inset-0 md:rounded-2xl pb-8 min-w-0 rounded-t-3xl overflow-hidden'>
          <TableContainer>
            <Table className='w-full'>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow
                    key={headerGroup.id}
                    className='bg-sidebar/10 dark:bg-dark-table/10'>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead
                          key={header.id}
                          style={{width: `${header.getSize()}px`}}
                          className={cn(
                            'sticky top-0 z-20 bg-light-gray/10 md:h-10 h-8 uppercase overflow-hidden dark:bg-amber-100',
                            'font-oksx font-semibold tracking-tighter text-foreground/70 md:tracking-tight text-xs md:text-sm',
                            'dark:text-zinc-400 dark:bg-dark-table/10',
                          )}>
                          <ColumnSort flexRender={flexRender} header={header} />
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>

              <TableBody>
                {tableRows.length ? (
                  tableRows.map((row) =>
                    renderRow(
                      row,
                      editingRowId,
                      row.id,
                      selectOn,
                      selectedItemId,
                    ),
                  )
                ) : (
                  <EmptyTable colSpan={columns.length} />
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </HyperWrap>

        {/* Pagination */}
        {/*<Paginator
          state={paginationState}
          rowCount={rowCount}
          setPageSize={useCallback(
            (value: string) => {
              handlePaginationChange({
                ...paginationState,
                pageSize: +value,
              })
            },
            [paginationState, handlePaginationChange],
          )}
          pageControl={pageControl}
        />*/}
      </div>
    </div>
  )
}

const renderRow = <T,>(
  row: Row<T>,
  editingRowId: string | null,
  rowId: string,
  showSelectColumn?: boolean,
  selectedItemId?: string | null,
) => {
  const isEditing = editingRowId === rowId
  // Compare the row's original data cardId with selectedItemId
  const rowCardId = (row.original as Record<string, unknown>)?.cardId as
    | string
    | undefined
  const isSelected = selectedItemId != null && rowCardId === selectedItemId

  const handleRowClick = (e: React.MouseEvent) => {
    // Don't toggle selection if clicking on interactive elements
    if (
      e.target instanceof HTMLElement &&
      (e.target.closest('button') ||
        e.target.closest('input') ||
        e.target.closest('a') ||
        e.target.closest('[role="button"]'))
    ) {
      return
    }

    // Only toggle if select mode is on and row can be selected
    if (showSelectColumn && row.getCanSelect()) {
      row.getToggleSelectedHandler()({})
    }
  }

  return (
    <TableRow
      key={row.id}
      data-state={row.getIsSelected() && 'selected'}
      className={cn(
        'h-14 md:h-16 text-foreground text-xs md:text-base overflow-hidden dark:border-greyed group/row dark:hover:bg-background/40 border-b-origin/40',
        'peer-hover:border-transparent bg-transparent hover:last:rounded-tr-2xl hover:bg-light-gray/10 transition-colors duration-75',
        {
          // Apply editing styles - same as hover but persistent
          ' dark:bg-sky-600/40 last:rounded-tr-2xl': isEditing,
          // Apply selected styles when viewer is open - same as hover but persistent
          'dark:bg-background/40 bg-primary-hover/5 last:rounded-tr-2xl':
            isSelected && !isEditing,
          // Add cursor pointer when select mode is on
          'cursor-pointer': showSelectColumn && row.getCanSelect(),
        },
      )}
      onClick={handleRowClick}>
      {row
        .getVisibleCells()
        .map((cell) => renderCell(cell, isEditing || isSelected))}
    </TableRow>
  )
}

const renderCell = <TData, TValue>(
  cell: Cell<TData, TValue>,
  isEditing: boolean,
) => (
  <TableCell
    key={cell.id}
    className={cn(
      'last:py-0 overflow-hidden',
      'transition-colors duration-300',
      {
        // Apply editing cell styles - same as hover but persistent
        'dark:bg-chalk-100/0': isEditing,
      },
    )}>
    {flexRender(cell.column.columnDef.cell, cell.getContext())}
  </TableCell>
)

const TableContainer = ({children}: {children: React.ReactNode}) => (
  <div className='relative rounded-t-sm pb-10 w-full max-w-full overflow-x-auto'>
    <div className='min-w-0'>{children}</div>
  </div>
)

const Title = ({title}: {title: string}) => (
  <div className='w-fit md:w-full md:mx-4'>
    <h2 className='capitalize text-lg leading-4 md:leading-5 md:text-2xl font-bold font-figtree tracking-tighter'>
      {title}
    </h2>
  </div>
)

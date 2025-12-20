'use client'

import {api} from '@/convex/_generated/api'
import {Id, type Doc} from '@/convex/_generated/dataModel'
import {useResizableColumns} from '@/hooks/use-resizable-columns'
import {useStorageUrls} from '@/hooks/use-storage-urls'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {
  Button,
  ButtonGroup,
  Card,
  Chip,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Image,
  Input,
  SharedSelection,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import {Key, useCallback, useEffect, useMemo, useState} from 'react'
import {useProductDetails} from '../../_components/product-details-context'
import {actionsCell, moneyCell, textCell} from '../../_components/ui/cells'
import {useSettingsPanel} from '../../_components/ui/settings'

type Product = Doc<'products'>

const columns = [
  {name: 'PRODUCT', uid: 'product', minWidth: 200},
  {name: 'CATEGORY', uid: 'category', minWidth: 100},
  {name: 'PRICE', uid: 'price', minWidth: 80},
  {name: 'UNIT', uid: 'unit', minWidth: 80},
  {name: 'STOCK', uid: 'stock', minWidth: 80},
  {name: 'STATUS', uid: 'status', minWidth: 100},
  {name: 'ACTIONS', uid: 'actions', minWidth: 56},
]

const getKey = (product: Product) => String(product._id)

export const statusOptions = [
  {name: 'Active', uid: 'active'},
  {name: 'Featured', uid: 'featured'},
  {name: 'Inactive', uid: 'inactive'},
]

export const InventoryTable = () => {
  const products = useQuery(api.products.q.listProducts, {limit: 100})
  // const productImage = useQuery(api.products.q.getPrimaryImage, 'skip')
  const categoriesData = useQuery(api.categories.q.listCategories)
  const categories = useMemo(() => categoriesData ?? [], [categoriesData])
  const {selectedProduct, setSelectedProduct} = useProductDetails()
  const {open, setOpen} = useSettingsPanel()
  const selectedProductId = selectedProduct?._id
  const bulkUpdatePrices = useMutation(api.products.m.bulkUpdatePrices)

  // Get all product image IDs for URL resolution
  const productImageIds = useMemo(
    () => products?.map((p) => p.image).filter(Boolean) ?? [],
    [products],
  )

  const productImages = useQuery(api.uploads.getStorageUrls, {
    storageIds: productImageIds as Array<Id<'_storage'>>,
  })


  const {
    columnWidths,
    resizingColumn,
    tableRef,
    handleMouseDown,
    getColumnWidth,
  } = useResizableColumns('inventory-table', columns)

  const [hoveredColumn, setHoveredColumn] = useState<string | null>(null)

  // Apply widths directly to DOM elements
  useEffect(() => {
    if (tableRef.current) {
      const table = tableRef.current.querySelector('table')
      if (table) {
        // Limit checkbox column width to w-14 (3.5rem = 56px)
        const headerCells = table.querySelectorAll('thead th')
        const bodyRows = table.querySelectorAll('tbody tr')

        // First column is the checkbox column
        if (headerCells[0]) {
          const checkboxHeader = headerCells[0] as HTMLElement
          checkboxHeader.style.width = '56px'
          checkboxHeader.style.minWidth = '56px'
          checkboxHeader.style.maxWidth = '56px'
        }

        bodyRows.forEach((row) => {
          const cells = row.querySelectorAll('td')
          if (cells[0]) {
            const checkboxCell = cells[0] as HTMLElement
            checkboxCell.style.width = '56px'
            checkboxCell.style.minWidth = '56px'
            checkboxCell.style.maxWidth = '56px'
          }
        })

        // Apply custom column widths if they exist
        if (Object.keys(columnWidths).length > 0) {
          // Skip first column (checkbox) and apply widths starting from index 1
          headerCells.forEach((cell, index) => {
            if (index === 0) return // Skip checkbox column
            const uid = columns[index - 1]?.uid // Adjust index for checkbox column
            const width = getColumnWidth(uid)
            if (width && uid) {
              const htmlCell = cell as HTMLElement
              htmlCell.style.width = `${width}px`
              htmlCell.style.minWidth = `${width}px`
              htmlCell.style.maxWidth = `${width}px`
            }
          })

          bodyRows.forEach((row) => {
            const cells = row.querySelectorAll('td')
            cells.forEach((cell, index) => {
              if (index === 0) return // Skip checkbox column
              const uid = columns[index - 1]?.uid // Adjust index for checkbox column
              const width = getColumnWidth(uid)
              if (width && uid) {
                const htmlCell = cell as HTMLElement
                htmlCell.style.width = `${width}px`
                htmlCell.style.minWidth = `${width}px`
                htmlCell.style.maxWidth = `${width}px`
              }
            })
          })
        }
      }
    }
  }, [columnWidths, getColumnWidth, hoveredColumn, columns])

  const [filterValue, setFilterValue] = useState('')
  const [selectedRow, setSelectedRow] = useState<Id<'products'> | null>(null)
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [isChangingPrice, setIsChangingPrice] = useState(false)
  const [priceInput, setPriceInput] = useState('')
  const [visibleColumns, setVisibleColumns] = useState<Set<string> | 'all'>(
    new Set(columns.map((col) => col.uid)),
  )
  const [statusFilter, setStatusFilter] = useState<Set<string>>(
    new Set(statusOptions.map((s) => s.uid)),
  )
  const [categoryFilter, setCategoryFilter] = useState<Set<string>>(
    new Set(['all']),
  )

  const hasSearchFilter = Boolean(filterValue)

  const filteredItems = useMemo(() => {
    let filteredProducts: Product[] | undefined = products

    if (hasSearchFilter) {
      filteredProducts =
        filteredProducts?.filter((product) =>
          product.name?.toLowerCase().includes(filterValue.toLowerCase()),
        ) ?? []
    }

    // Status filter
    if (statusFilter.size > 0 && statusFilter.size < statusOptions.length) {
      filteredProducts =
        filteredProducts?.filter((product) => {
          const status = product.available
            ? 'active'
            : product.featured
              ? 'featured'
              : 'inactive'
          return statusFilter.has(status)
        }) ?? []
    }

    // Category filter
    if (
      categoryFilter.size > 0 &&
      !categoryFilter.has('all') &&
      categoryFilter.size < categories.length + 1
    ) {
      filteredProducts =
        filteredProducts?.filter((product) => {
          const category = product.categorySlug ?? 'uncategorized'
          return categoryFilter.has(category)
        }) ?? []
    }

    return filteredProducts
  }, [
    hasSearchFilter,
    products,
    filterValue,
    statusFilter,
    categoryFilter,
    categories.length,
  ])

  const onSearchChange = useCallback((value: string) => {
    if (value) {
      setFilterValue(value)
    } else {
      setFilterValue('')
    }
  }, [])

  const onClear = useCallback(() => {
    setFilterValue('')
  }, [])

  const onStatusFilterChange = useCallback((keys: SharedSelection) => {
    if (keys === 'all') {
      setStatusFilter(new Set(statusOptions.map((s) => s.uid)))
    } else {
      const keySet = new Set(Array.from(keys).map((k) => String(k)))
      setStatusFilter(keySet)
    }
  }, [])

  const onCategoryFilterChange = useCallback((keys: SharedSelection) => {
    // Handle 'all' string case
    if (keys === 'all') {
      setCategoryFilter(new Set(['all']))
      return
    }

    // Convert SharedSelection to Set<string>
    const keysArray: Key[] =
      keys instanceof Set
        ? Array.from(keys)
        : Array.isArray(keys)
          ? keys
          : Array.from(keys as Iterable<Key>)

    const keySet = new Set(keysArray.map((k) => String(k)))

    // If 'all' is selected along with other items, remove 'all' and keep others
    if (keySet.has('all') && keySet.size > 1) {
      keySet.delete('all')
      setCategoryFilter(keySet)
      return
    }

    // If only 'all' is selected, keep it
    if (keySet.has('all')) {
      setCategoryFilter(new Set(['all']))
      return
    }

    // Otherwise, use the selected keys (categories)
    if (keySet.size === 0) {
      // Fallback to 'all' if nothing selected
      setCategoryFilter(new Set(['all']))
    } else {
      setCategoryFilter(keySet)
    }
  }, [])

  const onVisibleColumnsChange = useCallback((keys: SharedSelection) => {
    if (keys === 'all') {
      setVisibleColumns('all')
    } else {
      const keySet = new Set(Array.from(keys).map((k) => String(k)))
      setVisibleColumns(keySet)
    }
  }, [])

  const onSelectionChange = useCallback(
    (keys: SharedSelection) => {
      if (keys === 'all') {
        const allKeys = new Set(filteredItems?.map((p) => getKey(p)) ?? [])
        setSelectedRows(allKeys)
      } else {
        const keySet = new Set(Array.from(keys).map((k) => String(k)))
        setSelectedRows(keySet)
      }
    },
    [filteredItems],
  )

  const handleViewProduct = (product: Product) => () => {
    if (product) {
      setSelectedProduct(product)
      setSelectedRow(product._id)
      setOpen(true)
    }
  }

  const renderCell = (product: Product, columnKey: Key) => {
    switch (columnKey) {
      case 'product':
        return (
          <div className='flex items-center gap-3'>
            <Image
              src={
                productImages?.filter((p) => p.storageId === product.image)?.[0]
                  ?.url || '/default-product-image.svg'
              }
              alt={product.name}
              className='w-12 h-auto aspect-square object-cover rounded shrink-0'
            />
            <div className='flex flex-col'>
              <p className='text-bold text-sm whitespace-nowrap'>
                {product.name}
              </p>
              {/*<p className='text-xs italic opacity-60'>{product.slug}</p>*/}
            </div>
          </div>
        )
      case 'category':
        return (
          <div className='flex flex-col'>
            <p className='text-bold text-sm capitalize'>
              {product.categorySlug ?? 'Uncategorized'}
            </p>
          </div>
        )
      case 'price':
        return moneyCell(product.priceCents ?? 0)
      case 'unit':
        return textCell(product.unit ?? '')
      case 'stock':
        return (
          <div className='flex flex-col items-center'>
            <p className='text-bold text-sm'>
              {product.stock !== undefined ? product.stock : 'N/A'}
            </p>
          </div>
        )
      case 'status':
        const status = product.available
          ? 'active'
          : product.featured
            ? 'featured'
            : 'inactive'
        return (
          <Chip
            className='capitalize'
            color={
              status === 'featured'
                ? 'success'
                : status === 'active'
                  ? 'default'
                  : 'danger'
            }
            size='sm'
            variant='flat'>
            {status === 'featured'
              ? 'Featured'
              : status === 'active'
                ? 'Active'
                : 'Inactive'}
          </Chip>
        )
      case 'actions':
        return actionsCell(
          selectedRow === product._id,
          handleViewProduct(product),
        )
      default:
        return null
    }
  }

  const classNames = useMemo(
    () => ({
      wrapper: ['max-h-[382px]', 'max-w-3xl'],
      table: ['table-fixed', 'w-full', '!table-fixed'],
      th: [
        'bg-transparent',
        'text-gray-400',
        'border-b',
        'border-divider',
        '[&:first-child]:w-14',
        '[&:first-child]:min-w-14',
        '[&:first-child]:max-w-14',
      ],
      td: [
        'group-data-[first=true]:first:before:rounded-none',
        'group-data-[first=true]:last:before:rounded-none',
        'group-data-[middle=true]:before:rounded-none',
        'group-data-[last=true]:first:before:rounded-none',
        'group-data-[last=true]:last:before:rounded-none',
        '[&:first-child]:w-14',
        '[&:first-child]:min-w-14',
        '[&:first-child]:max-w-14',
      ],
    }),
    [],
  )

  const handleChangePrice = useCallback(() => {
    setIsChangingPrice(true)
    setPriceInput('')
  }, [])

  const handleCancelPriceChange = useCallback(() => {
    setIsChangingPrice(false)
    setPriceInput('')
  }, [])

  const handleSubmitPriceChange = useCallback(async () => {
    const priceValue = parseFloat(priceInput)
    if (isNaN(priceValue) || priceValue < 0) {
      return
    }

    const selectedProductIds = Array.from(selectedRows).map(
      (id) => id as Id<'products'>,
    )
    const priceCents = Math.round(priceValue * 100)

    try {
      await bulkUpdatePrices({
        productIds: selectedProductIds,
        priceCents,
      })
      setIsChangingPrice(false)
      setPriceInput('')
      setSelectedRows(new Set())
    } catch (error) {
      console.error('Failed to update prices:', error)
    }
  }, [priceInput, selectedRows, bulkUpdatePrices])

  const topContent = useMemo(() => {
    return (
      <div className='flex flex-col gap-4'>
        <div className='flex justify-between gap-3 items-end'>
          <Input
            isClearable
            className='w-full sm:max-w-[24%]'
            classNames={{
              inputWrapper: 'border-gray-400 dark:bg-neutral-600/20',
            }}
            placeholder='Search by name...'
            startContent={<Icon name='search' />}
            value={filterValue}
            onClear={onClear}
            onValueChange={onSearchChange}
          />
          {selectedRows.size > 0 && (
            <div className='flex items-center gap-2'>
              <span className='text-sm text-default-500'>
                {selectedRows.size} selected
              </span>
              {isChangingPrice ? (
                <div className='flex items-center gap-2'>
                  <Input
                    type='number'
                    placeholder='Enter new price'
                    value={priceInput}
                    onValueChange={setPriceInput}
                    startContent={<Icon name='dollar' className='size-4' />}
                    classNames={{
                      inputWrapper:
                        'border-gray-400 dark:bg-neutral-600/20 w-40',
                    }}
                    min='0'
                    step='0.01'
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSubmitPriceChange()
                      } else if (e.key === 'Escape') {
                        handleCancelPriceChange()
                      }
                    }}
                  />
                  <Button
                    size='sm'
                    color='primary'
                    onPress={handleSubmitPriceChange}
                    isDisabled={!priceInput || isNaN(parseFloat(priceInput))}>
                    Save
                  </Button>
                  <Button
                    size='sm'
                    variant='light'
                    onPress={handleCancelPriceChange}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <Dropdown>
                  <DropdownTrigger>
                    <Button
                      variant='flat'
                      className='text-blue-400'
                      endContent={
                        <Icon name='arrow-down' className='size-4' />
                      }>
                      Actions
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu
                    aria-label='Bulk Actions'
                    onAction={(key) => {
                      if (key === 'change-price') {
                        handleChangePrice()
                      }
                    }}>
                    <DropdownItem
                      key='change-price'
                      startContent={<Icon name='dollar' className='size-5' />}>
                      Change Price
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              )}
            </div>
          )}
          <ButtonGroup variant='flat'>
            <Dropdown>
              <DropdownTrigger className='hidden sm:flex'>
                <Button
                  endContent={<Icon name='3d-box-light' className='size-4' />}
                  variant='flat'>
                  Category
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label='Category Filter'
                closeOnSelect={false}
                selectedKeys={categoryFilter}
                selectionMode='multiple'
                onSelectionChange={onCategoryFilterChange}>
                <>
                  <DropdownItem key='all' className='capitalize'>
                    All Categories
                  </DropdownItem>
                  {categories.map((category, i) => (
                    <DropdownItem
                      key={category.slug ?? i}
                      className='capitalize'>
                      {category.name}
                    </DropdownItem>
                  ))}
                  <DropdownItem
                    key='uncategorized'
                    className='capitalize opacity-60'>
                    Uncategorized
                  </DropdownItem>
                </>
              </DropdownMenu>
            </Dropdown>
            <Dropdown>
              <DropdownTrigger className='hidden sm:flex'>
                <Button
                  endContent={
                    <div className='-scale-x-100'>
                      <Icon name='arrow-swap' className='size-4 rotate-30' />
                    </div>
                  }
                  variant='flat'>
                  Status
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection
                aria-label='Status Filter'
                closeOnSelect={false}
                selectedKeys={statusFilter}
                selectionMode='multiple'
                onSelectionChange={onStatusFilterChange}>
                {statusOptions.map((status) => (
                  <DropdownItem key={status.uid} className='capitalize'>
                    {status.name}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
            <Dropdown>
              <DropdownTrigger className='hidden sm:flex'>
                <Button
                  endContent={
                    <Icon name='arrow-down-long-light' className='size-4' />
                  }
                  variant='flat'>
                  Columns
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection
                aria-label='Table Columns'
                closeOnSelect={false}
                selectedKeys={visibleColumns}
                selectionMode='multiple'
                onSelectionChange={onVisibleColumnsChange}>
                {columns.map((column) => (
                  <DropdownItem key={column.uid} className='capitalize'>
                    {column.uid}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
          </ButtonGroup>
        </div>
        <div className='hidden _flex justify-between items-center'>
          <span className='text-default-400 text-small'>
            Total {filteredItems?.length} items
          </span>
          <label className='flex items-center text-default-400 text-small'>
            Rows per page:
            <select
              className='hidden bg-transparent outline-solid outline-transparent text-default-400 text-small'
              // onChange={onRowsPerPageChange}
            >
              <option value='5'>5</option>
              <option value='10'>10</option>
              <option value='15'>15</option>
            </select>
          </label>
        </div>
      </div>
    )
  }, [
    statusFilter,
    categoryFilter,
    visibleColumns,
    filteredItems,
    onSearchChange,
    onStatusFilterChange,
    onCategoryFilterChange,
    onVisibleColumnsChange,
    filterValue,
    onClear,
    categories,
    selectedRows.size,
    isChangingPrice,
    priceInput,
    handleChangePrice,
    handleCancelPriceChange,
    handleSubmitPriceChange,
  ])

  if (!products) {
    return (
      <Card shadow='sm' className='p-4'>
        <p className='text-sm text-gray-400'>Loading inventory...</p>
      </Card>
    )
  }

  return (
    <>
      {topContent}
      <Card shadow='sm' className='p-4'>
        <div ref={tableRef} className='relative'>
          <Table
            key={`table-${selectedProductId || 'none'}-${open}`}
            isCompact
            removeWrapper
            aria-label='Inventory table'
            classNames={classNames}
            selectionMode='multiple'
            selectedKeys={selectedRows}
            onSelectionChange={onSelectionChange}>
            <TableHeader columns={columns} className='select-none'>
              {(column) => {
                const width = getColumnWidth(column.uid)
                // const isResizing = resizingColumn === column.uid
                const isHovered = hoveredColumn === column.uid
                const columnIndex = columns.findIndex(
                  (col) => col.uid === column.uid,
                )
                const isLastColumn = columnIndex === columns.length - 1

                const columnStyle = width
                  ? {
                      width: `${width}px`,
                      minWidth: `${width}px`,
                      maxWidth: `${width}px`,
                    }
                  : undefined

                return (
                  <TableColumn
                    key={column.uid}
                    className={cn('text-start relative group/column h-fit', {
                      'w-16': column.uid === 'actions' && !width,
                      'text-center w-18': column.uid === 'price' && !width,
                      'text-center w-16': column.uid === 'stock' && !width,
                      'text-center w-64': column.uid === 'product' && !width,
                    })}
                    style={columnStyle}
                    align={column.uid === 'actions' ? 'center' : 'start'}>
                    <div
                      className='relative w-full select-none'
                      onMouseEnter={() => {
                        setHoveredColumn(column.uid)
                      }}
                      onMouseLeave={() => {
                        setHoveredColumn(null)
                      }}>
                      {isHovered && (
                        <div className='absolute inset-0 bg-primary/20 pointer-events-none z-0' />
                      )}
                      <div className='flex items-center justify-between w-full relative z-10'>
                        <span className='flex items-center select-none'>
                          {column.name.toLowerCase() === 'price' && (
                            <Icon name='dollar' className='size-3.5' />
                          )}
                          {column.name}
                        </span>
                      </div>
                    </div>
                    {!isLastColumn && (
                      <>
                        <div
                          className={cn(
                            'absolute right-0 top-1/4 bottom-0 cursor-col-resize z-30 size-4 aspect-square',
                          )}
                          style={{
                            right: '3px',
                            width: '6px',
                            marginRight: '3px',
                          }}
                          onMouseDown={(e) => {
                            handleMouseDown(column.uid, e)
                          }}
                          role='separator'
                          aria-label={`Resize ${column.name} column`}>
                          <Icon
                            name='width-rounded'
                            className='size-4 hidden group-hover/column:flex'
                          />
                        </div>
                      </>
                    )}
                  </TableColumn>
                )
              }}
            </TableHeader>
            <TableBody emptyContent={'No products found'} items={filteredItems}>
              {(product) => {
                const isSelected = Boolean(
                  selectedProductId &&
                  product._id &&
                  String(selectedProductId) === String(product._id) &&
                  open,
                )
                return (
                  <TableRow
                    key={getKey(product)}
                    data-product-selected={isSelected ? 'true' : 'false'}
                    className={cn(
                      'h-16 border-b-[0.5px] last:border-b-0 border-neutral-500/20 hover:bg-emerald-400/10 transition-colors duration-75 relative',
                      selectedRow === product._id && isSelected
                        ? 'bg-emerald-400/15 border-emerald-400/30'
                        : '',
                    )}>
                    {(columnKey) => {
                      const width = getColumnWidth(String(columnKey))
                      const columnIndex = columns.findIndex(
                        (col) => col.uid === String(columnKey),
                      )
                      const isLastColumn = columnIndex === columns.length - 1
                      const isResizing = resizingColumn === String(columnKey)
                      const isHovered = hoveredColumn === String(columnKey)

                      const cellStyle = width
                        ? {
                            width: `${width}px`,
                            minWidth: `${width}px`,
                            maxWidth: `${width}px`,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }
                        : undefined

                      return (
                        <TableCell
                          className='relative'
                          style={cellStyle}
                          onMouseEnter={() =>
                            setHoveredColumn(String(columnKey))
                          }
                          onMouseLeave={() => setHoveredColumn(null)}>
                          {isHovered && (
                            <div className='absolute inset-0 bg-primary/15 pointer-events-none z-0' />
                          )}
                          <div className='relative z-10'>
                            {renderCell(product, columnKey)}
                          </div>
                          {!isLastColumn && (
                            <div
                              className={cn(
                                'absolute right-0 top-0 bottom-0 pointer-events-none z-20',
                                isResizing && 'bg-primary',
                              )}
                              style={{
                                right: '0px',
                                width: '1px',
                                height: '100%',
                              }}
                            />
                          )}
                        </TableCell>
                      )
                    }}
                  </TableRow>
                )
              }}
            </TableBody>
          </Table>
        </div>
      </Card>
    </>
  )
}

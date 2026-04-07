// 'use client'

// import {api} from '@/convex/_generated/api'
// import {Id, type Doc} from '@/convex/_generated/dataModel'
// import {useResizableColumns} from '@/hooks/use-resizable-columns'
// import {useStorageUrls} from '@/hooks/use-storage-urls'
// import {Icon} from '@/lib/icons'
// import {cn} from '@/lib/utils'
// import {Button, ButtonGroup, Card, Chip, Dropdown} from '@heroui/react'
// import {useMutation, usePaginatedQuery, useQuery} from 'convex/react'
// import {Key, useCallback, useEffect, useMemo, useState} from 'react'
// import {useProductDetails} from '../../_components/product-details-context'
// import {actionsCell, moneyCell, textCell} from '../../_components/ui/cells'
// import {useSettingsPanel} from '../../_components/ui/settings'

// import {Input} from '@/components/hero-v3/input'
// import {LegacyImage as Image} from '@/components/ui/legacy-image'

// type Product = Doc<'products'>

// const INVENTORY_PAGE_SIZE = 100

// const columns = [
//   {name: 'PRODUCT', uid: 'product', minWidth: 200},
//   {name: 'CATEGORY', uid: 'category', minWidth: 100},
//   {name: 'PRICE', uid: 'price', minWidth: 80},
//   {name: 'UNIT', uid: 'unit', minWidth: 80},
//   {name: 'STOCK', uid: 'stock', minWidth: 80},
//   {name: 'STATUS', uid: 'status', minWidth: 100},
//   {name: 'ACTIONS', uid: 'actions', minWidth: 56},
// ]

// const getKey = (product: Product) => String(product._id)

// export const statusOptions = [
//   {name: 'Active', uid: 'active'},
//   {name: 'Featured', uid: 'featured'},
//   {name: 'Inactive', uid: 'inactive'},
// ]

// export const InventoryTable = () => {
//   const {
//     results: paginatedProducts,
//     status: paginatedProductsStatus,
//     loadMore,
//   } = usePaginatedQuery(
//     api.products.q.listProductsPaginated,
//     {},
//     {initialNumItems: INVENTORY_PAGE_SIZE},
//   )
//   const categoriesData = useQuery(api.categories.q.listCategories)
//   const categories = useMemo(() => categoriesData ?? [], [categoriesData])
//   const products = useMemo(() => paginatedProducts, [paginatedProducts])
//   const {selectedProduct, setSelectedProduct} = useProductDetails()
//   const {open, setOpen} = useSettingsPanel()
//   const selectedProductId = selectedProduct?._id
//   const bulkUpdatePrices = useMutation(api.products.m.bulkUpdatePrices)
//   const canLoadMoreProducts = paginatedProductsStatus === 'CanLoadMore'
//   const isLoadingMoreProducts = paginatedProductsStatus === 'LoadingMore'
//   const isLoadingInitialProducts =
//     paginatedProductsStatus === 'LoadingFirstPage' && products.length === 0

//   // Get all product image IDs for URL resolution
//   const productImageIds = useMemo(
//     () => products?.map((p) => p.image).filter(Boolean) ?? [],
//     [products],
//   )

//   // Use the useStorageUrls hook for efficient image URL resolution
//   const resolveImageUrl = useStorageUrls(productImageIds)

//   const {
//     columnWidths,
//     resizingColumn,
//     tableRef,
//     handleMouseDown,
//     getColumnWidth,
//   } = useResizableColumns('inventory-table', columns)

//   const [hoveredColumn, setHoveredColumn] = useState<string | null>(null)
//   const [showCheckboxes, setShowCheckboxes] = useState(true)
//   const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
//     new Set(columns.map((col) => col.uid)),
//   )
//   const [statusFilter, setStatusFilter] = useState<Set<string>>(
//     new Set(statusOptions.map((s) => s.uid)),
//   )
//   const [categoryFilter, setCategoryFilter] = useState<Set<string>>(
//     new Set(['all']),
//   )
//   const visibleColumnDefs = useMemo(
//     () => columns.filter((column) => visibleColumns.has(column.uid)),
//     [visibleColumns],
//   )

//   // Apply widths directly to DOM elements
//   useEffect(() => {
//     if (tableRef.current) {
//       const table = tableRef.current.querySelector('table')
//       if (table) {
//         // Limit checkbox column width to w-14 (3.5rem = 56px)
//         const headerCells = table.querySelectorAll('thead th')
//         const bodyRows = table.querySelectorAll('tbody tr')

//         // First column is the checkbox column (only if checkboxes are visible)
//         if (showCheckboxes && headerCells[0]) {
//           const checkboxHeader = headerCells[0] as HTMLElement
//           checkboxHeader.style.width = '56px'
//           checkboxHeader.style.minWidth = '56px'
//           checkboxHeader.style.maxWidth = '56px'
//         }

//         if (showCheckboxes) {
//           bodyRows.forEach((row) => {
//             const cells = row.querySelectorAll('td')
//             if (cells[0]) {
//               const checkboxCell = cells[0] as HTMLElement
//               checkboxCell.style.width = '56px'
//               checkboxCell.style.minWidth = '56px'
//               checkboxCell.style.maxWidth = '56px'
//             }
//           })
//         }

//         // Apply custom column widths if they exist (only on desktop)
//         if (Object.keys(columnWidths).length > 0) {
//           const checkboxOffset = showCheckboxes ? 1 : 0
//           // Skip first column (checkbox) if visible and apply widths starting from index checkboxOffset
//           headerCells.forEach((cell, index) => {
//             if (showCheckboxes && index === 0) return // Skip checkbox column
//             const uid = visibleColumnDefs[index - checkboxOffset]?.uid
//             const width = getColumnWidth(uid)
//             if (width && uid) {
//               const htmlCell = cell as HTMLElement
//               // Apply min-width for mobile flexibility
//               htmlCell.style.minWidth = `${width}px`
//               // Fixed widths are applied via CSS classes on desktop (md:table-fixed handles this)
//               // On mobile (table-auto), columns will size naturally with min-width constraint
//             }
//           })

//           bodyRows.forEach((row) => {
//             const cells = row.querySelectorAll('td')
//             cells.forEach((cell, index) => {
//               if (showCheckboxes && index === 0) return // Skip checkbox column
//               const uid = visibleColumnDefs[index - checkboxOffset]?.uid
//               const width = getColumnWidth(uid)
//               if (width && uid) {
//                 const htmlCell = cell as HTMLElement
//                 // Apply min-width for mobile flexibility
//                 htmlCell.style.minWidth = `${width}px`
//                 // Fixed widths are applied via CSS classes on desktop (md:table-fixed handles this)
//                 // On mobile (table-auto), columns will size naturally with min-width constraint
//               }
//             })
//           })
//         }
//       }
//     }
//   }, [
//     columnWidths,
//     getColumnWidth,
//     hoveredColumn,
//     showCheckboxes,
//     tableRef,
//     visibleColumnDefs,
//   ])

//   const [filterValue, setFilterValue] = useState('')
//   const [selectedRow, setSelectedRow] = useState<Id<'products'> | null>(null)
//   const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
//   const [isChangingPrice, setIsChangingPrice] = useState(false)
//   const [priceInput, setPriceInput] = useState('')

//   const hasSearchFilter = Boolean(filterValue)

//   const filteredItems = useMemo(() => {
//     let filteredProducts: Product[] = products

//     if (hasSearchFilter) {
//       filteredProducts =
//         filteredProducts.filter((product) =>
//           product.name?.toLowerCase().includes(filterValue.toLowerCase()),
//         ) ?? []
//     }

//     // Status filter
//     if (statusFilter.size > 0 && statusFilter.size < statusOptions.length) {
//       filteredProducts = filteredProducts.filter((product) => {
//         const status = product.available
//           ? 'active'
//           : product.featured
//             ? 'featured'
//             : 'inactive'
//         return statusFilter.has(status)
//       })
//     }

//     // Category filter
//     if (
//       categoryFilter.size > 0 &&
//       !categoryFilter.has('all') &&
//       categoryFilter.size < categories.length + 1
//     ) {
//       filteredProducts = filteredProducts.filter((product) => {
//         const category = product.categorySlug ?? 'uncategorized'
//         return categoryFilter.has(category)
//       })
//     }

//     return filteredProducts
//   }, [
//     hasSearchFilter,
//     products,
//     filterValue,
//     statusFilter,
//     categoryFilter,
//     categories.length,
//   ])

//   const handleLoadMoreProducts = useCallback(() => {
//     loadMore(INVENTORY_PAGE_SIZE)
//   }, [loadMore])

//   const onSearchChange = useCallback((value: string) => {
//     if (value) {
//       setFilterValue(value)
//     } else {
//       setFilterValue('')
//     }
//   }, [])

//   const onClear = useCallback(() => {
//     setFilterValue('')
//   }, [])

//   const onStatusFilterChange = useCallback((keys: Set<string>) => {
//     if (keys === 'all') {
//       setStatusFilter(new Set(statusOptions.map((s) => s.uid)))
//     } else {
//       const keySet = new Set(Array.from(keys).map((k) => String(k)))
//       setStatusFilter(keySet)
//     }
//   }, [])

//   const onCategoryFilterChange = useCallback((keys: Set<string>) => {
//     // Handle 'all' string case
//     if (keys === 'all') {
//       setCategoryFilter(new Set(['all']))
//       return
//     }

//     // Convert SharedSelection to Set<string>
//     const keysArray: Key[] =
//       keys instanceof Set
//         ? Array.from(keys)
//         : Array.isArray(keys)
//           ? keys
//           : Array.from(keys as Iterable<Key>)

//     const keySet = new Set(keysArray.map((k) => String(k)))

//     // If 'all' is selected along with other items, remove 'all' and keep others
//     if (keySet.has('all') && keySet.size > 1) {
//       keySet.delete('all')
//       setCategoryFilter(keySet)
//       return
//     }

//     // If only 'all' is selected, keep it
//     if (keySet.has('all')) {
//       setCategoryFilter(new Set(['all']))
//       return
//     }

//     // Otherwise, use the selected keys (categories)
//     if (keySet.size === 0) {
//       // Fallback to 'all' if nothing selected
//       setCategoryFilter(new Set(['all']))
//     } else {
//       setCategoryFilter(keySet)
//     }
//   }, [])

//   const onVisibleColumnsChange = useCallback((keys: Set<string>) => {
//     if (keys === 'all') {
//       setVisibleColumns(new Set(columns.map((column) => column.uid)))
//     } else {
//       const keySet = new Set(Array.from(keys).map((k) => String(k)))
//       setVisibleColumns(keySet)
//     }
//   }, [])

//   const handleViewProduct = (product: Product) => () => {
//     if (product) {
//       setSelectedProduct(product)
//       setSelectedRow(product._id)
//       setOpen(true)
//     }
//   }

//   const renderCell = (product: Product, columnKey: Key) => {
//     switch (columnKey) {
//       case 'product':
//         return (
//           <div className='flex items-center gap-3 w-fit'>
//             <Image
//               src={
//                 (product.image && resolveImageUrl(product.image)) ?? undefined
//               }
//               alt={product.name}
//               className='size-12 aspect-square object-cover rounded shrink-0'
//             />
//             <div className='flex flex-col'>
//               <p className='text-bold text-sm whitespace-nowrap'>
//                 {product.name}
//               </p>
//               {/*<p className='text-xs italic opacity-60'>{product.slug}</p>*/}
//             </div>
//           </div>
//         )
//       case 'category':
//         return (
//           <div className='flex flex-col'>
//             <p className='text-bold text-sm capitalize portrait:w-24'>
//               {product.categorySlug ?? 'Uncategorized'}
//             </p>
//           </div>
//         )
//       case 'price':
//         return moneyCell(product.priceCents ?? 0)
//       case 'unit':
//         return textCell(product.unit ?? '')
//       case 'stock': {
//         const denom = product.stockByDenomination
//         const total =
//           denom && Object.keys(denom).length > 0
//             ? (Object.values(denom) as number[]).reduce((a, b) => a + b, 0)
//             : product.stock
//         return (
//           <div className='flex flex-col items-center'>
//             <p className='text-bold text-sm'>
//               {total !== undefined ? total : 'N/A'}
//             </p>
//           </div>
//         )
//       }
//       case 'status':
//         const status = product.available
//           ? 'active'
//           : product.featured
//             ? 'featured'
//             : 'inactive'
//         return (
//           <Chip
//             className='capitalize'
//             color={
//               status === 'featured'
//                 ? 'success'
//                 : status === 'active'
//                   ? 'default'
//                   : 'danger'
//             }
//             size='sm'
//             variant='tertiary'>
//             {status === 'featured'
//               ? 'Featured'
//               : status === 'active'
//                 ? 'Active'
//                 : 'Inactive'}
//           </Chip>
//         )
//       case 'actions':
//         return actionsCell(
//           selectedRow === product._id,
//           handleViewProduct(product),
//         )
//       default:
//         return null
//     }
//   }

//   const handleChangePrice = useCallback(() => {
//     setIsChangingPrice(true)
//     setPriceInput('')
//   }, [])

//   const handleCancelPriceChange = useCallback(() => {
//     setIsChangingPrice(false)
//     setPriceInput('')
//   }, [])

//   const handleSubmitPriceChange = useCallback(async () => {
//     const priceValue = parseFloat(priceInput)
//     if (isNaN(priceValue) || priceValue < 0) {
//       return
//     }

//     const selectedProductIds = Array.from(selectedRows).map(
//       (id) => id as Id<'products'>,
//     )
//     const priceCents = Math.round(priceValue * 100)

//     try {
//       await bulkUpdatePrices({
//         productIds: selectedProductIds,
//         priceCents,
//       })
//       setIsChangingPrice(false)
//       setPriceInput('')
//       setSelectedRows(new Set())
//     } catch (error) {
//       console.error('Failed to update prices:', error)
//     }
//   }, [priceInput, selectedRows, bulkUpdatePrices])

//   const topContent = useMemo(() => {
//     return (
//       <div className='flex flex-col w-full portrait:w-screen gap-4'>
//         <div className='flex justify-between items-center gap-3 px-4'>
//           <div className='flex items-center gap-3 flex-1'>
//             <input
//               type='checkbox'
//               checked={showCheckboxes}
//               onChange={(event) => {
//                 const nextChecked = event.target.checked
//                 setShowCheckboxes(nextChecked)
//                 if (!nextChecked) {
//                   setSelectedRows(new Set())
//                 }
//               }}
//               className='size-4 accent-emerald-500'
//             />
//             <Input
//               placeholder='Search by name...'
//               value={filterValue}
//               onChange={(e) => onSearchChange(e.target.value)}
//             />
//           </div>
//           {selectedRows.size > 0 && (
//             <div className='flex items-center gap-2'>
//               <span className='text-sm text-default-500'>
//                 {selectedRows.size} selected
//               </span>
//               {isChangingPrice ? (
//                 <div className='flex items-center gap-2'>
//                   <Input
//                     type='number'
//                     placeholder='Enter new price'
//                     value={priceInput}
//                     onChange={(e) => setPriceInput(e.target.value)}
//                     min='0'
//                     step='0.01'
//                     onKeyDown={(e) => {
//                       if (e.key === 'Enter') {
//                         handleSubmitPriceChange()
//                       } else if (e.key === 'Escape') {
//                         handleCancelPriceChange()
//                       }
//                     }}
//                   />
//                   <Button
//                     size='sm'
//                     variant='primary'
//                     onPress={() => {
//                       void handleSubmitPriceChange()
//                     }}
//                     isDisabled={!priceInput || isNaN(parseFloat(priceInput))}>
//                     Save
//                   </Button>
//                   <Button
//                     size='sm'
//                     variant='tertiary'
//                     onPress={handleCancelPriceChange}>
//                     Cancel
//                   </Button>
//                 </div>
//               ) : (
//                 <Dropdown>
//                   <Dropdown.Trigger>
//                     <Button variant='tertiary' className='text-blue-400'>
//                       Actions
//                       <Icon name='arrow-down' className='size-4' />
//                     </Button>
//                   </Dropdown.Trigger>
//                   <Dropdown.Popover>
//                     <Dropdown.Menu
//                       aria-label='Bulk Actions'
//                       onAction={(key) => {
//                         if (key === 'change-price') {
//                           handleChangePrice()
//                         }
//                       }}>
//                       <Dropdown.Item id='change-price'>
//                         <div className='flex items-center gap-2'>
//                           <Icon name='dollar' className='size-5' />
//                           <span>Change Price</span>
//                         </div>
//                       </Dropdown.Item>
//                     </Dropdown.Menu>
//                   </Dropdown.Popover>
//                 </Dropdown>
//               )}
//             </div>
//           )}
//           <ButtonGroup variant='tertiary'>
//             <Dropdown>
//               <Dropdown.Trigger className='hidden sm:flex'>
//                 <Button variant='tertiary'>
//                   Category
//                   <Icon name='3d-box-light' className='size-4' />
//                 </Button>
//               </Dropdown.Trigger>
//               <Dropdown.Popover>
//                 <Dropdown.Menu
//                   aria-label='Category Filter'
//                   selectedKeys={categoryFilter}
//                   selectionMode='multiple'
//                   onSelectionChange={onCategoryFilterChange}>
//                   <Dropdown.Item id='all' className='capitalize'>
//                     All Categories
//                   </Dropdown.Item>
//                   {categories.map((category, i) => (
//                     <Dropdown.Item
//                       key={category.slug ?? i}
//                       id={category.slug ?? i}
//                       className='capitalize'>
//                       {category.name}
//                     </Dropdown.Item>
//                   ))}
//                   <Dropdown.Item
//                     id='uncategorized'
//                     className='capitalize opacity-60'>
//                     Uncategorized
//                   </Dropdown.Item>
//                 </Dropdown.Menu>
//               </Dropdown.Popover>
//             </Dropdown>
//             <Dropdown>
//               <Dropdown.Trigger className='hidden sm:flex'>
//                 <Button variant='tertiary'>
//                   Status
//                   <div className='-scale-x-100'>
//                     <Icon name='arrow-swap' className='size-4 rotate-30' />
//                   </div>
//                 </Button>
//               </Dropdown.Trigger>
//               <Dropdown.Popover>
//                 <Dropdown.Menu
//                   disallowEmptySelection
//                   aria-label='Status Filter'
//                   selectedKeys={statusFilter}
//                   selectionMode='multiple'
//                   onSelectionChange={onStatusFilterChange}>
//                   {statusOptions.map((status) => (
//                     <Dropdown.Item
//                       key={status.uid}
//                       id={status.uid}
//                       className='capitalize'>
//                       {status.name}
//                     </Dropdown.Item>
//                   ))}
//                 </Dropdown.Menu>
//               </Dropdown.Popover>
//             </Dropdown>
//             <Dropdown>
//               <Dropdown.Trigger className='hidden sm:flex'>
//                 <Button variant='tertiary'>
//                   Columns
//                   <Icon name='arrow-down-long-light' className='size-4' />
//                 </Button>
//               </Dropdown.Trigger>
//               <Dropdown.Popover>
//                 <Dropdown.Menu
//                   disallowEmptySelection
//                   aria-label='Table Columns'
//                   selectedKeys={visibleColumns}
//                   selectionMode='multiple'
//                   onSelectionChange={onVisibleColumnsChange}>
//                   {columns.map((column) => (
//                     <Dropdown.Item
//                       key={column.uid}
//                       id={column.uid}
//                       className='capitalize'>
//                       {column.uid}
//                     </Dropdown.Item>
//                   ))}
//                 </Dropdown.Menu>
//               </Dropdown.Popover>
//             </Dropdown>
//           </ButtonGroup>
//         </div>
//         <div className='hidden _flex justify-between items-center'>
//           <span className='text-default-400 text-small'>
//             Total {filteredItems?.length} items
//           </span>
//           <label className='flex items-center text-default-400 text-small'>
//             Rows per page:
//             <select
//               className='hidden bg-transparent outline-solid outline-transparent text-default-400 text-small'
//               // onChange={onRowsPerPageChange}
//             >
//               <option value='5'>5</option>
//               <option value='10'>10</option>
//               <option value='15'>15</option>
//             </select>
//           </label>
//         </div>
//       </div>
//     )
//   }, [
//     statusFilter,
//     categoryFilter,
//     visibleColumns,
//     filteredItems,
//     onSearchChange,
//     onStatusFilterChange,
//     onCategoryFilterChange,
//     onVisibleColumnsChange,
//     filterValue,
//     onClear,
//     categories,
//     selectedRows.size,
//     isChangingPrice,
//     priceInput,
//     handleChangePrice,
//     handleCancelPriceChange,
//     handleSubmitPriceChange,
//     showCheckboxes,
//   ])

//   if (isLoadingInitialProducts) {
//     return (
//       <Card className='p-4'>
//         <p className='text-sm text-gray-400'>Loading inventory...</p>
//       </Card>
//     )
//   }

//   return (
//     <>
//       {topContent}
//       <Card className='md:rounded-xl md:w-full w-screen overflow-x-auto overflow-y-visible p-4 bg-sidebar/30 dark:bg-dark-table/40'>
//         <div ref={tableRef} className='relative min-w-full'>
//           <div className='overflow-x-auto'>
//             <table
//               key={`table-${selectedProductId || 'none'}-${open}-${showCheckboxes}`}
//               aria-label='Inventory table'
//               className='min-w-full table-auto md:table-fixed'>
//               <thead className='select-none'>
//                 <tr>
//                   {showCheckboxes ? (
//                     <th className='w-14 min-w-14 max-w-14 border-b border-divider bg-transparent px-3 py-2 text-left text-gray-400'>
//                       <input
//                         type='checkbox'
//                         checked={
//                           filteredItems.length > 0 &&
//                           filteredItems.every((product) =>
//                             selectedRows.has(getKey(product)),
//                           )
//                         }
//                         onChange={(event) => {
//                           if (event.target.checked) {
//                             setSelectedRows(
//                               new Set(
//                                 filteredItems.map((product) => getKey(product)),
//                               ),
//                             )
//                           } else {
//                             setSelectedRows(new Set())
//                           }
//                         }}
//                         className='size-4 accent-emerald-500'
//                         aria-label='Select all rows'
//                       />
//                     </th>
//                   ) : null}
//                   {visibleColumnDefs.map((column) => {
//                     const width = getColumnWidth(column.uid)
//                     // const isResizing = resizingColumn === column.uid
//                     const isHovered = hoveredColumn === column.uid
//                     const columnIndex = visibleColumnDefs.findIndex(
//                       (col) => col.uid === column.uid,
//                     )
//                     const isLastColumn =
//                       columnIndex === visibleColumnDefs.length - 1

//                     const columnStyle = width
//                       ? {
//                           width: `${width}px`,
//                           minWidth: `${width}px`,
//                           maxWidth: `${width}px`,
//                         }
//                       : undefined

//                     return (
//                       <th
//                         key={column.uid}
//                         className={cn(
//                           'text-start relative group/column h-fit',
//                           {
//                             'md:w-16 w-16': column.uid === 'actions' && !width,
//                             'md:text-center md:w-18 w-20':
//                               column.uid === 'price' && !width,
//                             'md:text-center md:w-16 w-16':
//                               column.uid === 'stock' && !width,
//                             'md:text-center md:w-64 w-48':
//                               column.uid === 'product' && !width,
//                             'w-24': column.uid === 'category' && !width,
//                             'w-20': column.uid === 'unit' && !width,
//                             'w-28': column.uid === 'status' && !width,
//                           },
//                         )}
//                         style={columnStyle}>
//                         <div
//                           className='relative md:w-full w-fit select-none'
//                           onMouseEnter={() => {
//                             setHoveredColumn(column.uid)
//                           }}
//                           onMouseLeave={() => {
//                             setHoveredColumn(null)
//                           }}>
//                           {isHovered && (
//                             <div className='absolute inset-0 bg-primary/20 pointer-events-none z-0' />
//                           )}
//                           <div className='flex items-center justify-between w-full relative z-10'>
//                             <span className='flex items-center select-none'>
//                               {column.name.toLowerCase() === 'price' && (
//                                 <Icon name='dollar' className='size-3.5' />
//                               )}
//                               {column.name}
//                             </span>
//                           </div>
//                         </div>
//                         {!isLastColumn && (
//                           <>
//                             <div
//                               className={cn(
//                                 'absolute right-0 top-1/4 bottom-0 cursor-col-resize z-30 size-4 aspect-square',
//                               )}
//                               style={{
//                                 right: '3px',
//                                 width: '6px',
//                                 marginRight: '3px',
//                               }}
//                               onMouseDown={(e) => {
//                                 handleMouseDown(column.uid, e)
//                               }}
//                               role='separator'
//                               aria-label={`Resize ${column.name} column`}>
//                               <Icon
//                                 name='width-rounded'
//                                 className='size-4 hidden group-hover/column:flex'
//                               />
//                             </div>
//                           </>
//                         )}
//                       </th>
//                     )
//                   })}
//                 </tr>
//               </thead>
//               <tbody>
//                 {filteredItems.length === 0 ? (
//                   <tr>
//                     <td
//                       colSpan={
//                         visibleColumnDefs.length + (showCheckboxes ? 1 : 0)
//                       }
//                       className='px-4 py-6 text-center text-sm text-gray-400'>
//                       No products found
//                     </td>
//                   </tr>
//                 ) : (
//                   filteredItems.map((product) => {
//                     const isSelected = Boolean(
//                       selectedProductId &&
//                       product._id &&
//                       String(selectedProductId) === String(product._id) &&
//                       open,
//                     )
//                     return (
//                       <tr
//                         key={getKey(product)}
//                         data-product-selected={isSelected ? 'true' : 'false'}
//                         className={cn(
//                           'h-16 border-b-[0.5px] last:border-b-0 border-neutral-500/20 hover:bg-emerald-400/10 transition-colors duration-75 relative',
//                           selectedRow === product._id && isSelected
//                             ? 'bg-emerald-400/15 border-emerald-400/30'
//                             : '',
//                         )}>
//                         {showCheckboxes ? (
//                           <td className='w-14 min-w-14 max-w-14 px-3 py-2 align-middle'>
//                             <input
//                               type='checkbox'
//                               checked={selectedRows.has(getKey(product))}
//                               onChange={(event) => {
//                                 setSelectedRows((current) => {
//                                   const next = new Set(current)
//                                   const key = getKey(product)
//                                   if (event.target.checked) {
//                                     next.add(key)
//                                   } else {
//                                     next.delete(key)
//                                   }
//                                   return next
//                                 })
//                               }}
//                               className='size-4 accent-emerald-500'
//                               aria-label={`Select ${product.name}`}
//                             />
//                           </td>
//                         ) : null}
//                         {visibleColumnDefs.map((column) => {
//                           const width = getColumnWidth(column.uid)
//                           const columnIndex = visibleColumnDefs.findIndex(
//                             (col) => col.uid === column.uid,
//                           )
//                           const isLastColumn =
//                             columnIndex === visibleColumnDefs.length - 1
//                           const isResizing = resizingColumn === column.uid
//                           const isHovered = hoveredColumn === column.uid

//                           const cellStyle = width
//                             ? {
//                                 width: `${width}px`,
//                                 minWidth: `${width}px`,
//                                 maxWidth: `${width}px`,
//                                 overflow: 'hidden',
//                                 textOverflow: 'ellipsis',
//                               }
//                             : undefined

//                           return (
//                             <td
//                               key={column.uid}
//                               className='relative'
//                               style={cellStyle}
//                               onMouseEnter={() => setHoveredColumn(column.uid)}
//                               onMouseLeave={() => setHoveredColumn(null)}>
//                               {isHovered && (
//                                 <div className='absolute inset-0 bg-primary/15 pointer-events-none z-0' />
//                               )}
//                               <div className='relative z-10'>
//                                 {renderCell(product, column.uid)}
//                               </div>
//                               {!isLastColumn && (
//                                 <div
//                                   className={cn(
//                                     'absolute right-0 top-0 bottom-0 pointer-events-none z-20',
//                                     isResizing && 'bg-primary',
//                                   )}
//                                   style={{
//                                     right: '0px',
//                                     width: '1px',
//                                     height: '100%',
//                                   }}
//                                 />
//                               )}
//                             </td>
//                           )
//                         })}
//                       </tr>
//                     )
//                   })
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       </Card>
//       {(canLoadMoreProducts || isLoadingMoreProducts) && (
//         <div className='flex items-center justify-center gap-3 px-4 pt-4'>
//           <span className='text-xs font-brk uppercase tracking-tight text-foreground/55'>
//             {products.length} loaded
//           </span>
//           <Button
//             variant='tertiary'
//             className='font-brk'
//             isPending={isLoadingMoreProducts}
//             isDisabled={isLoadingMoreProducts}
//             onPress={handleLoadMoreProducts}>
//             {`Load ${INVENTORY_PAGE_SIZE} more`}
//           </Button>
//         </div>
//       )}
//     </>
//   )
// }

'use client'

import {OrderListItem} from '@/app/account/_components/order-list-item'
import {Loader} from '@/components/expermtl/loader'
import {api} from '@/convex/_generated/api'
import type {OrderType} from '@/convex/orders/d'
import {useAuth} from '@/hooks/use-auth'
import {Icon} from '@/lib/icons'
import {formatPrice} from '@/utils/formatPrice'
import {Button, Card, CardBody, Input, InputProps} from '@heroui/react'
import {useQuery} from 'convex/react'
import Link from 'next/link'
import {useMemo, useState} from 'react'

const PAGE_SIZE = 10

type SearchMode = 'all' | 'orderNumber' | 'date' | 'amount'

const searchModes: Array<{id: SearchMode; label: string}> = [
  {id: 'all', label: 'All'},
  {id: 'orderNumber', label: 'Order #'},
  {id: 'date', label: 'Date'},
  {id: 'amount', label: 'Amount'},
]

const toDateKey = (timestamp?: number) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const matchesSearch = (order: OrderType, query: string, mode: SearchMode) => {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return true

  const normalizedOrderNumber = order.orderNumber.toLowerCase()
  const orderDate = order.createdAt ? new Date(order.createdAt) : null
  const orderDateKey = toDateKey(order.createdAt)
  const orderDateLabel = orderDate
    ? orderDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : ''
  const orderAmountFormatted = formatPrice(order.totalCents).toLowerCase()
  const amountQuery = normalizedQuery.replace(/[$,\s]/g, '')
  const parsedAmount = Number(amountQuery)
  const parsedAmountCents = Number.isFinite(parsedAmount)
    ? Math.round(parsedAmount * 100)
    : null

  const isOrderNumberMatch = normalizedOrderNumber.includes(normalizedQuery)
  const isDateMatch =
    orderDateKey.includes(normalizedQuery) ||
    orderDateLabel.toLowerCase().includes(normalizedQuery)
  const isAmountMatch =
    orderAmountFormatted.includes(amountQuery) ||
    `${order.totalCents / 100}`.includes(amountQuery) ||
    (parsedAmountCents !== null && parsedAmountCents === order.totalCents)

  if (mode === 'orderNumber') return isOrderNumberMatch
  if (mode === 'date') return isDateMatch
  if (mode === 'amount') return isAmountMatch

  return isOrderNumberMatch || isDateMatch || isAmountMatch
}

const matchesDateRange = (
  createdAt: number | undefined,
  fromDate: string,
  toDate: string,
) => {
  if (!fromDate && !toDate) return true
  if (!createdAt) return false

  const fromTimestamp = fromDate
    ? new Date(`${fromDate}T00:00:00`).getTime()
    : Number.NEGATIVE_INFINITY
  const toTimestamp = toDate
    ? new Date(`${toDate}T23:59:59.999`).getTime()
    : Number.POSITIVE_INFINITY

  return createdAt >= fromTimestamp && createdAt <= toTimestamp
}

const getPageItems = (currentPage: number, totalPages: number) => {
  if (totalPages <= 7) {
    return Array.from({length: totalPages}, (_, index) => index + 1)
  }

  const pages: Array<number | 'ellipsis'> = [1]
  const start = Math.max(2, currentPage - 1)
  const end = Math.min(totalPages - 1, currentPage + 1)

  if (start > 2) pages.push('ellipsis')
  for (let page = start; page <= end; page += 1) pages.push(page)
  if (end < totalPages - 1) pages.push('ellipsis')

  pages.push(totalPages)
  return pages
}

export const Content = () => {
  const {user: firebaseUser, loading: isAuthLoading} = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchMode, setSearchMode] = useState<SearchMode>('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [page, setPage] = useState(1)

  const user = useQuery(
    api.users.q.getCurrentUser,
    firebaseUser ? {fid: firebaseUser.uid} : 'skip',
  )

  const orders = useQuery(
    api.orders.q.getUserOrders,
    user?._id ? {userId: user._id} : 'skip',
  )

  const hasInvalidDateRange = Boolean(fromDate && toDate && fromDate > toDate)

  const filteredOrders = useMemo(() => {
    if (!orders || hasInvalidDateRange) return []

    return orders.filter(
      (order) =>
        matchesSearch(order, searchQuery, searchMode) &&
        matchesDateRange(order.createdAt, fromDate, toDate),
    )
  }, [orders, hasInvalidDateRange, searchMode, searchQuery, fromDate, toDate])

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)

  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE
    return filteredOrders.slice(startIndex, startIndex + PAGE_SIZE)
  }, [filteredOrders, currentPage])

  const showingFrom = filteredOrders.length
    ? (currentPage - 1) * PAGE_SIZE + 1
    : 0
  const showingTo = Math.min(currentPage * PAGE_SIZE, filteredOrders.length)

  const filteredTotalSpend = useMemo(
    () =>
      filteredOrders.reduce((total, order) => {
        return total + order.totalCents
      }, 0),
    [filteredOrders],
  )

  const setPageToFirst = () => setPage(1)

  const handleSearchQueryChange = (value: string) => {
    setSearchQuery(value)
    setPageToFirst()
  }

  const handleSearchModeChange = (mode: SearchMode) => {
    setSearchMode(mode)
    setPageToFirst()
  }

  const handleFromDateChange = (value: string) => {
    setFromDate(value)
    setPageToFirst()
  }

  const handleToDateChange = (value: string) => {
    setToDate(value)
    setPageToFirst()
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSearchMode('all')
    setFromDate('')
    setToDate('')
    setPageToFirst()
  }

  const isLoading =
    isAuthLoading || (Boolean(firebaseUser) && (!user || orders === undefined))
  const hasFilters = Boolean(searchQuery || fromDate || toDate)
  const pageItems = getPageItems(currentPage, totalPages)

  return (
    <main className='px-2 sm:px-4 lg:px-6 space-y-5 pb-8'>
      <Card shadow='none' className='border border-foreground/15'>
        <CardBody className='p-3 md:p-5 space-y-4 bg-sidebar/40 dark:bg-sidebar'>
          <div className='grid grid-cols-1 lg:grid-cols-4 gap-3 w-full xl:h-15'>
            <Input
              type='search'
              value={searchQuery}
              onValueChange={handleSearchQueryChange}
              placeholder='Search order #, date, or amount'
              startContent={
                <Icon name='search' className='size-4 opacity-60' />
              }
              className='lg:col-span-2'
              classNames={{
                base: 'py-2',
                inputWrapper: [inputClasses?.inputWrapper],
              }}
            />
            <Input
              type='date'
              value={fromDate}
              onValueChange={handleFromDateChange}
              label='From'
              labelPlacement='outside-left'
              classNames={inputClasses}
            />
            <Input
              type='date'
              value={toDate}
              onValueChange={handleToDateChange}
              label='To'
              labelPlacement='outside-left'
              classNames={inputClasses}
            />
          </div>

          <div className='flex flex-wrap items-center justify-between gap-3'>
            <div className='flex flex-wrap gap-2'>
              {searchModes.map((mode) => (
                <Button
                  key={mode.id}
                  size='sm'
                  radius='full'
                  variant={searchMode === mode.id ? 'solid' : 'flat'}
                  color={searchMode === mode.id ? 'primary' : 'default'}
                  onPress={() => handleSearchModeChange(mode.id)}>
                  {mode.label}
                </Button>
              ))}
            </div>
            <Button
              size='sm'
              variant='light'
              onPress={clearFilters}
              isDisabled={!hasFilters}>
              Clear filters
            </Button>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
            <div className='rounded-xl dark:bg-background/20 p-3'>
              <p className='text-xs text-default-500'>Total Orders</p>
              <p className='text-xl font-semibold'>{orders?.length ?? 0}</p>
            </div>
            <div className='rounded-xl dark:bg-background/20 p-3'>
              <p className='text-xs text-default-500'>Filtered Results</p>
              <p className='text-xl font-semibold'>{filteredOrders.length}</p>
            </div>
            <div className='rounded-xl dark:bg-background/20 p-3'>
              <p className='text-xs text-default-500'>Filtered Amount</p>
              <p className='text-xl font-semibold'>
                ${formatPrice(filteredTotalSpend)}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {isLoading ? (
        <div className='w-full flex justify-center py-20'>
          <Loader />
        </div>
      ) : orders && orders.length === 0 ? (
        <Card
          shadow='none'
          className='border-2 border-dashed border-default-200 dark:border-default-100/20'>
          <CardBody className='py-16 flex flex-col items-center text-center gap-4'>
            <h2 className='text-xl font-semibold'>No orders yet</h2>
            <p className='text-default-500 max-w-md'>
              You have not placed an order yet. Start shopping to see orders
              here.
            </p>
            <Button as={Link} href='/products' color='primary'>
              Browse Products
            </Button>
          </CardBody>
        </Card>
      ) : hasInvalidDateRange ? (
        <Card shadow='none' className='border border-danger/30'>
          <CardBody className='py-8 text-center text-danger'>
            Select a valid date range. The start date must be on or before the
            end date.
          </CardBody>
        </Card>
      ) : filteredOrders.length === 0 ? (
        <Card shadow='none' className='border border-foreground/15'>
          <CardBody className='py-12 text-center text-default-500'>
            No orders matched your filters.
          </CardBody>
        </Card>
      ) : (
        <div className='space-y-3'>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-1'>
            <p className='text-sm text-default-500'>
              Showing {showingFrom}-{showingTo} of {filteredOrders.length}
            </p>
            <p className='text-sm text-default-500'>
              Page {currentPage} of {totalPages}
            </p>
          </div>

          {paginatedOrders.map((order) => (
            <OrderListItem key={order.orderNumber} order={order} />
          ))}

          <Card shadow='none' className='border border-foreground/15'>
            <CardBody className='p-3 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between'>
              <Button
                variant='flat'
                onPress={() => setPage(Math.max(1, currentPage - 1))}
                isDisabled={currentPage <= 1}>
                Previous
              </Button>

              <div className='flex flex-wrap justify-center items-center gap-1.5'>
                {pageItems.map((item, index) =>
                  item === 'ellipsis' ? (
                    <span
                      key={`ellipsis-${index}`}
                      className='px-2 text-default-400'>
                      ...
                    </span>
                  ) : (
                    <Button
                      key={item}
                      size='sm'
                      radius='full'
                      variant={item === currentPage ? 'solid' : 'light'}
                      color={item === currentPage ? 'primary' : 'default'}
                      onPress={() => setPage(item)}>
                      {item}
                    </Button>
                  ),
                )}
              </div>

              <Button
                variant='flat'
                onPress={() => setPage(Math.min(totalPages, currentPage + 1))}
                isDisabled={currentPage >= totalPages}>
                Next
              </Button>
            </CardBody>
          </Card>
        </div>
      )}
    </main>
  )
}

const inputClasses: InputProps['classNames'] = {
  label: 'text-sm',
  mainWrapper: 'h-10',
  inputWrapper:
    'lg:col-span-2 w-full placeholder:text-base placeholder:opacity-80 rounded-lg bg-background border border-foreground/10 dark:border-background focus:outline-none focus:ring-2 focus:ring-brand/50',
  innerWrapper: [],
}

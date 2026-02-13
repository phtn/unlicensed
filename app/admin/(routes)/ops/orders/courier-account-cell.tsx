'use client'

import { api } from '@/convex/_generated/api'
import type { Doc } from '@/convex/_generated/dataModel'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@heroui/react'
import { useMutation, useQuery } from 'convex/react'
import { useState } from 'react'

type Order = Doc<'orders'>

interface CourierAccountCellProps {
  order: Order
}

export const CourierAccountCell = ({ order }: CourierAccountCellProps) => {
  const courier = useQuery(
    api.couriers.q.getCourierById,
    order.courier ? { id: order.courier } : 'skip',
  )
  const updateCourierAccount = useMutation(api.orders.m.updateCourierAccount)
  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const accounts = courier?.accounts ?? []
  const selectedAccount = accounts.find(
    (account) => account.id === order.courierAccountId,
  )

  const hasCourier = Boolean(order.courier)
  const hasAccounts = accounts.length > 0
  const isLoading = hasCourier && courier === undefined

  const handleSelectAccount = async (accountId: string | null) => {
    setIsSaving(true)
    try {
      await updateCourierAccount({
        orderId: order._id,
        courierAccountId: accountId,
      })
      setIsOpen(false)
    } catch (error) {
      console.error('Failed to update courier account:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const displayText = !hasCourier
    ? 'Select Account'
    : (selectedAccount?.label ?? 'Select account')

  return (
    <Popover
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      placement='bottom-start'
      showArrow
    >
      <PopoverTrigger>
        <button
          type='button'
          className={cn(
            'flex items-center justify-center px-2 py-1 rounded text-sm transition-colors',
            'hover:underline',
            !hasCourier && 'text-muted-foreground',
            hasCourier && 'text-cyan-500',
            (isSaving || isLoading) && 'opacity-50 cursor-not-allowed',
          )}
          disabled={isSaving || isLoading || !hasCourier}
        >
          {isLoading ? '...' : displayText}
        </button>
      </PopoverTrigger>
      <PopoverContent className='w-56 p-2'>
        <div className='flex flex-col gap-1'>
          {!hasCourier && (
            <div className='px-3 py-2 text-sm text-muted-foreground'>
              Assign a courier first
            </div>
          )}
          {hasCourier && !isLoading && !hasAccounts && (
            <div className='px-3 py-2 text-sm text-muted-foreground'>
              No accounts configured for this courier
            </div>
          )}
          {hasCourier && !isLoading && hasAccounts && (
            <>
              <button
                type='button'
                onClick={() => void handleSelectAccount(null)}
                className={cn(
                  'text-left px-3 py-2 rounded-lg text-sm transition-colors',
                  'hover:bg-default-100',
                  !order.courierAccountId && 'bg-default-100 font-medium',
                  isSaving && 'opacity-50 cursor-not-allowed',
                )}
                disabled={isSaving}
              >
                Unassign
              </button>
              {accounts.map((account) => (
                <button
                  key={account.id}
                  type='button'
                  onClick={() => void handleSelectAccount(account.id)}
                  className={cn(
                    'text-left px-3 py-2 rounded-lg text-sm transition-colors',
                    'hover:bg-default-100',
                    order.courierAccountId === account.id &&
                    'bg-default-100 font-medium',
                    isSaving && 'opacity-50 cursor-not-allowed',
                  )}
                  disabled={isSaving}
                >
                  <div className='flex flex-col'>
                    <span>{account.label}</span>
                    <span className='text-xs text-muted-foreground truncate'>
                      {account.value}
                    </span>
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

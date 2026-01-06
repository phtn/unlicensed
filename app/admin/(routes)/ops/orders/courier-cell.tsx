'use client'

import {api} from '@/convex/_generated/api'
import {Id, type Doc} from '@/convex/_generated/dataModel'
import {cn} from '@/lib/utils'
import {Popover, PopoverContent, PopoverTrigger} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import {useState} from 'react'

type Order = Doc<'orders'>

interface CourierCellProps {
  order: Order
}

export const CourierCell = ({order}: CourierCellProps) => {
  const activeCouriers = useQuery(api.couriers.q.getActiveCouriers)
  const courier = useQuery(
    api.couriers.q.getCourierById,
    order.courier ? {id: order.courier} : 'skip',
  )
  const updateCourier = useMutation(api.orders.m.updateCourier)
  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleSelectCourier = async (courierId: Id<'couriers'> | null) => {
    setIsSaving(true)
    try {
      await updateCourier({
        orderId: order._id,
        courierId,
      })
      setIsOpen(false)
    } catch (error) {
      console.error('Failed to update courier:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const displayText = courier?.name ?? 'Assign'
  const hasCourier = Boolean(order.courier)
  const isLoading = activeCouriers === undefined || (order.courier && !courier)

  return (
    <Popover
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      placement='bottom-start'
      showArrow>
      <PopoverTrigger>
        <button
          type='button'
          className={cn(
            'capitalize text-blue-500 flex items-center justify-center',
            'hover:underline cursor-pointer transition-colors',
            'px-2 py-1 rounded',
            !hasCourier && 'text-muted-foreground',
            isSaving && 'opacity-50 cursor-not-allowed',
          )}
          disabled={isSaving || isLoading}>
          {isLoading ? '...' : displayText}
        </button>
      </PopoverTrigger>
      <PopoverContent className='w-48 p-2'>
        <div className='flex flex-col gap-1'>
          <button
            type='button'
            onClick={() => handleSelectCourier(null)}
            className={cn(
              'text-left px-3 py-2 rounded-lg text-sm transition-colors',
              'hover:bg-default-100',
              !hasCourier && 'bg-default-100 font-medium',
              isSaving && 'opacity-50 cursor-not-allowed',
            )}
            disabled={isSaving}>
            Unassign
          </button>
          {activeCouriers?.map((activeCourier) => (
            <button
              key={activeCourier._id}
              type='button'
              onClick={() => handleSelectCourier(activeCourier._id)}
              className={cn(
                'text-left px-3 py-2 rounded-lg text-sm transition-colors capitalize',
                'hover:bg-default-100',
                order.courier === activeCourier._id &&
                  'bg-default-100 font-medium',
                isSaving && 'opacity-50 cursor-not-allowed',
              )}
              disabled={isSaving}>
              {activeCourier.name}
            </button>
          ))}
          {activeCouriers && activeCouriers.length === 0 && (
            <div className='px-3 py-2 text-sm text-muted-foreground'>
              No active couriers
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

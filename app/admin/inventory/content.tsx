'use client'

import {Icon} from '@/lib/icons'
import {Activity, useCallback, useState, useTransition} from 'react'
import {InventoryTable} from './inventory-table'

export const Content = () => {
  const [showDescription, setShowDescription] = useState(true)
  const [isPending, startTransition] = useTransition()

  const handleShowDescription = useCallback(() => {
    startTransition(() => {
      setShowDescription(!showDescription)
    })
  }, [showDescription])

  return (
    <main className='min-h-screen px-4 pb-16'>
      <div className='space-y-6'>
        <Activity mode={showDescription ? 'visible' : 'hidden'}>
          <header className='hidden rounded-lg bg-blue-100/20 p-2 _flex items-center justify-between transition-all duration-300 ease-in-out'>
            <div className='flex items-center space-x-3'>
              <Icon
                name={isPending ? 'spinners-ring' : 'info'}
                className='size-4 text-blue-400'
              />
              <p className='max-w-3xl text-sm'>
                Manage product inventory, track stock levels, and monitor
                product availability.
              </p>
            </div>
            <Icon
              onClick={handleShowDescription}
              name={isPending ? 'spinners-ring' : 'x'}
              className='size-4 cursor-pointer transition-opacity opacity-100 hover:opacity-70'
            />
          </header>
        </Activity>
        <InventoryTable />
      </div>
    </main>
  )
}

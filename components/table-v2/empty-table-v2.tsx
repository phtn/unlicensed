import {TableCell, TableRow} from '@/components/ui/table'
import {Icon} from '@/lib/icons'
import {startTransition, useEffect, useState} from 'react'

export const EmptyTable = ({colSpan}: {colSpan: number}) => {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => {
        setIsLoading(false)
      })
    }, 5000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <TableRow className='max-w-7xl'>
      <TableCell
        colSpan={colSpan}
        className='h-24 rounded-xl font-space text-muted-foreground w-full flex justify-center'>
        {isLoading ? (
          <div className='flex items-center justify-center gap-2'>
            <Icon name='spinners-ring' className='size-4' />
            <span>Loading...</span>
          </div>
        ) : (
          'No data.'
        )}
      </TableCell>
    </TableRow>
  )
}

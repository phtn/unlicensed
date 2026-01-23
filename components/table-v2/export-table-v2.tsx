import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {useCopy} from '@/hooks/use-copy'
import {Icon, IconName} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Button} from '@base-ui/react/button'
import {Table} from '@tanstack/react-table'
import {useMemo} from 'react'

interface Props<T> {
  loading: boolean
  table: Table<T>
}

interface IMenuItem {
  id: string
  label: string
  icon: IconName
  fn: VoidFunction
  disabled?: boolean
}

export const ExportTable = <T,>({table, loading}: Props<T>) => {
  const {copy} = useCopy({timeout: 2000})
  const exportOptions = useMemo(
    () =>
      [
        {
          id: 'csv',
          label: 'CSV',
          icon: 'code-square',
          fn: () => console.log('csv'),
        },
        {
          id: 'copy-json',
          label: 'Copy JSON',
          icon: 'code',
          fn: () => console.log(''),
          // fn: () => copy('Row', JSON.stringify(row.original, null, 2)),
        },
        {
          id: 'print',
          label: 'Print',
          icon: 'code',
          fn: () => console.log('delete'),
        },
      ] as IMenuItem[],
    [],
  )
  return (
    <div className='md:flex hidden'>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className={cn(
              'ml-auto relative data-[state=open]:bg-origin/60 rounded-sm border -space-x-px h-7.5 ps-1 translate-x-0 transition-transform duration-200 ease-in-out md:aspect-auto aspect-square select-none',
            )}>
            <Icon
              name={loading ? 'spinners-ring' : 'download'}
              className='size-4 opacity-60'
            />
            <span className='font-brk md:inline-flex items-center gap-2 hidden text-xs'>
              {loading ? 'Loading' : 'Export'}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align='end'
          alignOffset={12}
          className='rounded-3xl md:p-3 p-2.5 border-origin md:min-w-40'>
          <DropdownMenuGroup className='space-y-1 tracking-tight font-figtree'>
            {exportOptions.map((option) => (
              <DropdownMenuItem
                key={option.id}
                asChild
                className='h-12 rounded-2xl px-4'>
                <button onClick={option.fn} className='w-full'>
                  <Icon name={option.icon} className='size-4 mr-2' />
                  <span>{option.label}</span>
                </button>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

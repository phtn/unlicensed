import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {useCopy} from '@/hooks/use-copy'
import {Icon, IconName} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Button} from '@base-ui/react/button'
import {Row} from '@tanstack/react-table'
import {useCallback, useMemo, useState} from 'react'
import {HyperList} from '../expermtl/hyper-list'

interface ISubMenuItem {
  label: string
  icon?: IconName
  fn: VoidFunction
  variant?: 'default' | 'destructive'
  shortcut?: string
}

interface CustomAction<T> {
  label: string
  icon?: IconName
  onClick: (row: T) => void
  variant?: 'default' | 'destructive'
  shortcut?: string
}

interface Props<T> {
  row: Row<T>
  viewFn?: VoidFunction
  deleteFn?: (row: T) => void
  customActions?: CustomAction<T>[]
}

export const RowActions = <T,>({
  row,
  viewFn,
  deleteFn,
  customActions = [],
}: Props<T>) => {
  const {copy} = useCopy({timeout: 2000})
  const [loading, setLoading] = useState(false)

  const handleView = useCallback(() => {
    viewFn?.()
  }, [viewFn])

  const handleDelete = useCallback(() => {
    deleteFn?.(row.original)
  }, [row.original, deleteFn])

  const handleCustomAction = useCallback(
    (action: CustomAction<T>) => {
      action.onClick(row.original)
    },
    [row.original],
  )

  const submenuItems = useMemo(
    () =>
      [
        {label: 'CSV', icon: 'file', fn: () => console.log('csv')},
        {
          label: 'Copy JSON',
          icon: 'code',
          fn: () => copy('Row', JSON.stringify(row.original, null, 2)),
        },
        {label: 'Advance', icon: 'code', fn: () => console.log('delete')},
      ] as ISubMenuItem[],
    [copy, row.original],
  )

  const handleDeleteRow = useCallback(() => {
    // TODO: Implement delete row functionality
    setLoading(true)
    setTimeout(() => setLoading(false), 800)
  }, [])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className='shadow-none rounded-lg cursor-pointer hover:bg-terminal/10 dark:data-[state=open]:bg-terminal/50 data-[state=open]:bg-terminal/10'
          aria-label='More'>
          <Icon
            solid
            name={loading ? 'spinners-ring' : 'sliders'}
            className={cn('text-muted-foreground size-4', {
              'dark:text-amber-400': loading,
            })}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align='end'
        alignOffset={12}
        className='rounded-3xl md:p-3 p-2.5 border-origin md:min-w-40'>
        {customActions.length > 0 && (
          <DropdownMenuGroup>
            {customActions.map((action, index) => (
              <DropdownMenuItem
                key={index}
                className={cn(
                  'h-14',
                  action.variant === 'destructive'
                    ? 'text-destructive focus:text-destructive'
                    : '',
                )}
                onClick={() => handleCustomAction(action)}>
                {action.icon && (
                  <Icon name={action.icon} className='size-4 mr-2' />
                )}
                <span>{action.label}</span>
                {action.shortcut && (
                  <DropdownMenuShortcut>{action.shortcut}</DropdownMenuShortcut>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        )}

        {customActions.length > 0 && <DropdownMenuSeparator />}

        <DropdownMenuGroup className='space-y-1 tracking-tight font-figtree'>
          <DropdownMenuItem asChild className='h-12 rounded-2xl px-4'>
            <button onClick={handleView} className='w-full'>
              <Icon name='eye' className='size-4 mr-2' />
              <span>View</span>
            </button>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleDeleteRow}
            className='h-12 rounded-2xl px-4'>
            <Icon name='x' className='size-4 mr-2' />
            <span>Delete Row</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        {/*<DropdownMenuSeparator className='dark:bg-dysto/60' />*/}

        <DropdownMenuGroup className='space-y-1 tracking-tight font-figtree'>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className='h-12 rounded-2xl pl-3'>
              <Icon name='chevron-left' className='size-5 opacity-60' />
              <span className='w-full pl-3.5'>Export</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent
                side='left'
                className='rounded-3xl p-0 border-origin min-w-40 tracking-tight font-figtree'
                alignOffset={-8}
                sideOffset={-4}>
                <HyperList data={submenuItems} component={SubMenuItem} />
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>

        {deleteFn && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className='text-destructive focus:text-destructive'
              onClick={handleDelete}>
              <Icon name='x' className='size-4 mr-2' />
              <span>Delete</span>
              <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const SubMenuItem = (item: ISubMenuItem) => (
  <DropdownMenuItem
    onClick={item.fn}
    className={cn(
      'cursor-pointer h-14 py-4 pl-4 pr-1 rounded-none dark:focus:bg-terminal/30',
    )}>
    <Icon
      name={item.icon ? item.icon : 'chevron-right'}
      className='size-4 mr-2'
    />
    <span>{item.label}</span>
  </DropdownMenuItem>
)

import {ClassName} from '@/app/types'
import {api} from '@/convex/_generated/api'
import {Doc, Id} from '@/convex/_generated/dataModel'
import {OrderStatus} from '@/convex/orders/d'
import {Icon, IconName} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {formatDate} from '@/utils/date'
import {Avatar, Switch, SwitchProps} from '@heroui/react'
import {CellContext} from '@tanstack/react-table'
import {useMutation} from 'convex/react'
import {FunctionReference} from 'convex/server'
import Link from 'next/link'
import {usePathname, useRouter} from 'next/navigation'
import {
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react'

interface CellOptions<T> {
  className?: ClassName
  formatter?: (
    value: string | number | symbol | Date,
    ctx: CellContext<T, unknown>,
  ) => ReactNode
  fallback?: ReactNode
}

/**
 * Generic factory for creating reusable cells.
 */
export function superCell<T>(prop: keyof T, options: CellOptions<T> = {}) {
  const CellComponent = (ctx: CellContext<T, unknown>) => {
    const rawValue = ctx.row.getValue(prop as string) as keyof T

    if (rawValue === null || rawValue === undefined) {
      return (
        <div className={`font-brk ${options.className}`}>
          {options.fallback ? (
            <span>{options.fallback}</span>
          ) : (
            <span className='font-brk text-sm opacity-60'>····</span>
          )}
        </div>
      )
    }

    const value = options.formatter
      ? options.formatter(rawValue, ctx)
      : rawValue

    return (
      <div className={`font-brk text-sm ${options.className}`}>
        {value as string}
      </div>
    )
  }
  CellComponent.displayName = `SuperCell(${String(prop)})`
  return CellComponent
}

/**
 * Specialized cells built on top of cellFactory
 */
export const textCell = <T, K extends keyof T>(
  prop: K,
  className?: ClassName,
  fallback?: ReactNode,
) => {
  const cell = superCell<T>(prop, {
    className,
    fallback,
  })
  cell.displayName = `TextCell(${String(prop)})`
  return cell
}

export const formatText = <T, K extends keyof T>(
  prop: K,
  formatter: (value: string) => string,
  className?: ClassName,
  fallback?: ReactNode,
) => {
  const cell = superCell<T>(prop, {
    className,
    fallback,
    formatter: (v) => formatter(String(v)),
  })
  cell.displayName = `TextCell(${String(prop)})`
  return cell
}

/**
 * Specialized cells built on top of cellFactory
 */
export const firstLCell = <T, K extends keyof T>(
  prop: K,
  className?: ClassName,
  fallback?: ReactNode,
) => {
  const FirstL = (ctx: CellContext<T, unknown>) => {
    const rawVal = ctx.row.getValue(prop as string) as string
    if (!rawVal) {
      return fallback ? (
        <span className={className}>{fallback}</span>
      ) : (
        <span className='font-brk text-sm'>····</span>
      )
    }
    const names = rawVal.split(' ')
    return (
      <span className={`leading-none ${className}`}>
        {names.length > 2
          ? names[0] + ' ' + names[names.length - 1][0]
          : names[0] + ' ' + names[1][0]}
      </span>
    )
  }
  FirstL.displayName = `FirstLCell(${String(prop)})`
  return FirstL
}
export const linkText = <T, K extends keyof T>(
  prop: K,
  href: string | ((ctx: CellContext<T, unknown>) => string),
  formatter?: (value: string) => string,
  className?: ClassName,
  fallback?: ReactNode,
) => {
  const LinkTextComponent = (ctx: CellContext<T, keyof T>) => {
    const rawValue = ctx.row.getValue(prop as string)
    if (rawValue === null || rawValue === undefined) {
      return <div className={cn(className)}>{fallback ?? '—'}</div>
    }

    const value = formatter ? formatter(String(rawValue)) : String(rawValue)
    const resolvedHref = typeof href === 'function' ? href(ctx) : href

    return (
      <Link
        href={`${resolvedHref}/${rawValue}`}
        className={cn(
          'font-brk text-sm tracking-wide uppercase hover:underline underline-offset-4 decoration-dotted text-mac-blue dark:text-blue-400',
          className,
        )}>
        {value}
      </Link>
    )
  }

  LinkTextComponent.displayName = `LinkText(${String(prop)})`
  return LinkTextComponent
}

/**
 * Generic factory for reusable monetary cells.
 */
export function moneyCell<T>(prop: keyof T, options: CellOptions<T> = {}) {
  const CellComponent = (ctx: CellContext<T, unknown>) => {
    const rawValue = ctx.row.getValue(prop as string) as keyof T

    if (rawValue === null || rawValue === undefined) {
      return (
        <div className={`font-okxs ${options.className}`}>
          {options.fallback ? (
            <span>{options.fallback}</span>
          ) : (
            <span className='font-okxs text-base opacity-60'>····</span>
          )}
        </div>
      )
    }

    const value = options.formatter
      ? options.formatter(rawValue, ctx)
      : rawValue

    return (
      <div className='flex items-center justify-start'>
        <div
          className={`w-full font-okxs text-base text-right mr-10 ${options.className}`}>
          {Number(value).toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
          })}
        </div>
      </div>
    )
  }
  CellComponent.displayName = `SuperCell(${String(prop)})`
  return CellComponent
}

export const priceCell = <T, K extends keyof T>(
  prop: K,
  className?: ClassName,
  fallback?: ReactNode,
) => {
  const cell = moneyCell<T>(prop, {
    className,
    fallback,
  })
  cell.displayName = `TextCell(${String(prop)})`
  return cell
}

/**
 * Generic factory for reusable numerical cells.
 */
export function numberCell<T>(prop: keyof T, options: CellOptions<T> = {}) {
  const CellComponent = (ctx: CellContext<T, unknown>) => {
    const rawValue = ctx.row.getValue(prop as string) as keyof T

    if (rawValue === null || rawValue === undefined) {
      return (
        <div className={`font-okxs ${options.className}`}>
          {options.fallback ? (
            <span>{options.fallback}</span>
          ) : (
            <span className='font-okxs text-base opacity-60'>····</span>
          )}
        </div>
      )
    }

    const value = options.formatter
      ? options.formatter(rawValue, ctx)
      : rawValue

    return (
      <div className='flex items-center justify-start'>
        <div
          className={`w-full font-okxs text-base text-right mr-10 ${options.className}`}>
          {Number(value).toFixed(0)}
        </div>
      </div>
    )
  }
  CellComponent.displayName = `SuperCell(${String(prop)})`
  return CellComponent
}

export const countCell = <T, K extends keyof T>(
  prop: K,
  className?: ClassName,
  fallback?: ReactNode,
) => {
  const cell = numberCell<T>(prop, {
    className,
    fallback,
  })
  cell.displayName = `TextCell(${String(prop)})`
  return cell
}

export const dateCell = <T,>(
  prop: keyof T,
  className?: ClassName,
  fallback?: ReactNode,
) => {
  const cell = superCell<T>(prop, {
    className,
    fallback,
    formatter: (v) => formatDate(v as number),
  })
  cell.displayName = `DateCell(${String(prop)})`
  return cell
}
export const booleanIconCell = <T, K extends keyof T>(
  prop: K,
  icons: {trueIcon?: IconName; falseLabel?: IconName} = {},
  className?: ClassName,
  fallback?: ReactNode,
) => {
  const cell = superCell<T>(prop, {
    className,
    fallback,
    formatter: (v) => (
      <div className='flex items-center h-6'>
        <span className=''>
          {v && icons.trueIcon ? (
            <Icon name={icons.trueIcon} className='size-6 text-emerald-500' />
          ) : (
            <Icon name='x' className='size-6' />
          )}
        </span>
      </div>
    ),
  })
  cell.displayName = `BooleanCell(${String(prop)})`
  return cell
}
export const booleanCell = <T, K extends keyof T>(
  prop: K,
  labels: {trueLabel?: string; falseLabel?: string} = {},
  className?: ClassName,
  fallback?: ReactNode,
) => {
  const cell = superCell<T>(prop, {
    className,
    fallback,
    formatter: (v) => (
      <div className='flex items-center gap-x-2 h-4'>
        <div
          className={cn('hidden size-2 rounded-full bg-blue-500', {
            'bg-orange-400': !v,
          })}
        />
        <span className='hidden text-xs font-brk'>
          {v ? (labels.trueLabel ?? 'True') : (labels.falseLabel ?? 'False')}
        </span>
        <StatusBadge
          status={
            v ? (labels.trueLabel ?? 'True') : (labels.falseLabel ?? 'False')
          }
        />
      </div>
    ),
  })
  cell.displayName = `BooleanCell(${String(prop)})`
  return cell
}
const StatusBadge = ({status}: {status: string}) => {
  return (
    <div className='flex flex-wrap gap-1'>
      <span
        data-slot='badge'
        className='aria-invalid:ring-destructive/20 inline-flex w-fit shrink-0 items-center justify-center gap-2 dark:bg-greyed bg-vim/10 rounded-full whitespace-nowrap transition-all [&amp;&gt;svg]:pointer-events-none [&amp;&gt;svg]:size-3 px-2 py-0.5 text-foreground text-xs'>
        <div className='flex items-center gap-1.5'>
          <div
            className='size-2 rounded-full bg-amber-200'
            aria-hidden='true'
          />
          <span className='font-brk'>{status}</span>
        </div>
      </span>
    </div>
  )
}

/**
 * Editable status toggle cell that saves directly to Convex
 * Toggles between active/inactive (true/false) and saves immediately
 */
export const editableStatusCell = <T,>(
  prop: keyof T,
  labels: {trueLabel?: string; falseLabel?: string} = {},
  className?: ClassName,
) => {
  const EditableStatusComponent = (ctx: CellContext<T, unknown>) => {
    const [isUpdating, setIsUpdating] = useState(false)
    const patchMutation = useMutation(api.orders.m.updateOrderStatus)
    const value = ctx.row.getValue(prop as string) as boolean
    // Access _id from the row data (Convex adds this automatically)
    const id = (ctx.row.original as {_id: Id<'orders'>})._id

    const handleToggle = useCallback(async () => {
      setIsUpdating(true)
      try {
        if (value) {
          // await patchMutation({
          //   orderId: id,
          //   // internalNotes: value ? 'Status updated' : undefined,
          // })
        }
      } catch (error) {
        console.error('Failed to update status:', error)
      } finally {
        setIsUpdating(false)
      }
    }, [value])

    return (
      <button
        onClick={handleToggle}
        disabled={isUpdating}
        className={cn(
          'flex items-center gap-1 rounded-full border transition-all',
          'hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed',
          'w-fit rounded-full flex items-center border-zinc-200 dark:border-zinc-700',
          'border-[0.33px] py-0.5 px-1.5 capitalized font-brk text-xs tracking-tighter',
          className,
        )}>
        {isUpdating ? (
          <div className='size-2 mr-0.5 border-2 border-current border-t-transparent rounded-full animate-spin' />
        ) : (
          <div
            className={cn('size-2 mr-0.5 rounded-full bg-blue-500', {
              'bg-orange-400': !value,
            })}
          />
        )}
        <span>
          {value
            ? (labels.trueLabel ?? 'Active')
            : (labels.falseLabel ?? 'Inactive')}
        </span>
      </button>
    )
  }
  EditableStatusComponent.displayName = `EditableStatusCell(${String(prop)})`
  return EditableStatusComponent
}

/**
 * Configuration for the generic toggle cell factory
 */
type ToggleCellConfig<T, V> = {
  /** The two values to toggle between [firstValue, secondValue] */
  values: readonly [V, V]
  /** Labels for each value state [firstLabel, secondLabel] */
  labels?: readonly [string, string]
  /** CSS classes for the indicator dot [firstColor, secondColor] */
  colors?: readonly [SwitchProps['color'], SwitchProps['color']]
  /** Build mutation args from row and new value */
  getMutationArgs: (row: T, newValue: V) => Record<string, unknown>
  /** Optional className for the button */
  className?: ClassName
}

/**
 * Generic factory for creating toggle cells that update Convex records.
 * Supports toggling between any two values (not just boolean).
 *
 * @example
 * // Toggle between 'active' and 'inactive' status strings
 * const StatusToggle = createToggleCell<Doc<'projects'>, 'active' | 'inactive'>(
 *   'status',
 *   api.projects.m.patch,
 *   {
 *     values: ['active', 'inactive'],
 *     labels: ['Active', 'Inactive'],
 *     colors: ['bg-emerald-500', 'bg-amber-500'],
 *     getMutationArgs: (row, newValue) => ({ id: row._id, status: newValue }),
 *   }
 * )
 *
 * @example
 * // Toggle between numeric priority levels
 * const PriorityToggle = createToggleCell<Doc<'tasks'>, 1 | 2>(
 *   'priority',
 *   api.tasks.m.update,
 *   {
 *     values: [1, 2],
 *     labels: ['High', 'Low'],
 *     colors: ['bg-red-500', 'bg-gray-400'],
 *     getMutationArgs: (row, newValue) => ({ id: row._id, priority: newValue }),
 *   }
 * )
 */
export const toggleCell = <T, V>(
  prop: keyof T,
  mutation: FunctionReference<'mutation', 'public'>,
  config: ToggleCellConfig<T, V>,
) => {
  const {
    values,
    labels = [String(values[0]), String(values[1])],
    colors = ['default', 'primary'],
    getMutationArgs,
    className,
  } = config

  const ToggleCellComponent = (ctx: CellContext<T, unknown>) => {
    const [isUpdating, setIsUpdating] = useState(false)
    const patchMutation = useMutation(mutation)
    const currentValue = ctx.row.getValue(prop as string) as V
    const row = ctx.row.original

    // Determine which value is current and which to toggle to
    const isFirstValue = currentValue === values[0]
    const newValue = isFirstValue ? values[1] : values[0]
    const currentLabel = isFirstValue ? labels[0] : labels[1]
    const currentColor: SwitchProps['color'] = isFirstValue
      ? colors[0]
      : colors[1]

    const handleToggle = useCallback(async () => {
      setIsUpdating(true)
      try {
        const args = getMutationArgs(row, newValue)
        await patchMutation(args)
      } catch (error) {
        console.error('Failed to toggle value:', error)
      } finally {
        setIsUpdating(false)
      }
    }, [row, newValue, patchMutation])

    return (
      <div className='px-0.5 flex justify-center'>
        <Switch
          size='sm'
          isDisabled={isUpdating}
          isSelected={isFirstValue}
          onValueChange={handleToggle}
          color={currentColor ?? 'default'}
          className={cn('scale-50', className)}
        />
      </div>
    )
  }

  ToggleCellComponent.displayName = `ToggleCell(${String(prop)})`
  return ToggleCellComponent
  /*
  <button
          onClick={handleToggle}
          disabled={isUpdating}
          className={cn(
            'flex items-center w-fit gap-0.5 py-0.5 px-2 rounded-full',
            'border-[0.33px] border-zinc-200 dark:border-zinc-700',
            'hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed',
            'capitalize font-space text-sm tracking-tighter',
            className,
          )}>
          {isUpdating ? (
            <div className='size-2 mr-1.5 border border-current border-t-transparent rounded-full animate-spin' />
          ) : (
            <div className={cn('size-2 mr-1.5 rounded-full', currentColor)} />
          )}
          <span>{currentLabel}</span>
        </button>
  */
}

/**
 * Editable remarks cell with inline textarea/input that saves to Convex
 * Saves on blur or Enter key (with Escape to cancel)
 */
export const editableCell = <T,>(
  prop: keyof T,
  className?: ClassName,
  placeholder = 'Add notes...',
) => {
  const EditableRemarksComponent = (ctx: CellContext<T, unknown>) => {
    const [isEditing, setIsEditing] = useState(false)
    const [isUpdating, setIsUpdating] = useState(false)
    const inputRef = useRef<HTMLTextAreaElement>(null)
    const patchMutation = useMutation(api.orders.m.updateOrderStatus)
    const originalValue = (ctx.row.getValue(prop as string) as string) ?? ''
    // Access _id from the row data (Convex adds this automatically)
    const id = (ctx.row.original as {_id: Id<'orders'>})._id
    const [localValue, setLocalValue] = useState(originalValue)

    // Focus input when editing starts
    useEffect(() => {
      if (isEditing && inputRef.current) {
        inputRef.current.focus()
        inputRef.current.select()
      }
    }, [isEditing])

    const handleSave = useCallback(async () => {
      if (localValue === originalValue) {
        setIsEditing(false)
        return
      }

      setIsUpdating(true)
      try {
        if (localValue) {
          await patchMutation({
            orderId: id,
            status: localValue as OrderStatus,
          })
        }

        setIsEditing(false)
      } catch (error) {
        console.error('Failed to update remarks:', error)
        // Revert on error
        setLocalValue(originalValue)
        setIsEditing(false)
      } finally {
        setIsUpdating(false)
      }
    }, [id, localValue, originalValue, patchMutation])

    const handleCancel = useCallback(() => {
      setLocalValue(originalValue)
      setIsEditing(false)
    }, [originalValue])

    const handleStartEditing = useCallback(() => {
      setLocalValue(originalValue)
      setIsEditing(true)
    }, [originalValue])

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
          e.preventDefault()
          handleSave()
        } else if (e.key === 'Escape') {
          e.preventDefault()
          handleCancel()
        }
      },
      [handleSave, handleCancel],
    )

    if (isEditing) {
      return (
        <div className='relative'>
          <textarea
            ref={inputRef}
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            disabled={isUpdating}
            placeholder={placeholder}
            rows={1}
            className={cn(
              'w-full min-w-50 resize-none rounded-md px-2 py-1 text-xs md:text-sm',
              'bg-background dark:bg-background/50 border border-primary/50',
              'focus:outline-none focus:ring-2 focus:ring-primary/20',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              className,
            )}
            style={{
              minHeight: '20px',
              maxHeight: '120px',
            }}
          />
          {isUpdating && (
            <div className='absolute top-1 right-1 size-3 border-2 border-current border-t-transparent rounded-full animate-spin' />
          )}
        </div>
      )
    }

    return (
      <button
        onClick={handleStartEditing}
        className={cn(
          'w-full min-w-50 text-left px-2 py-1 rounded-md',
          'hover:bg-accent/50 transition-colors',
          'text-xs md:text-sm text-muted-foreground',
          'truncate',
          className,
        )}
        title={originalValue || placeholder}>
        {originalValue || (
          <span className='italic text-muted-foreground/60'>{placeholder}</span>
        )}
      </button>
    )
  }
  EditableRemarksComponent.displayName = `EditableRemarksCell(${String(prop)})`
  return EditableRemarksComponent
}

type UserCellOptions<T> = {
  /** Label text shown as the main link title (e.g. full name / display name). */
  getName: (row: T) => string | null | undefined
  /** Optional avatar URL for the left-side AvatarImage. */
  getPhotoUrl?: (row: T) => string | null | undefined
  /** Optional secondary line (e.g. gmail/email/phone). */
  getSecondary?: (row: T) => string | null | undefined
  /**
   * URL builder for the link. If omitted, the cell will render name as plain text.
   * Use this when different tables need different route params (e.g. legacyId vs _id).
   */
  getHref?: (pathname: string, row: T) => string
}

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const initials = parts
    .map((p) => p[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()
  return initials.length > 0 ? initials : '—'
}

/**
 * Factory to create a schema-safe "user row" cell.
 *
 * Usage:
 *   const LegacyUserCell = createUserCell<Doc<'legacyUsers'>>({...})
 *   const UserProfileCell = createUserCell<Doc<'userProfiles'>>({...})
 */
export const createUserCell = <T,>(options: UserCellOptions<T>) => {
  const UserCellComponent = (ctx: CellContext<T, unknown>) => {
    const row = ctx.row.original
    const pathname = usePathname()
    const router = useRouter()

    const name = options.getName(row) ?? '—'
    const photoUrl = options.getPhotoUrl?.(row) ?? null
    const secondary = options.getSecondary?.(row) ?? null
    const href = options.getHref?.(pathname, row) ?? null
    const initials = getInitials(name)

    const withViewTransition = useCallback((fn: () => void) => {
      const doc = document as Document & {
        startViewTransition?: (callback: () => void) => unknown
      }
      if (typeof doc.startViewTransition === 'function') {
        doc.startViewTransition(() => {
          fn()
        })
        return
      }
      fn()
    }, [])

    const onLinkClick = useCallback(
      (e: ReactMouseEvent<HTMLAnchorElement>) => {
        if (!href) return
        // Allow open-in-new-tab, etc.
        if (
          e.button !== 0 ||
          e.metaKey ||
          e.ctrlKey ||
          e.shiftKey ||
          e.altKey
        ) {
          return
        }
        e.preventDefault()
        withViewTransition(() => {
          startTransition(() => {
            router.push(href)
          })
        })
      },
      [href, router, withViewTransition],
    )

    return (
      <div className='flex items-center gap-3'>
        <Avatar
          src={photoUrl ?? undefined}
          fallback={initials}
          className='size-8 shrink-0 aspect-auto'
        />

        <div className='flex flex-col min-w-0'>
          {href ? (
            <Link
              href={href}
              onClick={onLinkClick}
              className='font-figtree uppercase hover:text-mac-blue text-sm truncate w-[35ch] max-w-[35ch]'>
              {name}
            </Link>
          ) : (
            <div className='font-figtree uppercase text-sm truncate w-[35ch] max-w-[35ch]'>
              {name}
            </div>
          )}

          {secondary ? (
            <span className='font-mono text-xs text-muted-foreground truncate'>
              {secondary}
            </span>
          ) : null}
        </div>
      </div>
    )
  }

  UserCellComponent.displayName = `UserCell`
  return UserCellComponent
}

export const UserCell = createUserCell<Doc<'users'>>({
  getName: (u) => u.name,
  getPhotoUrl: (u) => u.photoUrl,
  getSecondary: (u) => u.email ?? null,
})

export const UserProfileCell = createUserCell<Doc<'users'>>({
  getName: (u) => u.name,
  getPhotoUrl: (u) => u.photoUrl,
  getSecondary: (u) => u.email ?? null,
})

import {ClassName} from '@/app/types'
import {cn} from '@/lib/utils'
import {Avatar} from '@heroui/react'
import {CellContext} from '@tanstack/react-table'
// import {useMutation} from 'convex/react'
import {Doc} from '@/convex/_generated/dataModel'
import {formatDate} from '@/utils/date'
import {type ReactNode} from 'react'

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
      return <div className={options.className}>{options.fallback ?? '—'}</div>
    }

    const value = options.formatter
      ? options.formatter(rawValue, ctx)
      : rawValue

    return <div className={options.className}>{value as string}</div>
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
      <>
        <div
          className={cn('size-2 mr-1.5 rounded-full bg-blue-500', {
            'bg-orange-400': !v,
          })}
        />
        {v ? (labels.trueLabel ?? 'True') : (labels.falseLabel ?? 'False')}
      </>
    ),
  })
  cell.displayName = `BooleanCell(${String(prop)})`
  return cell
}

// NOTE: These functions reference a non-existent 'cards' API
// Uncomment and update when the API is available
/*
 * Editable status toggle cell that saves directly to Convex
 * Toggles between active/inactive (true/false) and saves immediately
 */
// export const editableStatusCell = <T,>(
//   prop: keyof T,
//   labels: {trueLabel?: string; falseLabel?: string} = {},
//   className?: ClassName,
// ) => {
//   const EditableStatusComponent = (ctx: CellContext<T, unknown>) => {
//     const [isUpdating, setIsUpdating] = useState(false)
//     const patchMutation = useMutation(api.cards.create.patch)
//     const value = ctx.row.getValue(prop as string) as boolean
//     const id = (ctx.row.original as any)._id as Id<'cards'>
//
//     const handleToggle = useCallback(async () => {
//       setIsUpdating(true)
//       try {
//         await patchMutation({
//           id,
//           visible: !value,
//         })
//       } catch (error) {
//         console.error('Failed to update status:', error)
//       } finally {
//         setIsUpdating(false)
//       }
//     }, [id, value, patchMutation])
//
//     return (
//       <button
//         onClick={handleToggle}
//         disabled={isUpdating}
//         className={cn(
//           'flex items-center gap-1.5 px-2 py-1 rounded-full border transition-all',
//           'hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed',
//           'w-fit rounded-full flex items-center border-zinc-200 dark:border-zinc-700',
//           'border-[0.33px] py-0.5 px-1.5 capitalized font-space text-sm tracking-tighter',
//           className,
//         )}>
//         {isUpdating ? (
//           <div className='size-2 mr-1.5 border-2 border-current border-t-transparent rounded-full animate-spin' />
//         ) : (
//           <div
//             className={cn('size-2 mr-1.5 rounded-full bg-blue-500', {
//               'bg-orange-400': !value,
//             })}
//           />
//         )}
//         <span>
//           {value
//             ? (labels.trueLabel ?? 'Active')
//             : (labels.falseLabel ?? 'Inactive')}
//         </span>
//       </button>
//     )
//   }
//   EditableStatusComponent.displayName = `EditableStatusCell(${String(prop)})`
//   return EditableStatusComponent
// }

/**
 * Editable remarks cell with inline textarea/input that saves to Convex
 * Saves on blur or Enter key (with Escape to cancel)
 */
// export const editableRemarksCell = <T,>(
//   prop: keyof T,
//   className?: ClassName,
//   placeholder = 'Add remarks...',
// ) => {
//   const EditableRemarksComponent = (ctx: CellContext<T, unknown>) => {
//     const [isEditing, setIsEditing] = useState(false)
//     const [localValue, setLocalValue] = useState('')
//     const [isUpdating, setIsUpdating] = useState(false)
//     const inputRef = useRef<HTMLTextAreaElement>(null)
//     const patchMutation = useMutation(api.cards.create.patch)
//     const originalValue = (ctx.row.getValue(prop as string) as string) ?? ''
//     const id = (ctx.row.original as any)._id as Id<'cards'>
//
//     useEffect(() => {
//       setLocalValue(originalValue)
//     }, [originalValue])
//
//     useEffect(() => {
//       if (isEditing && inputRef.current) {
//         inputRef.current.focus()
//         inputRef.current.select()
//       }
//     }, [isEditing])
//
//     const handleSave = useCallback(async () => {
//       if (localValue === originalValue) {
//         setIsEditing(false)
//         return
//       }
//
//       setIsUpdating(true)
//       try {
//         await patchMutation({
//           id,
//           remarks: localValue || null,
//         })
//         setIsEditing(false)
//       } catch (error) {
//         console.error('Failed to update remarks:', error)
//         setLocalValue(originalValue)
//         setIsEditing(false)
//       } finally {
//         setIsUpdating(false)
//       }
//     }, [id, localValue, originalValue, patchMutation])
//
//     const handleCancel = useCallback(() => {
//       setLocalValue(originalValue)
//       setIsEditing(false)
//     }, [originalValue])
//
//     const handleKeyDown = useCallback(
//       (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
//         if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
//           e.preventDefault()
//           handleSave()
//         } else if (e.key === 'Escape') {
//           e.preventDefault()
//           handleCancel()
//         }
//       },
//       [handleSave, handleCancel],
//     )
//
//     if (isEditing) {
//       return (
//         <div className='relative'>
//           <textarea
//             ref={inputRef}
//             value={localValue}
//             onChange={(e) => setLocalValue(e.target.value)}
//             onBlur={handleSave}
//             onKeyDown={handleKeyDown}
//             disabled={isUpdating}
//             placeholder={placeholder}
//             rows={2}
//             className={cn(
//               'w-full min-w-[200px] resize-none rounded-md px-2 py-1 text-xs md:text-sm',
//               'bg-background dark:bg-background/50 border border-primary/50',
//               'focus:outline-none focus:ring-2 focus:ring-primary/20',
//               'disabled:opacity-50 disabled:cursor-not-allowed',
//               className,
//             )}
//             style={{
//               minHeight: '32px',
//               maxHeight: '120px',
//             }}
//           />
//           {isUpdating && (
//             <div className='absolute top-1 right-1 size-3 border-2 border-current border-t-transparent rounded-full animate-spin' />
//           )}
//         </div>
//       )
//     }
//
//     return (
//       <button
//         onClick={() => setIsEditing(true)}
//         className={cn(
//           'w-full min-w-[200px] text-left px-2 py-1 rounded-md',
//           'hover:bg-accent/50 transition-colors',
//           'text-xs md:text-sm text-muted-foreground',
//           'truncate',
//           className,
//         )}
//         title={originalValue || placeholder}>
//         {originalValue || (
//           <span className='italic text-muted-foreground/60'>{placeholder}</span>
//         )}
//       </button>
//     )
//   }
//   EditableRemarksComponent.displayName = `EditableRemarksCell(${String(prop)})`
//   return EditableRemarksComponent
// }

export const UserCell = (ctx: CellContext<Doc<'users'>, unknown>) => {
  const {name, email, photoUrl} = ctx.row.original

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  return (
    <div className='flex items-center gap-3'>
      <Avatar
        src={photoUrl ?? undefined}
        name={initials}
        className='size-8 shrink-0 aspect-auto'
        classNames={{
          base: 'aspect-auto',
          img: 'aspect-auto',
        }}
      />
      <div className='flex flex-col'>
        <span className='font-figtree uppercase text-sm truncate w-[35ch] max-w-[35ch]'>
          {name}
        </span>
        {email && (
          <span className='font-mono text-xs text-muted-foreground truncate'>
            {email}
          </span>
        )}
      </div>
    </div>
  )
}

export const SocialLinksCell = (ctx: CellContext<Doc<'users'>, unknown>) => {
  const {socialMedia} = ctx.row.original
  const website = socialMedia?.website

  return (
    <span className='font-space text-sm truncate text-clip w-[13ch]'>
      {website || '—'}
    </span>
  )
}

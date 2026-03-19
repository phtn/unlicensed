'use client'

import {ItemInstance, TreeInstance} from '@headless-tree/core'
import {Slot} from 'radix-ui'
import {
  ButtonHTMLAttributes,
  createContext,
  CSSProperties,
  Fragment,
  HTMLAttributes,
  useContext,
} from 'react'

import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'

type ToggleIconType = 'chevron-right' | 'plus-minus'

export interface ItemType {
  name: string
  children?: string[]
}

type TreeRenderInstance = Pick<
  TreeInstance<ItemType>,
  'getContainerProps' | 'getDragLineStyle'
>

type TreeRenderItem = Pick<
  ItemInstance<ItemType>,
  | 'getItemMeta'
  | 'getItemName'
  | 'getProps'
  | 'isDragTarget'
  | 'isExpanded'
  | 'isFocused'
  | 'isFolder'
  | 'isMatchingSearch'
  | 'isSelected'
>

type TreeStyle = CSSProperties & {
  '--tree-indent'?: string
  '--tree-padding'?: string
}

interface TreeContextValue {
  indent: number
  currentItem?: TreeRenderItem
  tree?: TreeRenderInstance
  toggleIconType: ToggleIconType
}

const TreeContext = createContext<TreeContextValue>({
  indent: 20,
  currentItem: undefined,
  tree: undefined,
  toggleIconType: 'plus-minus',
})

function useTreeContext() {
  return useContext(TreeContext)
}

interface TreeProps extends HTMLAttributes<HTMLDivElement> {
  indent?: number
  tree?: TreeRenderInstance
  toggleIconType?: ToggleIconType
  asChild?: boolean
}

function Tree({
  indent = 20,
  tree,
  className,
  toggleIconType = 'chevron-right',
  asChild = false,
  ...props
}: TreeProps) {
  const containerProps =
    tree && typeof tree.getContainerProps === 'function'
      ? tree.getContainerProps()
      : {}
  const mergedProps = {...props, ...containerProps}

  // Extract style from mergedProps to merge with our custom styles
  const {style: propStyle, ...otherProps} = mergedProps

  // Merge styles
  const mergedStyle: TreeStyle = {
    ...propStyle,
    '--tree-indent': `${indent}px`,
  }

  const Comp = asChild ? Slot.Root : 'div'

  return (
    <TreeContext.Provider value={{indent, tree, toggleIconType}}>
      <Comp
        data-slot='tree'
        style={mergedStyle}
        className={cn('flex flex-col', className)}
        {...otherProps}
      />
    </TreeContext.Provider>
  )
}

interface TreeItemProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'indent'
> {
  item: TreeRenderItem
  asChild?: boolean
}

function TreeItem({
  item,
  className,
  asChild = false,
  children,
  ...props
}: TreeItemProps) {
  const parentContext = useTreeContext()
  const {indent} = parentContext

  const itemProps = typeof item.getProps === 'function' ? item.getProps() : {}
  const mergedProps = {...props, children, ...itemProps}

  // Extract style from mergedProps to merge with our custom styles
  const {style: propStyle, ...otherProps} = mergedProps

  // Merge styles
  const mergedStyle: TreeStyle = {
    ...propStyle,
    '--tree-padding': `${item.getItemMeta().level * indent}px`,
  }

  const defaultProps = {
    'data-slot': 'tree-item',
    style: mergedStyle,
    className: cn(
      'z-10 ps-(--tree-padding) outline-hidden select-none not-last:pb-0.5 focus:z-20 data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className,
    ),
    'data-focus':
      typeof item.isFocused === 'function'
        ? item.isFocused() || false
        : undefined,
    'data-folder':
      typeof item.isFolder === 'function'
        ? item.isFolder() || false
        : undefined,
    'data-selected':
      typeof item.isSelected === 'function'
        ? item.isSelected() || false
        : undefined,
    'data-drag-target':
      typeof item.isDragTarget === 'function'
        ? item.isDragTarget() || false
        : undefined,
    'data-search-match':
      typeof item.isMatchingSearch === 'function'
        ? item.isMatchingSearch() || false
        : undefined,
    'aria-expanded': item.isExpanded(),
  }

  const Comp = asChild ? Slot.Root : 'button'

  return (
    <TreeContext.Provider value={{...parentContext, currentItem: item}}>
      <Comp {...defaultProps} {...otherProps}>
        {children}
      </Comp>
    </TreeContext.Provider>
  )
}

interface TreeItemLabelProps extends HTMLAttributes<HTMLSpanElement> {
  item?: TreeRenderItem
  asChild?: boolean
}

function TreeItemLabel({
  item: propItem,
  children,
  className,
  asChild = false,
  ...props
}: TreeItemLabelProps) {
  const {currentItem, toggleIconType} = useTreeContext()
  const item = propItem || currentItem

  if (!item) {
    console.warn('TreeItemLabel: No item provided via props or context')
    return null
  }

  const Comp = asChild ? Slot.Root : 'span'

  return (
    <Comp
      data-slot='tree-item-label'
      className={cn(
        'in-focus-visible:ring-ring/50 bg-background hover:bg-accent in-data-[selected=true]:bg-accent in-data-[selected=true]:text-accent-foreground in-data-[drag-target=true]:bg-accent flex items-center gap-1 transition-colors not-in-data-[folder=true]:ps-7 in-focus-visible:ring-[3px] in-data-[search-match=true]:bg-blue-50! [&_svg]:pointer-events-none [&_svg]:shrink-0',
        'rounded-sm',
        'py-1.5',
        'px-2',
        'text-sm',
        className,
      )}
      {...props}>
      <Fragment>
        {item.isFolder() &&
          (toggleIconType === 'plus-minus' ? (
            item.isExpanded() ? (
              <Icon
                name='minus'
                className='text-muted-foreground size-3.5'
                stroke='currentColor'
                strokeWidth='1'
              />
            ) : (
              <Icon
                name='plus'
                className='text-muted-foreground size-3.5'
                stroke='currentColor'
                strokeWidth='1'
              />
            )
          ) : (
            <Icon
              name='chevron-down'
              className='text-muted-foreground size-4 in-aria-[expanded=false]:-rotate-90'
            />
          ))}
        {children ||
          (typeof item.getItemName === 'function' ? item.getItemName() : null)}
      </Fragment>
    </Comp>
  )
}

function TreeDragLine({className, ...props}: HTMLAttributes<HTMLDivElement>) {
  const {tree} = useTreeContext()

  if (!tree || typeof tree.getDragLineStyle !== 'function') {
    console.warn(
      'TreeDragLine: No tree provided via context or tree does not have getDragLineStyle method',
    )
    return null
  }

  const dragLine = tree.getDragLineStyle()
  return (
    <div
      style={dragLine}
      className={cn(
        'bg-primary before:bg-background before:border-primary absolute z-30 -mt-px h-0.5 w-[unset] before:absolute before:-top-0.75 before:left-0 before:size-2 before:border-2',
        'before:rounded-full',
        className,
      )}
      {...props}
    />
  )
}

export {Tree, TreeDragLine, TreeItem, TreeItemLabel}

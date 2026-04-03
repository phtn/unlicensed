/* eslint-disable @typescript-eslint/ban-ts-comment, @next/next/no-img-element */
// @ts-nocheck
'use client'

import {cn} from '@/lib/utils'
import * as HeroUI from '@heroui/react'
import {
  Children,
  createContext,
  forwardRef,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ButtonHTMLAttributes,
  type ChangeEvent,
  type CSSProperties,
  type ElementType,
  type HTMLAttributes,
  type ImgHTMLAttributes,
  type InputHTMLAttributes,
  type Key,
  type MouseEvent,
  type ReactElement,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'

export * from '@heroui/react'

type LegacyClassValue = string | false | null | undefined | LegacyClassValue[]
type LegacyClassNames = Record<string, LegacyClassValue> | undefined

type LooseDivProps = HTMLAttributes<HTMLDivElement> & {[key: string]: unknown}
type LooseButtonElementProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  [key: string]: unknown
}
type LooseSpanProps = Omit<HTMLAttributes<HTMLSpanElement>, 'content'> & {
  [key: string]: unknown
}
type LooseImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  [key: string]: unknown
}

type ExtendVariantsConfig = {
  variants?: Record<string, Record<string, {base?: string; class?: string}>>
  defaultVariants?: Record<string, string>
  compoundVariants?: Array<Record<string, string> & {class?: string}>
}

const normalizeClassValue = (value: LegacyClassValue): string | undefined => {
  if (Array.isArray(value)) {
    const normalized = value
      .map((item) => normalizeClassValue(item))
      .filter(Boolean)
      .join(' ')

    return normalized || undefined
  }

  return value || undefined
}

const normalizeClassNames = (classNames?: LegacyClassNames) => {
  if (!classNames) return undefined

  return Object.fromEntries(
    Object.entries(classNames)
      .map(([slot, value]) => [slot, normalizeClassValue(value)])
      .filter((entry) => Boolean(entry[1])),
  )
}

type TableCompatContextValue = {
  classNames?: Record<string, string>
  rowColumns?: Array<{id: Key; columnKey: Key}>
}

const TableCompatContext = createContext<TableCompatContextValue>({})

const getCollectionItemId = (item: unknown): Key | undefined => {
  if (!item || typeof item !== 'object') return undefined

  const record = item as Record<string, unknown>
  return (record.id ?? record.key ?? record.uid ?? record._id) as
    | Key
    | undefined
}

const normalizeCollectionItems = <T,>(items?: Iterable<T>) => {
  if (!items) return undefined

  let didNormalize = false
  const normalizedItems: T[] = []

  for (const item of items) {
    if (item && typeof item === 'object') {
      const record = item as Record<string, unknown>
      const itemId = getCollectionItemId(item)

      if (itemId != null && record.id == null && record.key == null) {
        normalizedItems.push({...record, id: itemId} as T)
        didNormalize = true
        continue
      }
    }

    normalizedItems.push(item)
  }

  if (!didNormalize && Array.isArray(items)) {
    return items
  }

  return normalizedItems
}

const toRowColumns = (
  items?: Iterable<unknown>,
): Array<{id: Key; columnKey: Key}> | undefined => {
  if (!items) return undefined

  const rowColumns: Array<{id: Key; columnKey: Key}> = []

  for (const item of items) {
    const itemId = getCollectionItemId(item)

    if (itemId != null) {
      rowColumns.push({id: itemId, columnKey: itemId})
    }
  }

  return rowColumns.length > 0 ? rowColumns : undefined
}

const extractDynamicColumns = (
  children: ReactNode,
): Array<{id: Key; columnKey: Key}> | undefined => {
  for (const child of Children.toArray(children)) {
    if (!isValidElement(child)) continue

    if (child.type === TableHeader) {
      return toRowColumns(normalizeCollectionItems(child.props.columns))
    }

    if (child.props?.children) {
      const nestedColumns = extractDynamicColumns(child.props.children)

      if (nestedColumns) return nestedColumns
    }
  }

  return undefined
}

const BUTTON_COMPONENT_PROP_ALLOWLIST = new Set([
  'id',
  'role',
  'title',
  'style',
  'tabIndex',
  'target',
  'rel',
  'download',
  'onMouseEnter',
  'onMouseLeave',
  'onMouseDown',
  'onMouseUp',
  'onFocus',
  'onBlur',
  'onKeyDown',
  'onKeyUp',
])

const pickButtonComponentProps = (
  props: Record<string, unknown>,
): Record<string, unknown> => {
  const nextProps: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(props)) {
    if (value === undefined) continue

    if (
      key.startsWith('aria-') ||
      key.startsWith('data-') ||
      BUTTON_COMPONENT_PROP_ALLOWLIST.has(key)
    ) {
      nextProps[key] = value
    }
  }

  return nextProps
}

const radiusClassName = (radius?: string) => {
  switch (radius) {
    case 'none':
      return 'rounded-none'
    case 'sm':
      return 'rounded-sm'
    case 'md':
      return 'rounded-md'
    case 'lg':
      return 'rounded-lg'
    case 'full':
      return 'rounded-full'
    default:
      return undefined
  }
}

const normalizeOverlayPlacement = (placement?: string) => {
  if (!placement) return undefined

  switch (placement) {
    case 'top-center':
      return 'top'
    case 'bottom-center':
      return 'bottom'
    case 'left-center':
      return 'left'
    case 'right-center':
      return 'right'
    default:
      return placement.replace(/-/g, ' ')
  }
}

const shadowClassName = (shadow?: string) => {
  switch (shadow) {
    case 'none':
      return 'shadow-none'
    case 'sm':
      return 'shadow-sm'
    case 'md':
      return 'shadow-md'
    case 'lg':
      return 'shadow-lg'
    default:
      return undefined
  }
}

const mapButtonVariant = (variant?: string, color?: string) => {
  if (color === 'danger' && variant === 'flat') return 'danger-soft'

  switch (variant) {
    case 'solid':
      return 'primary'
    case 'bordered':
    case 'faded':
      return 'secondary'
    case 'light':
    case 'flat':
      return 'tertiary'
    default:
      return variant
  }
}

const mapSoftVariant = (variant?: string) => {
  switch (variant) {
    case 'solid':
      return 'primary'
    case 'bordered':
    case 'faded':
      return 'secondary'
    case 'shadow':
    case 'dot':
      return 'soft'
    case 'light':
    case 'flat':
      return 'tertiary'
    default:
      return variant
  }
}

const selectionToArray = (value: unknown) => {
  if (!value || value === 'all') return []
  if (value instanceof Set) return Array.from(value).map(String)
  if (Array.isArray(value)) return value.map(String)
  if (typeof value === 'string' || typeof value === 'number') {
    return [String(value)]
  }
  if (typeof value === 'object' && Symbol.iterator in value) {
    return Array.from(value as Iterable<unknown>).map(String)
  }
  return []
}

const normalizeSelection = (value?: SharedSelection) => {
  if (!value) return undefined
  if (value === 'all') return 'all'
  return new Set(Array.from(value).map((item) => String(item)))
}

const selectionFirstValue = (value?: SharedSelection) => {
  if (!value || value === 'all') return ''
  return String(Array.from(value)[0] ?? '')
}

const selectRenderValueItems = <T extends object = object>(
  values: unknown,
): SelectedItems<T> => {
  const candidateItems =
    values &&
    typeof values === 'object' &&
    'state' in values &&
    values.state &&
    typeof values.state === 'object' &&
    'selectedItems' in values.state &&
    Array.isArray(values.state.selectedItems)
      ? values.state.selectedItems
      : values &&
          typeof values === 'object' &&
          'selectedItems' in values &&
          Array.isArray(values.selectedItems)
        ? values.selectedItems
        : []

  return candidateItems.map((item, index) => {
    if (!item || typeof item !== 'object') {
      return {
        key: index,
        textValue: item == null ? '' : String(item),
        value: item as T,
      }
    }

    const record = item as {
      key?: Key
      textValue?: string
      rendered?: ReactNode
      value?: T
      props?: {
        children?: ReactNode
        textValue?: string
      }
      id?: Key
      label?: ReactNode
      name?: ReactNode
    }

    const rendered = record.rendered ?? record.props?.children
    const textValue =
      record.textValue ??
      record.props?.textValue ??
      (typeof record.label === 'string'
        ? record.label
        : typeof record.name === 'string'
          ? record.name
          : typeof rendered === 'string'
            ? rendered
            : undefined)

    return {
      key: record.key ?? record.id ?? index,
      textValue,
      rendered,
      value: (record.value ?? item) as T,
    }
  })
}

const initialsFromName = (name?: ReactNode) => {
  if (typeof name !== 'string') return 'U'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'U'

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

const checkboxRadiusClassName = (radius?: string) =>
  radiusClassName(radius ?? 'md')

const checkboxSizeClassName = (size?: string) => {
  switch (size) {
    case 'sm':
      return 'h-4 w-4'
    case 'lg':
      return 'h-6 w-6'
    default:
      return 'h-5 w-5'
  }
}

const checkboxColorClassName = (color?: string) => {
  switch (color) {
    case 'primary':
      return 'border-primary data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground'
    case 'secondary':
      return 'border-secondary data-[selected=true]:bg-secondary data-[selected=true]:text-secondary-foreground'
    case 'success':
      return 'border-emerald-500 data-[selected=true]:bg-emerald-500 data-[selected=true]:text-white'
    case 'warning':
      return 'border-amber-500 data-[selected=true]:bg-amber-500 data-[selected=true]:text-white'
    case 'danger':
      return 'border-rose-500 data-[selected=true]:bg-rose-500 data-[selected=true]:text-white'
    default:
      return 'border-foreground/20 data-[selected=true]:bg-foreground data-[selected=true]:text-background'
  }
}

export type SharedSelection = Set<Key> | 'all'

export interface SelectedItem<T = unknown> {
  key: Key
  textValue?: string
  rendered?: ReactNode
  value?: T
}

export type SelectedItems<T = unknown> = SelectedItem<T>[]

const LegacyModalContext = createContext<{close: () => void}>({
  close: () => undefined,
})

const LegacyDropdownContext = createContext<{
  placement?: string
  classNames?: LegacyClassNames
}>({
  placement: undefined,
  classNames: undefined,
})

const LegacyPopoverContext = createContext<{
  placement?: string
  offset?: number
  crossOffset?: number
  showArrow?: boolean
}>({
  placement: undefined,
  offset: undefined,
  crossOffset: undefined,
  showArrow: false,
})

const LegacyDrawerContext = createContext<{
  placement?: string
}>({
  placement: undefined,
})

const LegacyNavbarContext = createContext<{
  isMenuOpen: boolean
  setMenuOpen: (open: boolean) => void
}>({
  isMenuOpen: false,
  setMenuOpen: () => undefined,
})

const LegacyFlatTabsMarker = Symbol('legacy-flat-tabs-marker')

interface LegacyButtonProps extends LooseButtonElementProps {
  as?: ElementType
  href?: string
  variant?: string
  color?: string
  radius?: string
  size?: string
  isIconOnly?: boolean
  isDisabled?: boolean
  isLoading?: boolean
  fullWidth?: boolean
  disableAnimation?: boolean
  disableRipple?: boolean
  spinnerPlacement?: 'start' | 'end'
  startContent?: ReactNode
  endContent?: ReactNode
  prefetch?: boolean
  onPress?: () => void
  children?: ReactNode
}

export const Button = ({
  as: Component,
  href,
  variant,
  color,
  radius,
  size,
  className,
  disabled,
  isDisabled,
  isLoading,
  isIconOnly,
  fullWidth,
  disableAnimation,
  disableRipple,
  spinnerPlacement,
  startContent,
  endContent,
  prefetch,
  onPress,
  onClick,
  children,
  type = 'button',
  ...props
}: LegacyButtonProps) => {
  const isButtonDisabled = isDisabled ?? disabled ?? isLoading
  const componentProps = pickButtonComponentProps(props)
  const buttonClassName = cn(
    radiusClassName(radius),
    fullWidth && 'w-full',
    className,
  )
  const handleClick = (event: MouseEvent<HTMLElement>) => {
    if (isButtonDisabled) {
      event.preventDefault()
      event.stopPropagation()
      return
    }

    onClick?.(event)
    onPress?.()
  }

  if (Component) {
    return (
      <Component
        className={buttonClassName}
        href={href}
        prefetch={prefetch}
        aria-disabled={isButtonDisabled || undefined}
        onClick={handleClick}
        {...componentProps}>
        {startContent}
        {children}
        {endContent}
      </Component>
    )
  }

  return (
    <HeroUI.Button
      {...props}
      type={type}
      size={size}
      variant={mapButtonVariant(variant, color)}
      className={buttonClassName}
      isDisabled={isButtonDisabled}
      isLoading={isLoading}
      isIconOnly={isIconOnly}
      fullWidth={fullWidth}
      disableAnimation={disableAnimation}
      disableRipple={disableRipple}
      spinnerPlacement={spinnerPlacement}
      onPress={onPress}
      onClick={onClick}
      startContent={startContent}
      endContent={endContent}>
      {children}
    </HeroUI.Button>
  )
}

interface LegacyLinkProps extends HTMLAttributes<HTMLElement> {
  [key: string]: unknown
  as?: ElementType
  href?: string
  color?: string
  size?: string
  children?: ReactNode
}

export const Link = ({
  as: Component = 'a',
  href,
  className,
  children,
  ...props
}: LegacyLinkProps) => {
  return (
    <Component className={className} href={href} {...props}>
      {children}
    </Component>
  )
}

interface LegacyCardProps extends LooseDivProps {
  as?: ElementType
  href?: string
  radius?: string
  shadow?: string
  children?: ReactNode
}

export const Card = ({
  as: Component,
  href,
  radius,
  shadow,
  className,
  children,
  ...props
}: LegacyCardProps) => {
  const cardClassName = cn(
    radiusClassName(radius),
    shadowClassName(shadow),
    className,
  )

  if (Component) {
    return (
      <Component className={cardClassName} href={href} {...props}>
        {children}
      </Component>
    )
  }

  return (
    <HeroUI.Card className={cardClassName} {...props}>
      {children}
    </HeroUI.Card>
  )
}

export const CardHeader = ({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col gap-1 p-4', className)} {...props}>
    {children}
  </div>
)

export const CardContent = ({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('p-4', className)} {...props}>
    {children}
  </div>
)

export const CardBody = CardContent

export const CardFooter = ({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('p-4', className)} {...props}>
    {children}
  </div>
)

interface LegacyInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'size'
> {
  [key: string]: unknown
  label?: ReactNode
  labelPlacement?: string
  startContent?: ReactNode
  endContent?: ReactNode
  classNames?: LegacyClassNames
  errorMessage?: ReactNode
  description?: ReactNode
  isInvalid?: boolean
  radius?: string
  size?: string
  variant?: string
  fullWidth?: boolean
  isDisabled?: boolean
  onValueChange?: (value: string) => void
}

export const Input = forwardRef<HTMLInputElement, LegacyInputProps>(
  (
    {
      label,
      labelPlacement,
      startContent,
      endContent,
      classNames,
      errorMessage,
      description,
      isInvalid,
      radius,
      size: _size,
      variant: _variant,
      fullWidth = true,
      className,
      isDisabled,
      disabled,
      onChange,
      onValueChange,
      ...props
    },
    ref,
  ) => {
    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      onChange?.(event)
      onValueChange?.(event.currentTarget.value)
    }

    return (
      <div
        className={cn(
          fullWidth && 'w-full',
          normalizeClassValue(classNames?.base),
          className,
        )}>
        {label && labelPlacement !== 'inside' ? (
          <label className={normalizeClassValue(classNames?.label)}>
            {label}
          </label>
        ) : null}
        <div
          className={cn(
            'flex items-center gap-2 rounded-md border border-foreground/10 px-3 py-2',
            radiusClassName(radius),
            isInvalid && 'border-danger',
            normalizeClassValue(classNames?.inputWrapper),
          )}>
          {startContent}
          <input
            {...props}
            ref={ref}
            disabled={isDisabled ?? disabled}
            className={cn(
              'min-w-0 flex-1 bg-transparent outline-none',
              normalizeClassValue(classNames?.input),
            )}
            onChange={handleChange}
          />
          {endContent}
        </div>
        {description ? (
          <p
            className={cn(
              'text-xs text-muted-foreground',
              normalizeClassValue(classNames?.description),
            )}>
            {description}
          </p>
        ) : null}
        {errorMessage ? (
          <p
            className={cn(
              'text-xs text-danger',
              normalizeClassValue(classNames?.errorMessage),
            )}>
            {errorMessage}
          </p>
        ) : null}
      </div>
    )
  },
) as CompatInputComponentType

interface LegacyTextAreaProps extends Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'children' | 'onKeyDown'
> {
  [key: string]: unknown
  label?: ReactNode
  labelPlacement?: string
  classNames?: LegacyClassNames
  errorMessage?: ReactNode
  description?: ReactNode
  isInvalid?: boolean
  radius?: string
  size?: string
  variant?: string
  fullWidth?: boolean
  isDisabled?: boolean
  minRows?: number
  maxRows?: number
  onValueChange?: (value: string) => void
  onKeyDown?: (
    event: ReactKeyboardEvent<HTMLTextAreaElement | HTMLInputElement>,
  ) => void
}

export const TextArea = forwardRef<HTMLTextAreaElement, LegacyTextAreaProps>(
  (
    {
      label,
      classNames,
      errorMessage,
      description,
      isInvalid,
      radius,
      size: _size,
      variant: _variant,
      minRows,
      maxRows,
      fullWidth = true,
      className,
      isDisabled,
      disabled,
      onChange,
      onValueChange,
      onKeyDown,
      rows,
      style,
      ...props
    },
    ref,
  ) => {
    const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
      onChange?.(event)
      onValueChange?.(event.currentTarget.value)
    }

    return (
      <div
        className={cn(
          fullWidth && 'w-full',
          normalizeClassValue(classNames?.base),
          className,
        )}>
        {label ? (
          <label className={normalizeClassValue(classNames?.label)}>
            {label}
          </label>
        ) : null}
        <div
          className={cn(
            'rounded-md border border-foreground/10 px-3 py-2',
            radiusClassName(radius),
            isInvalid && 'border-danger',
            normalizeClassValue(classNames?.inputWrapper),
          )}>
          <textarea
            {...props}
            ref={ref}
            rows={rows ?? minRows}
            style={{
              maxHeight: maxRows ? `${maxRows * 2.5}rem` : undefined,
              ...(style as CSSProperties),
            }}
            disabled={isDisabled ?? disabled}
            className={cn(
              'min-h-24 w-full resize-none bg-transparent outline-none',
              normalizeClassValue(classNames?.input),
            )}
            onChange={handleChange}
            onKeyDown={
              onKeyDown as TextareaHTMLAttributes<HTMLTextAreaElement>['onKeyDown']
            }
          />
        </div>
        {description ? (
          <p
            className={cn(
              'text-xs text-muted-foreground',
              normalizeClassValue(classNames?.description),
            )}>
            {description}
          </p>
        ) : null}
        {errorMessage ? (
          <p
            className={cn(
              'text-xs text-danger',
              normalizeClassValue(classNames?.errorMessage),
            )}>
            {errorMessage}
          </p>
        ) : null}
      </div>
    )
  },
) as CompatTextAreaComponentType

export const Textarea = TextArea

Input.displayName = 'Input'
TextArea.displayName = 'TextArea'

interface LegacyListBoxItemProps extends LooseDivProps {
  textValue?: string
  classNames?: LegacyClassNames
  children?: ReactNode
}

export const ListBoxItem = ({
  classNames,
  className,
  children,
  ...props
}: LegacyListBoxItemProps) => {
  return (
    <HeroUI.ListBoxItem
      className={cn(normalizeClassValue(classNames?.base), className)}
      {...props}>
      {children}
    </HeroUI.ListBoxItem>
  )
}

export const SelectItem = ListBoxItem

interface LegacySelectProps<T extends object = object> extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'children' | 'onChange' | 'multiple' | 'size'
> {
  [key: string]: unknown
  label?: ReactNode
  labelPlacement?: string
  classNames?: LegacyClassNames
  placeholder?: string
  selectedKeys?: SharedSelection
  defaultSelectedKeys?: SharedSelection
  onSelectionChange?: (keys: SharedSelection) => void
  selectionMode?: 'single' | 'multiple'
  items?: Iterable<T>
  children?: ReactNode | ((item: T) => ReactNode)
  onChange?: (event: ChangeEvent<HTMLSelectElement>) => void
  onValueChange?: (value: string) => void
  renderValue?: (items: SelectedItems<T>) => ReactNode
  isMultiline?: boolean
  variant?: string
  radius?: string
  size?: string
  popoverProps?: Record<string, unknown>
  isDisabled?: boolean
  isInvalid?: boolean
  description?: ReactNode
  errorMessage?: ReactNode
  selectorIcon?: ReactNode
  disableAnimation?: boolean
  disallowEmptySelection?: boolean
}

export function Select<T extends object = object>({
  label,
  labelPlacement,
  classNames,
  className,
  placeholder,
  selectedKeys,
  defaultSelectedKeys,
  onSelectionChange,
  onChange,
  onValueChange,
  selectionMode = 'single',
  items,
  renderValue,
  isMultiline,
  variant,
  radius,
  size: _size,
  isDisabled,
  disabled,
  popoverProps,
  isInvalid,
  description,
  errorMessage,
  selectorIcon,
  disableAnimation: _disableAnimation,
  disallowEmptySelection,
  children,
  ...props
}: LegacySelectProps<T>) {
  const popoverClassNames =
    popoverProps &&
    typeof popoverProps === 'object' &&
    'classNames' in popoverProps &&
    popoverProps.classNames &&
    typeof popoverProps.classNames === 'object'
      ? (popoverProps.classNames as LegacyClassNames)
      : undefined
  const popoverClassName =
    popoverProps &&
    typeof popoverProps === 'object' &&
    'className' in popoverProps &&
    typeof popoverProps.className === 'string'
      ? popoverProps.className
      : undefined
  const popoverPlacement =
    popoverProps &&
    typeof popoverProps === 'object' &&
    'placement' in popoverProps &&
    typeof popoverProps.placement === 'string'
      ? popoverProps.placement
      : undefined
  const popoverPassthroughProps =
    popoverProps && typeof popoverProps === 'object'
      ? Object.fromEntries(
          Object.entries(popoverProps).filter(
            ([key]) =>
              key !== 'className' &&
              key !== 'classNames' &&
              key !== 'placement',
          ),
        )
      : undefined

  const handleSelectionChange = (keys: SharedSelection) => {
    onSelectionChange?.(keys)
    onValueChange?.(selectionFirstValue(keys))

    if (!onChange) return

    const values = selectionToArray(keys)
    onChange({
      currentTarget: {value: values[0] ?? ''},
      target: {value: values[0] ?? ''},
    } as ChangeEvent<HTMLSelectElement>)
  }

  return (
    <div
      className={cn(
        normalizeClassValue(classNames?.mainWrapper),
        normalizeClassValue(classNames?.base),
        className,
      )}>
      {label &&
      labelPlacement !== 'outside-left' &&
      labelPlacement !== 'inside' ? (
        <label className={normalizeClassValue(classNames?.label)}>
          {label}
        </label>
      ) : null}
      <div
        className={cn(
          labelPlacement === 'outside-left' && 'flex items-center gap-2',
        )}>
        {label && labelPlacement === 'outside-left' ? (
          <label className={normalizeClassValue(classNames?.label)}>
            {label}
          </label>
        ) : null}
        <HeroUI.Select
          {...props}
          placeholder={placeholder}
          selectedKeys={normalizeSelection(selectedKeys)}
          defaultSelectedKeys={normalizeSelection(defaultSelectedKeys)}
          onSelectionChange={handleSelectionChange}
          selectionMode={selectionMode}
          isDisabled={isDisabled ?? disabled}
          isInvalid={isInvalid}
          disallowEmptySelection={disallowEmptySelection}
          variant={mapSoftVariant(variant)}>
          <HeroUI.Select.Trigger
            className={cn(
              radiusClassName(radius),
              isInvalid && 'border-danger',
              normalizeClassValue(classNames?.trigger),
            )}>
            <div
              className={cn(
                'flex min-w-0 flex-1 items-center gap-2',
                isMultiline && 'flex-wrap',
                normalizeClassValue(classNames?.innerWrapper),
              )}>
              <HeroUI.Select.Value
                className={normalizeClassValue(classNames?.value)}>
                {renderValue
                  ? (values) => renderValue(selectRenderValueItems<T>(values))
                  : undefined}
              </HeroUI.Select.Value>
            </div>
            <HeroUI.Select.Indicator
              className={normalizeClassValue(classNames?.selectorIcon)}>
              {selectorIcon}
            </HeroUI.Select.Indicator>
          </HeroUI.Select.Trigger>
          <HeroUI.Select.Popover
            {...popoverPassthroughProps}
            placement={normalizeOverlayPlacement(popoverPlacement)}
            className={cn(
              normalizeClassValue(classNames?.popoverContent),
              normalizeClassValue(popoverClassNames?.content),
              popoverClassName,
            )}>
            <div className={normalizeClassValue(classNames?.listboxWrapper)}>
              <HeroUI.ListBox
                items={items}
                className={normalizeClassValue(classNames?.listbox)}>
                {children}
              </HeroUI.ListBox>
            </div>
          </HeroUI.Select.Popover>
        </HeroUI.Select>
      </div>
      {description || errorMessage ? (
        <div className={normalizeClassValue(classNames?.helperWrapper)}>
          {description ? (
            <p
              className={cn(
                'text-xs text-muted-foreground',
                normalizeClassValue(classNames?.description),
              )}>
              {description}
            </p>
          ) : null}
          {errorMessage ? (
            <p
              className={cn(
                'text-xs text-danger',
                normalizeClassValue(classNames?.errorMessage),
              )}>
              {errorMessage}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

interface LegacyModalProps {
  [key: string]: unknown
  children?: ReactNode
  isOpen?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  onClose?: () => void
  hideCloseButton?: boolean
  isDismissable?: boolean
  isKeyboardDismissDisabled?: boolean
  placement?: string
  size?: string
  backdrop?: string
  className?: string
  classNames?: LegacyClassNames
}

const modalContainerClassName = (placement?: string, size?: string) => {
  const placementClass =
    placement === 'top'
      ? 'items-start'
      : placement === 'bottom'
        ? 'items-end'
        : 'items-center'
  const sizeClass =
    size === 'sm'
      ? 'max-w-sm'
      : size === 'lg'
        ? 'max-w-3xl'
        : size === 'full'
          ? 'max-w-none'
          : 'max-w-xl'

  return cn(
    'relative z-10 mx-auto flex w-full justify-center p-4',
    placementClass,
    sizeClass,
  )
}

export const Modal = ({
  children,
  isOpen,
  defaultOpen = false,
  onOpenChange,
  onClose,
  isDismissable = true,
  isKeyboardDismissDisabled,
  placement,
  size,
  backdrop,
  className,
  classNames,
}: LegacyModalProps) => {
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const open = isOpen ?? internalOpen

  const close = useCallback(() => {
    if (isOpen === undefined) setInternalOpen(false)
    onOpenChange?.(false)
    onClose?.()
  }, [isOpen, onClose, onOpenChange])

  useEffect(() => {
    if (!open || isKeyboardDismissDisabled) return undefined

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [close, isKeyboardDismissDisabled, open])

  if (!open) return null

  return (
    <div className='fixed inset-0 z-50'>
      <div
        className={cn(
          'absolute inset-0 bg-black/50',
          backdrop === 'transparent' && 'bg-black/20',
          normalizeClassValue(classNames?.backdrop),
        )}
        onClick={isDismissable ? close : undefined}
      />
      <div className={modalContainerClassName(placement, size)}>
        <LegacyModalContext.Provider value={{close}}>
          <div
            className={cn(
              'w-full',
              normalizeClassValue(classNames?.base),
              className,
            )}>
            {children}
          </div>
        </LegacyModalContext.Provider>
      </div>
    </div>
  )
}

export const ModalContent = ({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  children?: ReactNode | ((onClose: () => void) => ReactNode)
}) => {
  const {close} = useContext(LegacyModalContext)

  return (
    <div
      className={cn('relative rounded-xl bg-background shadow-2xl', className)}
      {...props}>
      {typeof children === 'function' ? children(close) : children}
    </div>
  )
}

export const ModalHeader = ({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col gap-1 p-6 pb-0', className)} {...props}>
    {children}
  </div>
)

export const ModalBody = ({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('p-6', className)} {...props}>
    {children}
  </div>
)

export const ModalFooter = ({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex items-center justify-end gap-2 p-6 pt-0', className)}
    {...props}>
    {children}
  </div>
)

interface LegacyBadgeProps extends LooseSpanProps {
  content?: ReactNode
  isInvisible?: boolean
  size?: string
  classNames?: LegacyClassNames
  children?: ReactNode
}

export const Badge = ({
  content,
  isInvisible,
  classNames,
  className,
  children,
  ...props
}: LegacyBadgeProps) => {
  return (
    <span className={cn('relative inline-flex', className)} {...props}>
      {children}
      {!isInvisible && content ? (
        <span
          className={cn(
            'absolute -top-1 -right-1',
            normalizeClassValue(classNames?.badge),
          )}>
          {content}
        </span>
      ) : null}
    </span>
  )
}

interface LegacyChipProps extends LooseDivProps {
  startContent?: ReactNode
  endContent?: ReactNode
  radius?: string
  size?: string
  variant?: string
  color?: string
  classNames?: LegacyClassNames
  children?: ReactNode
}

export const Chip = ({
  startContent,
  endContent,
  radius,
  size,
  variant,
  classNames,
  className,
  children,
  ...props
}: LegacyChipProps) => {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1 text-sm',
        size === 'sm' && 'text-xs px-1.5 py-0.5',
        size === 'lg' && 'text-base px-3 py-1.5',
        radiusClassName(radius ?? 'full'),
        mapSoftVariant(variant) === 'soft' && 'bg-foreground/10',
        normalizeClassValue(classNames?.base),
        className,
      )}
      {...props}>
      {startContent}
      <span className={normalizeClassValue(classNames?.content)}>
        {children}
      </span>
      {endContent}
    </div>
  )
}

interface LegacyTooltipProps extends Omit<LooseDivProps, 'content'> {
  content?: ReactNode
  children?: ReactNode
  offset?: number
  showArrow?: boolean
  radius?: string
}

export const Tooltip = ({
  content,
  children,
  className,
  offset,
  showArrow,
  radius,
  placement,
  ...props
}: LegacyTooltipProps & {placement?: string}) => {
  if (!content) return <>{children}</>

  return (
    <HeroUI.Tooltip>
      <HeroUI.TooltipTrigger>{children}</HeroUI.TooltipTrigger>
      <HeroUI.TooltipContent
        className={cn(radiusClassName(radius), className)}
        placement={normalizeOverlayPlacement(placement)}
        offset={offset}
        showArrow={showArrow}
        {...props}>
        {content}
      </HeroUI.TooltipContent>
    </HeroUI.Tooltip>
  )
}

interface LegacyAvatarProps extends Omit<
  HTMLAttributes<HTMLSpanElement>,
  'color'
> {
  [key: string]: unknown
  src?: string
  alt?: string
  name?: ReactNode
  fallback?: ReactNode
  size?: string
  variant?: string
  children?: ReactNode
}

export const Avatar = ({
  src,
  alt,
  name,
  fallback,
  className,
  children,
  ...props
}: LegacyAvatarProps) => {
  return (
    <HeroUI.Avatar className={className} {...props}>
      {src ? (
        <HeroUI.AvatarImage
          src={src}
          alt={alt ?? (typeof name === 'string' ? name : 'Avatar')}
        />
      ) : null}
      <HeroUI.AvatarFallback>
        {fallback ?? initialsFromName(name)}
      </HeroUI.AvatarFallback>
      {children}
    </HeroUI.Avatar>
  )
}

interface LegacyImageProps extends LooseImageProps {
  removeWrapper?: boolean
  radius?: string
  isZoomed?: boolean
}

export const Image = ({className, radius, alt, ...props}: LegacyImageProps) => {
  return (
    <img
      alt={alt ?? ''}
      className={cn(radiusClassName(radius), className)}
      {...props}
    />
  )
}

interface LegacyUserProps extends LooseDivProps {
  avatarProps?: LegacyAvatarProps
  name?: ReactNode
  description?: ReactNode
  classNames?: LegacyClassNames
  children?: ReactNode
}

export const User = ({
  avatarProps,
  name,
  description,
  classNames,
  className,
  children,
  ...props
}: LegacyUserProps) => {
  return (
    <div
      className={cn(
        'flex items-center gap-3',
        normalizeClassValue(classNames?.base),
        className,
      )}
      {...props}>
      {avatarProps ? <Avatar {...avatarProps} /> : null}
      <div className='min-w-0'>
        {name ? (
          <div className={normalizeClassValue(classNames?.name)}>{name}</div>
        ) : null}
        {description ? (
          <div
            className={cn(
              'text-sm text-muted-foreground',
              normalizeClassValue(classNames?.description),
            )}>
            {description}
          </div>
        ) : null}
        {children}
      </div>
    </div>
  )
}

interface LegacyDisclosureOptions {
  isOpen?: boolean
  defaultOpen?: boolean
  onChange?: (isOpen: boolean) => void
  onOpen?: () => void
  onClose?: () => void
}

export const useDisclosure = ({
  isOpen,
  defaultOpen = false,
  onChange,
  onOpen,
  onClose,
}: LegacyDisclosureOptions = {}) => {
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const open = isOpen ?? internalOpen

  const setOpen = (nextOpen: boolean) => {
    if (isOpen === undefined) setInternalOpen(nextOpen)
    onChange?.(nextOpen)

    if (nextOpen) {
      onOpen?.()
    } else {
      onClose?.()
    }
  }

  return {
    isOpen: open,
    isControlled: isOpen !== undefined,
    onOpen: () => setOpen(true),
    onClose: () => setOpen(false),
    onOpenChange: () => setOpen(!open),
  }
}

interface LegacyDropdownProps extends LooseDivProps {
  placement?: string
  classNames?: LegacyClassNames
  children?: ReactNode
}

export const Dropdown = ({
  placement,
  classNames,
  children,
  ...props
}: LegacyDropdownProps) => {
  return (
    <LegacyDropdownContext.Provider
      value={{placement: normalizeOverlayPlacement(placement), classNames}}>
      <HeroUI.Dropdown.Root {...props}>{children}</HeroUI.Dropdown.Root>
    </LegacyDropdownContext.Provider>
  )
}

interface LegacyDropdownTriggerProps extends LooseDivProps {
  disabled?: boolean
  isDisabled?: boolean
  children?: ReactNode
}

export const DropdownTrigger = ({
  disabled,
  isDisabled,
  children,
  ...props
}: LegacyDropdownTriggerProps) => (
  <HeroUI.Dropdown.Trigger isDisabled={isDisabled ?? disabled} {...props}>
    {children}
  </HeroUI.Dropdown.Trigger>
)

interface LegacyDropdownMenuProps extends LooseDivProps {
  selectedKeys?: SharedSelection
  selectionMode?: 'single' | 'multiple'
  closeOnSelect?: boolean
  disallowEmptySelection?: boolean
  onSelectionChange?: (keys: SharedSelection) => void
  onAction?: (key: Key) => void
  children?: ReactNode
}

export const DropdownMenu = ({
  className,
  children,
  selectedKeys,
  onSelectionChange,
  ...props
}: LegacyDropdownMenuProps) => {
  const {placement, classNames} = useContext(LegacyDropdownContext)

  return (
    <HeroUI.Dropdown.Popover
      placement={placement}
      className={normalizeClassValue(classNames?.base)}>
      <HeroUI.Dropdown.Menu
        className={cn(normalizeClassValue(classNames?.content), className)}
        selectedKeys={normalizeSelection(selectedKeys)}
        onSelectionChange={(keys) =>
          onSelectionChange?.(keys as SharedSelection)
        }
        {...props}>
        {children}
      </HeroUI.Dropdown.Menu>
    </HeroUI.Dropdown.Popover>
  )
}

interface LegacyDropdownItemProps extends Omit<
  LooseButtonElementProps,
  'title'
> {
  title?: ReactNode
  textValue?: string
  startContent?: ReactNode
  endContent?: ReactNode
  onPress?: () => void
  classNames?: LegacyClassNames
  isReadOnly?: boolean
  children?: ReactNode
}

export const DropdownItem = ({
  title,
  startContent,
  endContent,
  onPress,
  classNames,
  className,
  isReadOnly: _isReadOnly,
  children,
  ...props
}: LegacyDropdownItemProps) => {
  return (
    <HeroUI.Dropdown.Item
      className={cn(normalizeClassValue(classNames?.base), className)}
      onAction={onPress}
      isDisabled={props.disabled}
      textValue={props.textValue}
      {...props}>
      {startContent}
      <span className={cn('flex-1', normalizeClassValue(classNames?.title))}>
        {title ?? children}
      </span>
      {endContent}
    </HeroUI.Dropdown.Item>
  )
}

interface LegacyDropdownSectionProps extends Omit<LooseDivProps, 'title'> {
  title?: ReactNode
  showDivider?: boolean
  children?: ReactNode
}

export const DropdownSection = ({
  title,
  showDivider: _showDivider,
  children,
  ...props
}: LegacyDropdownSectionProps) => {
  return (
    <HeroUI.Dropdown.Section title={title} {...props}>
      {children}
    </HeroUI.Dropdown.Section>
  )
}

interface LegacyNavbarProps extends HTMLAttributes<HTMLElement> {
  [key: string]: unknown
  onMenuOpenChange?: (open: boolean) => void
  children?: ReactNode
}

export const Navbar = ({
  onMenuOpenChange,
  className,
  children,
  ...props
}: LegacyNavbarProps) => {
  const [isMenuOpen, setMenuOpen] = useState(false)

  const handleSetMenuOpen = (open: boolean) => {
    setMenuOpen(open)
    onMenuOpenChange?.(open)
  }

  return (
    <LegacyNavbarContext.Provider
      value={{isMenuOpen, setMenuOpen: handleSetMenuOpen}}>
      <nav className={className} {...props}>
        {children}
      </nav>
    </LegacyNavbarContext.Provider>
  )
}

export const NavbarBrand = ({className, children, ...props}: LooseDivProps) => (
  <div className={className} {...props}>
    {children}
  </div>
)

export const NavbarContent = ({
  className,
  children,
  ...props
}: LooseDivProps) => (
  <div className={className} {...props}>
    {children}
  </div>
)

export const NavbarItem = ({className, children, ...props}: LooseDivProps) => (
  <div className={className} {...props}>
    {children}
  </div>
)

export const NavbarMenuItem = ({
  className,
  children,
  ...props
}: LooseDivProps) => (
  <div className={className} {...props}>
    {children}
  </div>
)

export const NavbarMenuToggle = ({
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) => {
  const {isMenuOpen, setMenuOpen} = useContext(LegacyNavbarContext)

  return (
    <button
      type='button'
      className={className}
      onClick={() => setMenuOpen(!isMenuOpen)}
      {...props}>
      {children}
    </button>
  )
}

export const NavbarMenu = ({className, children, ...props}: LooseDivProps) => {
  const {isMenuOpen} = useContext(LegacyNavbarContext)
  if (!isMenuOpen) return null

  return (
    <div className={className} {...props}>
      {children}
    </div>
  )
}

interface LegacyAccordionProps extends LooseDivProps {
  variant?: string
  itemClasses?: LegacyClassNames
  children?: ReactNode
}

export const Accordion = ({variant, ...props}: LegacyAccordionProps) => {
  return <HeroUI.Accordion.Root variant={mapSoftVariant(variant)} {...props} />
}

interface LegacyAccordionItemProps extends LooseDivProps {
  value?: string
  title?: ReactNode
  children?: ReactNode
}

export const AccordionItem = ({
  value,
  id,
  title,
  ...props
}: LegacyAccordionItemProps) => (
  <HeroUI.Accordion.Item id={id ?? value} title={title} {...props} />
)

interface LegacyCheckboxProps extends LooseDivProps {
  value?: string
  checked?: boolean
  defaultChecked?: boolean
  isSelected?: boolean
  isDisabled?: boolean
  size?: string
  color?: string
  radius?: string
  icon?: ReactNode
  classNames?: LegacyClassNames
  onValueChange?: (checked: boolean) => void
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void
  children?: ReactNode
}

const CheckboxBase = ({
  checked,
  defaultChecked,
  isSelected,
  isDisabled,
  disabled,
  size,
  color,
  radius,
  icon,
  classNames,
  className,
  onValueChange,
  onChange,
  children,
  ...props
}: LegacyCheckboxProps) => {
  const selected = isSelected ?? checked

  const handleChange = (nextChecked: boolean) => {
    onValueChange?.(nextChecked)
    onChange?.({
      currentTarget: {checked: nextChecked},
      target: {checked: nextChecked},
    } as ChangeEvent<HTMLInputElement>)
  }

  return (
    <HeroUI.Checkbox.Root
      isSelected={selected}
      defaultSelected={defaultChecked}
      isDisabled={isDisabled ?? disabled}
      onChange={handleChange}
      className={cn(normalizeClassValue(classNames?.base), className)}
      {...props}>
      <HeroUI.Checkbox.Control
        className={cn(
          'inline-flex items-center justify-center border transition-colors',
          checkboxSizeClassName(size),
          checkboxRadiusClassName(radius),
          checkboxColorClassName(color),
          normalizeClassValue(classNames?.wrapper),
        )}
        data-selected={selected ? 'true' : undefined}>
        <HeroUI.Checkbox.Indicator
          className={normalizeClassValue(classNames?.icon)}>
          {icon ?? (selected ? '✓' : null)}
        </HeroUI.Checkbox.Indicator>
      </HeroUI.Checkbox.Control>
      {children ? (
        <HeroUI.Checkbox.Content
          className={normalizeClassValue(classNames?.label)}>
          {children}
        </HeroUI.Checkbox.Content>
      ) : null}
    </HeroUI.Checkbox.Root>
  )
}

export const Checkbox = Object.assign(CheckboxBase, {
  Root: CheckboxBase,
  Control: HeroUI.Checkbox.Control,
  Indicator: HeroUI.Checkbox.Indicator,
  Content: HeroUI.Checkbox.Content,
}) as CompatCheckboxComponentType

interface LegacyCheckboxGroupProps extends LooseDivProps {
  value?: string[]
  onValueChange?: (value: string[]) => void
  classNames?: LegacyClassNames
  children?: ReactNode
}

export const CheckboxGroup = ({
  classNames,
  className,
  children,
  ...props
}: LegacyCheckboxGroupProps) => {
  return (
    <HeroUI.CheckboxGroup
      className={cn(normalizeClassValue(classNames?.base), className)}
      classNames={normalizeClassNames(classNames)}
      {...props}>
      {children}
    </HeroUI.CheckboxGroup>
  )
}

interface LegacySwitchProps extends LooseDivProps {
  color?: string
  isSelected?: boolean
  onValueChange?: (checked: boolean) => void
  children?: ReactNode
}

export const Switch = ({color: _color, ...props}: LegacySwitchProps) =>
  (<HeroUI.Switch {...props} />) as CompatSwitchComponentType

interface LegacyTableProps extends LooseDivProps {
  removeWrapper?: boolean
  isCompact?: boolean
  classNames?: LegacyClassNames
  children?: ReactNode
}

export const Table = forwardRef<HTMLDivElement, LegacyTableProps>(
  (
    {
      removeWrapper,
      isCompact: _isCompact,
      classNames,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const normalizedClassNames = normalizeClassNames(classNames)
    const rowColumns = useMemo(
      () => extractDynamicColumns(children),
      [children],
    )

    return (
      <TableCompatContext.Provider
        value={{classNames: normalizedClassNames, rowColumns}}>
        <HeroUI.Table.Root
          ref={ref}
          variant={removeWrapper ? 'secondary' : undefined}
          className={cn(normalizedClassNames?.base, className)}>
          <HeroUI.Table.ScrollContainer
            className={normalizedClassNames?.wrapper}>
            <HeroUI.Table.Content
              className={normalizedClassNames?.table}
              {...props}>
              {children}
            </HeroUI.Table.Content>
          </HeroUI.Table.ScrollContainer>
        </HeroUI.Table.Root>
      </TableCompatContext.Provider>
    )
  },
)

export const TableHeader = ({
  columns,
  className,
  children,
  ...props
}: LooseDivProps) => {
  const {classNames} = useContext(TableCompatContext)
  const normalizedColumns = useMemo(
    () => normalizeCollectionItems(columns),
    [columns],
  )

  return (
    <HeroUI.Table.Header
      className={cn(classNames?.thead, className)}
      columns={normalizedColumns}
      {...props}>
      {children}
    </HeroUI.Table.Header>
  )
}

interface LegacyTableColumnProps extends LooseDivProps {
  align?: 'start' | 'center' | 'end' | string
  children?: ReactNode
}

export const TableColumn = forwardRef<
  HTMLTableCellElement,
  LegacyTableColumnProps
>(({align, className, children, ...props}, ref) => {
  const {classNames} = useContext(TableCompatContext)

  return (
    <HeroUI.Table.Column
      ref={ref}
      className={cn(
        classNames?.th,
        align === 'center' && 'text-center',
        (align === 'end' || align === 'right') && 'text-right',
        className,
      )}
      {...props}>
      {children}
    </HeroUI.Table.Column>
  )
})

interface LegacyTableBodyProps<
  T extends object = object,
> extends LooseDivProps {
  emptyContent?: ReactNode
  items?: Iterable<T>
  children?: ReactNode | ((item: T) => ReactNode)
}

export const TableBody = <T extends object = object>({
  emptyContent,
  items,
  className,
  children,
  ...props
}: LegacyTableBodyProps<T>) => {
  const {classNames} = useContext(TableCompatContext)
  const normalizedItems = useMemo(
    () => normalizeCollectionItems(items),
    [items],
  )

  return (
    <HeroUI.Table.Body
      className={cn(classNames?.tbody, className)}
      renderEmptyState={emptyContent ? () => emptyContent : undefined}
      items={normalizedItems}
      {...props}>
      {children}
    </HeroUI.Table.Body>
  )
}

export const TableRow = ({
  columns,
  className,
  children,
  ...props
}: LooseDivProps) => {
  const {classNames, rowColumns} = useContext(TableCompatContext)
  const resolvedColumns = columns ?? rowColumns
  const resolvedChildren =
    typeof children === 'function'
      ? (column: {columnKey?: Key; id?: Key}) =>
          children(column?.columnKey ?? column?.id)
      : children

  return (
    <HeroUI.Table.Row
      className={cn(classNames?.tr, className)}
      columns={resolvedColumns}
      {...props}>
      {resolvedChildren}
    </HeroUI.Table.Row>
  )
}

export const TableCell = forwardRef<HTMLTableCellElement, LooseDivProps>(
  ({className, children, ...props}, ref) => {
    const {classNames} = useContext(TableCompatContext)

    return (
      <HeroUI.Table.Cell
        ref={ref}
        className={cn(classNames?.td, className)}
        {...props}>
        {children}
      </HeroUI.Table.Cell>
    )
  },
)

Table.displayName = 'Table'
TableColumn.displayName = 'TableColumn'
TableCell.displayName = 'TableCell'

interface LegacyPopoverProps extends LooseDivProps {
  placement?: string
  offset?: number
  crossOffset?: number
  showArrow?: boolean
  children?: ReactNode
}

export const Popover = ({
  placement,
  offset,
  crossOffset,
  showArrow,
  children,
  ...props
}: LegacyPopoverProps) => {
  return (
    <LegacyPopoverContext.Provider
      value={{
        placement: normalizeOverlayPlacement(placement),
        offset,
        crossOffset,
        showArrow,
      }}>
      <HeroUI.Popover.Root {...props}>{children}</HeroUI.Popover.Root>
    </LegacyPopoverContext.Provider>
  )
}

export const PopoverTrigger = ({children, ...props}: LooseDivProps) => (
  <HeroUI.Popover.Trigger {...props}>{children}</HeroUI.Popover.Trigger>
)

export const PopoverContent = ({
  children,
  className,
  ...props
}: LooseDivProps) => {
  const {placement, offset, crossOffset, showArrow} =
    useContext(LegacyPopoverContext)

  return (
    <HeroUI.Popover.Content
      className={className}
      placement={placement}
      offset={offset}
      crossOffset={crossOffset}
      {...props}>
      {showArrow ? <HeroUI.Popover.Arrow /> : null}
      {children}
    </HeroUI.Popover.Content>
  )
}

interface LegacyDrawerProps extends LooseDivProps {
  isOpen?: boolean
  open?: boolean
  placement?: string
  onOpenChange?: (open: boolean) => void
  children?: ReactNode
}

export const Drawer = ({
  isOpen,
  open,
  placement,
  onOpenChange,
  children,
  ...props
}: LegacyDrawerProps) => {
  return (
    <LegacyDrawerContext.Provider value={{placement}}>
      <HeroUI.Drawer.Root
        open={open ?? isOpen}
        onOpenChange={onOpenChange}
        {...props}>
        {children}
      </HeroUI.Drawer.Root>
    </LegacyDrawerContext.Provider>
  )
}

export const DrawerContent = ({children, ...props}: LooseDivProps) => {
  const {placement} = useContext(LegacyDrawerContext)
  return (
    <HeroUI.Drawer.Content placement={placement} {...props}>
      {children}
    </HeroUI.Drawer.Content>
  )
}

export const DrawerHeader = ({children, ...props}: LooseDivProps) => (
  <HeroUI.Drawer.Header {...props}>{children}</HeroUI.Drawer.Header>
)

export const DrawerBody = ({children, ...props}: LooseDivProps) => (
  <HeroUI.Drawer.Body {...props}>{children}</HeroUI.Drawer.Body>
)

export const DrawerFooter = ({children, ...props}: LooseDivProps) => (
  <HeroUI.Drawer.Footer {...props}>{children}</HeroUI.Drawer.Footer>
)

interface LegacyProgressProps extends LooseDivProps {
  value?: number
  maxValue?: number
  classNames?: LegacyClassNames
}

export const Progress = ({
  value = 0,
  maxValue = 100,
  classNames,
  className,
  ...props
}: LegacyProgressProps) => {
  const pct =
    maxValue > 0 ? Math.max(0, Math.min(100, (value / maxValue) * 100)) : 0

  return (
    <div
      className={cn(
        'h-full w-full overflow-hidden rounded-full bg-foreground/10',
        normalizeClassValue(classNames?.track),
        className,
      )}
      {...props}>
      <div
        className={cn(
          'h-full rounded-full bg-brand transition-[width] duration-300',
          normalizeClassValue(classNames?.indicator),
        )}
        style={{width: `${pct}%`}}
      />
    </div>
  )
}

interface LegacyFlatTabProps extends LooseDivProps {
  value: string
  title?: ReactNode
  children?: ReactNode
}

const FlatTab = ({children}: LegacyFlatTabProps) => <>{children}</>
;(FlatTab as {[key: string]: unknown})[LegacyFlatTabsMarker] = true

const isFlatTabElement = (
  node: ReactNode,
): node is ReactElement<LegacyFlatTabProps> => {
  return Boolean(
    isValidElement(node) &&
    typeof node.type === 'function' &&
    (node.type as {[key: string]: unknown})[LegacyFlatTabsMarker],
  )
}

interface LegacyTabsProps extends LooseDivProps {
  title?: ReactNode
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  children?: ReactNode
}

const TabsBase = ({
  title,
  value,
  defaultValue,
  onValueChange,
  className,
  children,
  ...props
}: LegacyTabsProps) => {
  const childArray = Children.toArray(children)
  const flatTabs = childArray.filter(isFlatTabElement)
  const [internalValue, setInternalValue] = useState(defaultValue)
  const selectedValue = value ?? internalValue ?? flatTabs[0]?.props.value

  const handleValueChange = (nextValue: string) => {
    if (value === undefined) setInternalValue(nextValue)
    onValueChange?.(nextValue)
  }

  if (flatTabs.length > 0 && flatTabs.length === childArray.length) {
    const activeTab =
      flatTabs.find((tab) => tab.props.value === selectedValue) ?? flatTabs[0]

    return (
      <div className={className} {...props}>
        {title ? <div className='mb-3'>{title}</div> : null}
        <div className='flex flex-col gap-4'>
          <div className='inline-flex rounded-lg border border-foreground/10 p-1'>
            {flatTabs.map((tab) => {
              const isActive = tab.props.value === activeTab?.props.value
              return (
                <button
                  key={tab.props.value}
                  type='button'
                  onClick={() => handleValueChange(tab.props.value)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-sm transition-colors',
                    isActive && 'bg-foreground text-background',
                  )}>
                  {tab.props.title ?? tab.props.value}
                </button>
              )
            })}
          </div>
          <div>{activeTab?.props.children}</div>
        </div>
      </div>
    )
  }

  return (
    <HeroUI.Tabs.Root
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      className={className}
      {...props}>
      {children}
    </HeroUI.Tabs.Root>
  )
}

export const Tabs = Object.assign(TabsBase, {
  Root: ({children, ...props}: LooseDivProps) => (
    <HeroUI.Tabs.Root {...props}>{children}</HeroUI.Tabs.Root>
  ),
  ListContainer: ({children, ...props}: LooseDivProps) => (
    <HeroUI.Tabs.ListContainer {...props}>{children}</HeroUI.Tabs.ListContainer>
  ),
  List: ({children, ...props}: LooseDivProps) => (
    <HeroUI.Tabs.List {...props}>{children}</HeroUI.Tabs.List>
  ),
  Tab: ({children, ...props}: LooseDivProps) => (
    <HeroUI.Tabs.Tab {...props}>{children}</HeroUI.Tabs.Tab>
  ),
  Indicator: (props: LooseDivProps) => <HeroUI.Tabs.Indicator {...props} />,
  Separator: (props: LooseDivProps) => <HeroUI.Tabs.Separator {...props} />,
  Panel: ({children, ...props}: LooseDivProps) => (
    <HeroUI.Tabs.Panel {...props}>{children}</HeroUI.Tabs.Panel>
  ),
})

export const Tab = FlatTab

interface LegacyBreadcrumbsProps extends LooseDivProps {
  itemClasses?: LegacyClassNames
  children?: ReactNode
}

export const Breadcrumbs = ({
  itemClasses: _itemClasses,
  children,
  ...props
}: LegacyBreadcrumbsProps) => (
  <HeroUI.Breadcrumbs.Root {...props}>{children}</HeroUI.Breadcrumbs.Root>
)

export const BreadcrumbsItem = ({children, ...props}: LooseDivProps) => (
  <HeroUI.Breadcrumbs.Item {...props}>{children}</HeroUI.Breadcrumbs.Item>
)

export const Slider = ({children, ...props}: LooseDivProps) => (
  <HeroUI.Slider.Root {...props}>{children}</HeroUI.Slider.Root>
)

export const Divider = HeroUI.Separator
export const Separator = HeroUI.Separator

interface LegacyInputOTPProps extends LooseDivProps {
  value?: string
  length?: number
  onComplete?: (value: string) => void
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void
}

export const InputOTP = ({
  value = '',
  length = 6,
  className,
  onChange,
  onComplete,
  ...props
}: LegacyInputOTPProps) => {
  return (
    <input
      {...props}
      value={value}
      maxLength={length}
      className={className as string | undefined}
      onChange={(event) => {
        const nextValue = event.currentTarget.value
        onChange?.(event)
        if (nextValue.length === length) onComplete?.(nextValue)
      }}
    />
  )
}

export const InputOtp = InputOTP
export const BreadcrumbItem = BreadcrumbsItem

export const extendVariants = <TProps extends {className?: string}>(
  Component: ElementType,
  config: ExtendVariantsConfig,
) => {
  const ExtendedComponent = ({
    className,
    ...props
  }: TProps & {[key: string]: unknown}) => {
    const appliedClasses = [className]

    Object.entries(config.variants ?? {}).forEach(
      ([variantName, variantMap]) => {
        const selectedVariant = String(
          props[variantName] ?? config.defaultVariants?.[variantName] ?? '',
        )
        const variantConfig = variantMap[selectedVariant]
        if (variantConfig?.base) appliedClasses.push(variantConfig.base)
        if (variantConfig?.class) appliedClasses.push(variantConfig.class)
      },
    )
    ;(config.compoundVariants ?? []).forEach((compoundVariant) => {
      const matches = Object.entries(compoundVariant).every(([key, value]) => {
        if (key === 'class') return true
        return (
          String(props[key] ?? config.defaultVariants?.[key] ?? '') === value
        )
      })

      if (matches && compoundVariant.class) {
        appliedClasses.push(compoundVariant.class)
      }
    })

    return <Component className={cn(appliedClasses)} {...props} />
  }

  return ExtendedComponent
}

export type ButtonProps = LegacyButtonProps
export type CardProps = LegacyCardProps
export type InputProps = CompatInputProps
export type TextAreaProps = CompatTextAreaProps
export type SelectProps<T extends object = object> = CompatSelectProps<T>
export type ChipProps = LegacyChipProps
export type BadgeProps = LegacyBadgeProps
export type TooltipProps = LegacyTooltipProps
export type AvatarProps = LegacyAvatarProps
export type ImageProps = LegacyImageProps
export type ModalProps = LegacyModalProps
export type SwitchProps = CompatSwitchProps

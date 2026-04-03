import type {
  ChangeEvent,
  ForwardRefExoticComponent,
  HTMLAttributes,
  InputHTMLAttributes,
  Key,
  ReactElement,
  KeyboardEvent as ReactKeyboardEvent,
  ReactNode,
  RefAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'

export type LegacyClassValue =
  | string
  | false
  | null
  | undefined
  | LegacyClassValue[]

export type LegacyClassNames = Record<string, LegacyClassValue> | undefined

export type SharedSelection = Set<Key> | 'all'
export type LegacySelectedKeys = SharedSelection | Array<Key>

type BivariantEventHandler<T> = {
  bivarianceHack(event: T): void
}['bivarianceHack']

export interface SelectedItem<T = unknown> {
  key: Key
  textValue?: string
  rendered?: ReactNode
  value?: T
}

export type SelectedItems<T = unknown> = SelectedItem<T>[]

export interface LegacyInputProps extends Omit<
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

export type InputComponentType = ForwardRefExoticComponent<
  LegacyInputProps & RefAttributes<HTMLInputElement>
>

export interface LegacyTextAreaProps extends Omit<
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
  onKeyDown?: BivariantEventHandler<
    | ReactKeyboardEvent<HTMLTextAreaElement>
    | ReactKeyboardEvent<HTMLInputElement>
  >
}

export type TextAreaComponentType = ForwardRefExoticComponent<
  LegacyTextAreaProps & RefAttributes<HTMLTextAreaElement>
>

export interface LegacySelectProps<
  T extends object = Record<string, unknown>,
> extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'children' | 'onChange' | 'multiple' | 'size'
> {
  [key: string]: unknown
  label?: ReactNode
  classNames?: LegacyClassNames
  placeholder?: string
  selectedKeys?: LegacySelectedKeys
  defaultSelectedKeys?: LegacySelectedKeys
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
}

export type SelectComponentType = <T extends object = Record<string, unknown>>(
  props: LegacySelectProps<T>,
) => ReactElement | null

export interface LegacyCheckboxEvent {
  target: {checked: boolean; value: string}
  currentTarget: {checked: boolean; value: string}
}

export interface LegacyCheckboxProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'onChange'
> {
  [key: string]: unknown
  children?: ReactNode
  value?: string
  checked?: boolean
  isSelected?: boolean
  defaultSelected?: boolean
  size?: string
  radius?: string
  color?: string
  icon?: ReactNode
  classNames?: LegacyClassNames
  isDisabled?: boolean
  onValueChange?: (checked: boolean) => void
  onChange?: (event: LegacyCheckboxEvent) => void
}

export type CheckboxComponentType = (
  props: LegacyCheckboxProps,
) => ReactElement | null

export interface LegacySwitchProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'onChange'
> {
  [key: string]: unknown
  children?: ReactNode
  isSelected?: boolean
  defaultSelected?: boolean
  color?: string
  isDisabled?: boolean
  onValueChange?: (checked: boolean) => void
  onChange?: (event: LegacyCheckboxEvent) => void
}

export type SwitchComponentType = (
  props: LegacySwitchProps,
) => ReactElement | null

'use client'

import {cn} from '@/lib/utils'
import type {
  ChangeEvent,
  ComponentType,
  CSSProperties,
  ElementType,
  HTMLAttributes,
  ImgHTMLAttributes,
  InputHTMLAttributes,
  Key,
  ReactElement,
  ReactNode,
} from 'react'
import type {
  CheckboxComponentType,
  InputComponentType,
  LegacyCheckboxProps,
  LegacyClassNames,
  LegacyInputProps,
  LegacySelectedKeys,
  LegacySelectProps,
  LegacySwitchProps,
  LegacyTextAreaProps,
  SelectComponentType,
  SelectedItem,
  SelectedItems,
  SharedSelection,
  SwitchComponentType,
  TextAreaComponentType,
} from './heroui-compat-types'
import * as runtime from './heroui-runtime'

export * from '@heroui/react'
export {cn}

type BroadComponent<P = Record<string, unknown>> = (
  props: P,
) => ReactElement | null

export interface ButtonProps extends HTMLAttributes<HTMLButtonElement> {
  [key: string]: unknown
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

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  [key: string]: unknown
  as?: ElementType
  href?: string
  radius?: string
  shadow?: string
  children?: ReactNode
}

export interface ChipProps extends HTMLAttributes<HTMLDivElement> {
  [key: string]: unknown
  startContent?: ReactNode
  endContent?: ReactNode
  radius?: string
  variant?: string
  color?: string
  size?: string
  icon?: ReactNode
  classNames?: LegacyClassNames
  children?: ReactNode
}

export interface BadgeProps extends Omit<
  HTMLAttributes<HTMLSpanElement>,
  'content'
> {
  [key: string]: unknown
  content?: ReactNode
  isInvisible?: boolean
  classNames?: LegacyClassNames
  size?: string
  shape?: string
  children?: ReactNode
}

export interface TooltipProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'content'
> {
  [key: string]: unknown
  content?: ReactNode
  children?: ReactNode
  offset?: number
  showArrow?: boolean
  radius?: string
  classNames?: LegacyClassNames
}

export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  [key: string]: unknown
  src?: string
  alt?: string
  name?: ReactNode
  fallback?: ReactNode
  size?: string
  variant?: string
  children?: ReactNode
}

export interface ImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  [key: string]: unknown
  removeWrapper?: boolean
  radius?: string
  isZoomed?: boolean
}

export interface UserProps extends HTMLAttributes<HTMLDivElement> {
  [key: string]: unknown
  avatarProps?: AvatarProps
  name?: ReactNode
  description?: ReactNode
  classNames?: LegacyClassNames
  children?: ReactNode
}

export interface ModalProps {
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

export interface ModalContentProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children'
> {
  children?: ReactNode | ((onClose: () => void) => ReactNode)
}

export interface ListBoxItemProps extends HTMLAttributes<HTMLDivElement> {
  [key: string]: unknown
  textValue?: string
  classNames?: LegacyClassNames
  children?: ReactNode
}

export interface DropdownMenuProps<T extends object = object> extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children'
> {
  children?: ReactNode | ((item: T) => ReactNode)
  items?: Iterable<T>
  onAction?: (key: Key) => void
  onSelectionChange?: (keys: SharedSelection) => void
  selectedKeys?: LegacySelectedKeys
  selectionMode?: 'single' | 'multiple'
  closeOnSelect?: boolean
  disallowEmptySelection?: boolean
}

export interface TableProps extends HTMLAttributes<HTMLDivElement> {
  [key: string]: unknown
  removeWrapper?: boolean
  isCompact?: boolean
  classNames?: LegacyClassNames
  selectionMode?: 'none' | 'single' | 'multiple'
  selectedKeys?: LegacySelectedKeys
  onSelectionChange?: (keys: SharedSelection) => void
  children?: ReactNode
}

export interface TableHeaderProps<T extends object = object> extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children'
> {
  columns?: Iterable<T>
  children?: ReactNode | ((column: T) => ReactNode)
}

export interface TableBodyProps<T extends object = object> extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children'
> {
  emptyContent?: ReactNode
  items?: Iterable<T>
  children?: ReactNode | ((item: T) => ReactNode)
}

export interface TableColumnProps extends HTMLAttributes<HTMLTableCellElement> {
  align?: 'start' | 'center' | 'end' | 'left' | 'right' | string
  children?: ReactNode
}

export interface TableRowProps extends Omit<
  HTMLAttributes<HTMLTableRowElement>,
  'children'
> {
  children?: ReactNode | ((columnKey: Key) => ReactNode)
}

export interface PopoverProps extends HTMLAttributes<HTMLDivElement> {
  isOpen?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  placement?: string
  offset?: number
  crossOffset?: number
  showArrow?: boolean
  children?: ReactNode
}

export interface DrawerProps extends HTMLAttributes<HTMLDivElement> {
  isOpen?: boolean
  open?: boolean
  placement?: string
  size?: string
  backdrop?: string
  motionProps?: Record<string, unknown>
  onOpenChange?: (open: boolean) => void
  children?: ReactNode
}

export interface DrawerContentProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children'
> {
  children?: ReactNode | ((onClose: () => void) => ReactNode)
  style?: CSSProperties
}

export interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value?: number
  maxValue?: number
  color?: string
  showValueLabel?: boolean
  valueLabel?: ReactNode
  classNames?: LegacyClassNames
}

export interface TabsProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'title'
> {
  title?: ReactNode
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  children?: ReactNode
}

export interface TabProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'title'
> {
  value: string
  title?: ReactNode
  children?: ReactNode
}

export interface BreadcrumbsProps extends HTMLAttributes<HTMLElement> {
  itemClasses?: LegacyClassNames
  children?: ReactNode
}

export interface LinkProps extends HTMLAttributes<HTMLElement> {
  [key: string]: unknown
  as?: ElementType
  href?: string
  color?: string
  size?: string
  children?: ReactNode
}

export interface AccordionItemProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'title'
> {
  value?: string
  title?: ReactNode
  children?: ReactNode
}

export interface DropdownTriggerProps extends HTMLAttributes<HTMLDivElement> {
  disabled?: boolean
  isDisabled?: boolean
  children?: ReactNode
}

export interface BreadcrumbItemProps extends HTMLAttributes<HTMLElement> {
  href?: string
  children?: ReactNode
}

export interface InputOTPProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'size'
> {
  [key: string]: unknown
  value?: string
  length?: number
  size?: string
  radius?: string
  variant?: string
  classNames?: LegacyClassNames
  errorMessage?: ReactNode
  onComplete?: (value: string) => void
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void
}

export interface ExtendVariantsConfig {
  variants?: Record<string, Record<string, {base?: string; class?: string}>>
  defaultVariants?: Record<string, string>
  compoundVariants?: Array<Record<string, string> & {class?: string}>
}

export const Button = runtime.Button as BroadComponent<ButtonProps>
export const Link = runtime.Link as BroadComponent<LinkProps>
export const Card = runtime.Card as BroadComponent<CardProps>
export const CardHeader = runtime.CardHeader as BroadComponent<
  HTMLAttributes<HTMLDivElement>
>
export const CardContent = runtime.CardContent as BroadComponent<
  HTMLAttributes<HTMLDivElement>
>
export const CardBody = runtime.CardBody as BroadComponent<
  HTMLAttributes<HTMLDivElement>
>
export const CardFooter = runtime.CardFooter as BroadComponent<
  HTMLAttributes<HTMLDivElement>
>

export const Input = runtime.Input as InputComponentType
export const TextArea = runtime.TextArea as TextAreaComponentType
export const Textarea = runtime.Textarea as TextAreaComponentType

export const ListBoxItem =
  runtime.ListBoxItem as BroadComponent<ListBoxItemProps>
export const SelectItem = runtime.SelectItem as BroadComponent<ListBoxItemProps>
export const Select = runtime.Select as SelectComponentType

export const Modal = runtime.Modal as BroadComponent<ModalProps>
export const ModalContent =
  runtime.ModalContent as BroadComponent<ModalContentProps>
export const ModalHeader = runtime.ModalHeader as BroadComponent<
  HTMLAttributes<HTMLDivElement>
>
export const ModalBody = runtime.ModalBody as BroadComponent<
  HTMLAttributes<HTMLDivElement>
>
export const ModalFooter = runtime.ModalFooter as BroadComponent<
  HTMLAttributes<HTMLDivElement>
>

export const Badge = runtime.Badge as BroadComponent<BadgeProps>
export const Chip = runtime.Chip as BroadComponent<ChipProps>
export const Tooltip = runtime.Tooltip as BroadComponent<TooltipProps>
export const Avatar = runtime.Avatar as BroadComponent<AvatarProps>
export const Image = runtime.Image as BroadComponent<ImageProps>
export const User = runtime.User as BroadComponent<UserProps>
export const useDisclosure = runtime.useDisclosure as (options?: {
  isOpen?: boolean
  defaultOpen?: boolean
  onChange?: (isOpen: boolean) => void
  onOpen?: () => void
  onClose?: () => void
}) => {
  isOpen: boolean
  isControlled: boolean
  onOpen: () => void
  onClose: () => void
  onOpenChange: () => void
}

export const Dropdown = runtime.Dropdown as BroadComponent<
  Record<string, unknown>
>
export const DropdownTrigger =
  runtime.DropdownTrigger as BroadComponent<DropdownTriggerProps>
export const DropdownMenu = runtime.DropdownMenu as <T extends object = object>(
  props: DropdownMenuProps<T>,
) => ReactElement | null
export const DropdownItem = runtime.DropdownItem as BroadComponent<
  HTMLAttributes<HTMLButtonElement> & {
    [key: string]: unknown
    title?: ReactNode
    textValue?: string
    startContent?: ReactNode
    endContent?: ReactNode
    onPress?: () => void
    classNames?: LegacyClassNames
    isReadOnly?: boolean
    variant?: string
    isSelected?: boolean
    children?: ReactNode
  }
>
export const DropdownSection = runtime.DropdownSection as BroadComponent<
  HTMLAttributes<HTMLDivElement> & {
    title?: ReactNode
    showDivider?: boolean
  }
>

export const Navbar = runtime.Navbar as BroadComponent<Record<string, unknown>>
export const NavbarBrand = runtime.NavbarBrand as BroadComponent<
  HTMLAttributes<HTMLDivElement>
>
export const NavbarContent = runtime.NavbarContent as BroadComponent<
  HTMLAttributes<HTMLDivElement> & {justify?: string}
>
export const NavbarItem = runtime.NavbarItem as BroadComponent<
  HTMLAttributes<HTMLDivElement> & {isActive?: boolean}
>
export const NavbarMenuItem = runtime.NavbarMenuItem as BroadComponent<
  HTMLAttributes<HTMLDivElement>
>
export const NavbarMenuToggle = runtime.NavbarMenuToggle as BroadComponent<
  HTMLAttributes<HTMLButtonElement>
>
export const NavbarMenu = runtime.NavbarMenu as BroadComponent<
  HTMLAttributes<HTMLDivElement>
>

export const Accordion = runtime.Accordion as BroadComponent<
  Record<string, unknown>
>
export const AccordionItem =
  runtime.AccordionItem as BroadComponent<AccordionItemProps>

export type CheckboxProps = LegacyCheckboxProps
export const Checkbox = runtime.Checkbox as CheckboxComponentType & {
  Root: CheckboxComponentType
  Control: ComponentType<Record<string, unknown>>
  Indicator: ComponentType<Record<string, unknown>>
  Content: ComponentType<Record<string, unknown>>
}
export const CheckboxGroup = runtime.CheckboxGroup as BroadComponent<
  HTMLAttributes<HTMLDivElement> & {
    value?: string[]
    defaultValue?: string[]
    orientation?: string
    classNames?: LegacyClassNames
    onValueChange?: (selected: string[]) => void
  }
>
export type SwitchProps = LegacySwitchProps
export const Switch = runtime.Switch as SwitchComponentType

export const Table = runtime.Table as BroadComponent<TableProps>
export const TableHeader = runtime.TableHeader as <T extends object = object>(
  props: TableHeaderProps<T>,
) => ReactElement | null
export const TableColumn =
  runtime.TableColumn as unknown as BroadComponent<TableColumnProps>
export const TableBody = runtime.TableBody as <T extends object = object>(
  props: TableBodyProps<T>,
) => ReactElement | null
export const TableRow = runtime.TableRow as BroadComponent<TableRowProps>
export const TableCell = runtime.TableCell as unknown as BroadComponent<
  HTMLAttributes<HTMLTableCellElement>
>

export const Popover = runtime.Popover as BroadComponent<PopoverProps>
export const PopoverTrigger = runtime.PopoverTrigger as BroadComponent<
  HTMLAttributes<HTMLDivElement> & {asChild?: boolean}
>
export const PopoverContent = runtime.PopoverContent as BroadComponent<
  HTMLAttributes<HTMLDivElement>
>

export const Drawer = runtime.Drawer as BroadComponent<DrawerProps>
export const DrawerContent =
  runtime.DrawerContent as BroadComponent<DrawerContentProps>
export const DrawerHeader = runtime.DrawerHeader as BroadComponent<
  HTMLAttributes<HTMLDivElement>
>
export const DrawerBody = runtime.DrawerBody as BroadComponent<
  HTMLAttributes<HTMLDivElement>
>
export const DrawerFooter = runtime.DrawerFooter as BroadComponent<
  HTMLAttributes<HTMLDivElement>
>

export const Progress = runtime.Progress as BroadComponent<ProgressProps>

export const Tabs = runtime.Tabs as {
  (props: TabsProps): ReactElement | null
  Root: BroadComponent<HTMLAttributes<HTMLDivElement>>
  ListContainer: BroadComponent<HTMLAttributes<HTMLDivElement>>
  List: BroadComponent<HTMLAttributes<HTMLDivElement>>
  Tab: BroadComponent<HTMLAttributes<HTMLDivElement>>
  Indicator: BroadComponent<HTMLAttributes<HTMLDivElement>>
  Separator: BroadComponent<HTMLAttributes<HTMLDivElement>>
  Panel: BroadComponent<HTMLAttributes<HTMLDivElement>>
}
export const Tab = runtime.Tab as BroadComponent<TabProps>

export const Breadcrumbs =
  runtime.Breadcrumbs as BroadComponent<BreadcrumbsProps>
export const BreadcrumbsItem =
  runtime.BreadcrumbsItem as BroadComponent<BreadcrumbItemProps>
export const BreadcrumbItem =
  runtime.BreadcrumbItem as BroadComponent<BreadcrumbItemProps>

export const Slider = runtime.Slider as BroadComponent<{
  label?: ReactNode
  minValue?: number
  maxValue?: number
  step?: number
  showSteps?: boolean
  value?: number | number[]
  defaultValue?: number | number[]
  getValue?: (value: number | number[]) => ReactNode
  classNames?: LegacyClassNames
  onChange?: (value: number | number[]) => void
  children?: ReactNode
}>

export const Divider = runtime.Divider
export const Separator = runtime.Separator

export const InputOTP = runtime.InputOTP as BroadComponent<InputOTPProps>
export const InputOtp = runtime.InputOtp as typeof InputOTP

export const extendVariants = runtime.extendVariants as <
  TProps extends {
    className?: string
    children?: ReactNode
  },
>(
  Component: ElementType,
  config: ExtendVariantsConfig,
) => (props: TProps & {[key: string]: unknown}) => ReactElement | null

export type InputProps = LegacyInputProps
export type TextAreaProps = LegacyTextAreaProps
export type SelectProps<T extends object = object> = LegacySelectProps<T>
export type ButtonPropsAlias = ButtonProps
export type CardPropsAlias = CardProps
export type ChipPropsAlias = ChipProps
export type BadgePropsAlias = BadgeProps
export type TooltipPropsAlias = TooltipProps
export type AvatarPropsAlias = AvatarProps
export type ImagePropsAlias = ImageProps
export type ModalPropsAlias = ModalProps
export type {SelectedItem, SelectedItems, SharedSelection}
